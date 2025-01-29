/**
 * Express router for scraping contact information from provided URLs.
 *
 * @module routes/scrape
 */
import express from "express";
import puppeteer from "puppeteer";
import extractData from "../utils/parser.mjs";

const router = express.Router();

/**
 * POST /scrape
 *
 * Scrapes contact information (emails and phone numbers) from an array of URLs.
 *
 * @name POST/scrape
 * @function
 * @memberof module:routes/scrape
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {string[]} req.body.urls - Array of URLs to scrape.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing the scraped data or an error message.
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
    const results = [];

    for (const url of urls) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      let emails = [];
      let phones = [];
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const content = await page.content();
        ({ emails, phones } = extractData(content));
        results.push({ url, emails, phones });
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        results.push({ url, emails, phones });
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
