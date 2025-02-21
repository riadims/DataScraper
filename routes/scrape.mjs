import express from "express";
import puppeteer from "puppeteer";
import extractData from "../utils/parser.mjs";
import logger from "../utils/logger.mjs";
import { promises as fs } from "fs";

const router = express.Router();
let languagesCache = null;

async function getLanguages() {
  if (!languagesCache) {
    const data = await fs.readFile(
      new URL("../utils/keypages.json", import.meta.url),
      "utf-8"
    );
    languagesCache = JSON.parse(data);
  }
  return languagesCache;
}

/**
 * POST /scrape
 * Scrapes contact information from all provided URLs.
 */
router.post("/", async (req, res) => {
  const { urls, country } = req.body;
  logger.log(`🕷 Scraper received URLs: ${urls.length} for country: ${country}`);

  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    urls.some((urlObj) => typeof urlObj.url !== "string")
  ) {
    logger.error("❌ Invalid URLs received:", urls);
    return res.status(400).json({
      error: "Invalid URL format. Expecting an array of { title, url } objects.",
    });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
      protocolTimeout: 120000,
    });

    const languages = await getLanguages();
    const englishLanguage = languages.countries.find(
      (lang) => lang.name === "England"
    );
    const selectedLanguage = languages.countries.find(
      (lang) => lang.name === country
    );

    if (!selectedLanguage) {
      logger.error(`❌ No language found for ${country}`);
      return res
        .status(400)
        .json({ error: `No language data available for ${country}` });
    }

    const combinedRegexString = selectedLanguage.contact
      .concat(
        selectedLanguage.about_us,
        selectedLanguage.cart,
        selectedLanguage.checkout,
        selectedLanguage.customer_support
      )
      .concat(
        englishLanguage.contact,
        englishLanguage.about_us,
        englishLanguage.checkout,
        englishLanguage.customer_support
      )
      .join("|");

    const results = [];

    for (const { url, title } of urls) {
      logger.log(`🌍 Navigating to: ${url}`);
      if (!url || !url.startsWith("http")) {
        logger.error(`⚠️ Skipping invalid URL: ${url}`);
        results.push({
          name: title || "N/A",
          url: "Invalid URL",
          emails: [],
          phones: [],
        });
        continue;
      }

      let emails = [];
      let phones = [];

      try {
        const page = await browser.newPage();

        // ✅ Block unnecessary resources (images, fonts, stylesheets, scripts)
        await page.setRequestInterception(true);
        page.on("request", (req) => {
          if (["image", "stylesheet", "font", "script"].includes(req.resourceType())) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        const contactLinks = await page.evaluate((regexStr) => {
          const regex = new RegExp(regexStr, "i");
          return Array.from(document.querySelectorAll("a"))
            .filter((a) => regex.test(a.innerText.trim()))
            .map((a) => a.href);
        }, combinedRegexString);

        logger.log(`🔗 Found contact pages: ${contactLinks}`);
        contactLinks.push(url);

        for (const contactLink of contactLinks) {
          if (phones.length >= 4) {
            logger.log(`✅ Found 4 phone numbers, skipping further contact pages for ${url}`);
            break;
          }

          try {
            await page.goto(contactLink, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });

            const extractedText = await page.evaluate(() => {
              const textFromTags = (selector) =>
                Array.from(document.querySelectorAll(selector))
                  .map((el) => el.innerText.trim())
                  .filter(Boolean)
                  .join("\n");

              const textFromAttributes = (selector, attr) =>
                Array.from(document.querySelectorAll(selector))
                  .map((el) => el.getAttribute(attr) || "")
                  .filter(Boolean)
                  .join("\n");

              return `
                ${document.body.innerText} 
                ${textFromTags("footer, header, span, div, p, li, a")}
                ${textFromAttributes("img", "alt")} 
                ${textFromAttributes("a[href^='tel:']", "href")}
              `;
            });

            const { emails: extractedEmails, phones: extractedPhones } =
              extractData(extractedText);

            emails = [...new Set([...emails, ...extractedEmails])];
            phones = [...new Set([...phones, ...extractedPhones])];

          } catch (error) {
            logger.error(`❌ Error scraping contact page: ${contactLink} - ${error.message}`);
          }
        }

        logger.log(`✅ Scraped ${emails.length} emails and ${phones.length} phones for ${url}`);
        results.push({ name: title || "N/A", url, emails, phones });

        await page.close();
      } catch (error) {
        logger.error(`❌ Error scraping: ${url} - ${error.message}`);
        results.push({ name: title || "N/A", url, emails, phones });
      }
    }

    await browser.close();
    logger.log("✅ Successfully scraped all results, sending response...");
    res.status(200).json(results);
  } catch (error) {
    logger.error(`❌ Puppeteer Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
