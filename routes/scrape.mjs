import express from "express";
import puppeteer from "puppeteer";
import extractData from "../utils/parser.mjs";
import logger from "../utils/logger.mjs";

const router = express.Router();

/**
 * POST /scrape
 *
 * Scrapes contact information from all provided URLs.
 */
router.post("/", async (req, res) => {
  const { urls } = req.body;
  logger.log(`Scraper recieved URLs: ${urls.length}`);

  if (!Array.isArray(urls) || urls.length === 0 || urls.some((urlObj) => typeof urlObj.url !== "string")) {
    logger.error("❌ Invalid URLs received:", urls);
    return res.status(400).json({ error: "Invalid URL format. Expecting an array of { title, url } objects." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
    });
    const results = [];

    for (const { url, title } of urls) {
      logger.log(`Checking for invalid URL on: ${url}`);
      if (!url || !url.startsWith("http")) {
        logger.error(`⚠️ Skipping invalid URL: ${url}`);
        results.push({ name: title || "N/A", url: "Invalid URL", emails: [], phones: [] });
        continue;
      }

      let emails = [];
      let phones = [];
      try {
        logger.log(`Navigating to: ${url}`);
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        logger.log(`Scraping: ${url}`);
        const contactLink = await page.evaluate(() => {
          const contactRegex = /kontakt|kontakty|about us|contact|contacts|contact us|kontaktujte/i;
          const links = Array.from(document.querySelectorAll("a"));
          for (const a of links) {
            if (contactRegex.test(a.innerText.trim())) {
              return a.href;
            }
          }
          return null;
        });

        if (contactLink) {
          logger.log(`Found contact page: ${contactLink}`);
          await page.goto(contactLink, { waitUntil: "domcontentloaded", timeout: 30000 });
        }

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

        const { emails: extractedEmails, phones: extractedPhones } = extractData(extractedText);
        emails = extractedEmails;
        phones = extractedPhones;

        results.push({ name: title || "N/A", url, emails, phones });
        logger.log(`Scraped: ${url} - Emails: ${emails}, Phones: ${phones}`);
        await page.close();
      } catch (error) {
        logger.error(`Error scraping: ${url}`, error);
        results.push({ name: title || "N/A", url, emails, phones });
      }
    }

    await browser.close();
    logger.log("✅ Successfully scraped all results, sending response...");
    res.status(200).json(results);
  } catch (error) {
    logger.error(`Puppeteer Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
