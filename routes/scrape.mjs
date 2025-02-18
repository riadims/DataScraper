import express from "express";
import puppeteer from "puppeteer";
import extractData from "../utils/parser.mjs";

const router = express.Router();

/**
 * POST /scrape
 *
 * Scrapes contact information from all provided URLs.
 */
router.post("/", async (req, res) => {
  const { urls } = req.body;
  console.log("🕷 Received URLs for scraping:", urls);

  if (!Array.isArray(urls) || urls.length === 0 || urls.some((urlObj) => typeof urlObj.url !== "string")) {
    console.error("❌ Invalid URLs received:", urls);
    return res.status(400).json({ error: "Invalid URL format. Expecting an array of { title, url } objects." });
  }

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const results = [];

    for (const { url, title } of urls) {
      if (!url || !url.startsWith("http")) {
        console.error(`⚠️ Skipping invalid URL: ${url}`);
        results.push({ name: title || "N/A", url: "Invalid URL", emails: [], phones: [] });
        continue;
      }

      let emails = [];
      let phones = [];
      try {
        console.log(`🌍 Navigating to: ${url}`);
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

        const contactLink = await page.evaluate(() => {
          const contactRegex = /kontakt|about us|contact|contacts|contact us|kontaktujte/i;
          const links = Array.from(document.querySelectorAll("a"));
          for (const a of links) {
            if (contactRegex.test(a.innerText.trim())) {
              return a.href;
            }
          }
          return null;
        });

        if (contactLink) {
          console.log(`🔗 Found contact page: ${contactLink}`);
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
        await page.close();
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
        results.push({ name: title || "N/A", url, emails, phones });
      }
    }

    await browser.close();
    res.status(200).json(results);
  } catch (error) {
    console.error("❌ Error launching browser:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
