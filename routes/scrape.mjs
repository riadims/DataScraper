import express from "express";
import puppeteer from "puppeteer";
import extractData from "../utils/parser.mjs";

const router = express.Router();

/**
 * POST /scrape
 *
 * Scrapes contact information from an array of URLs.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array} req.body.urls - Array of URLs to scrape
 * @param {Object} res - Express response object
 */
router.post("/", async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid input: 'urls' must be a non-empty array." });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const results = [];

    for (const { url, title } of urls) {
      if (!url || !url.startsWith("http")) {
        console.error(`Invalid URL: ${url}`);
        results.push({ name: title || "N/A", url, emails: [], phones: [] });
        continue;
      }
      let emails = [];
      let phones = [];
      try {
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        const content = await page.content();
        ({ emails, phones } = extractData(content));

        results.push({ name: title || "N/A", url, emails, phones });
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        results.push({ name: title || "N/A", url, emails, phones });
      }
    }

    await browser.close();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error launching browser:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
