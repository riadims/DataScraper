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

  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    urls.some((urlObj) => typeof urlObj.url !== "string")
  ) {
    console.error("❌ Invalid URLs received:", urls);
    return res
      .status(400)
      .json({
        error:
          "Invalid URL format. Expecting an array of { title, url } objects.",
      });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const results = [];

    for (const { url, title } of urls) {
      if (!url || !url.startsWith("http")) {
        console.error(`⚠️ Skipping invalid URL: ${url}`);
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
        console.log(`🌍 Navigating to: ${url}`);
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

        const contactLink = await page.$$eval("a", (anchors) => {
          const contactRegex = /kontakt|contact|contacts|contact us/i;
          for (const a of anchors) {
            if (contactRegex.test(a.innerText.trim())) {
              return a.href;
            }
          }
          return null;
        });

        if (contactLink) {
          console.log(`🔗 Found contact link: ${contactLink}`);
          await page.goto(contactLink, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
        }

        const plainText = await page.evaluate(() => {
          return document.body.innerText;
        });

        const tableContent = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("table"))
            .map((table) => table.innerText)
            .join("\n");
        });

        const navContent = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll("nav, span, a, .cart, .checkout, .headercart")
          )
            .map((el) => el.innerText)
            .join("\n");
        });

        const allTextContent = await page.evaluate(() => {
          return document.body.textContent;
        });

        const combinedContent = `${plainText}\n${tableContent}\n${navContent}\n${allTextContent}`;

        const linkPhones = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href^="tel:"]')).map(
            (link) => link.href.replace(/^tel:/, "")
          );
        });

        const { emails: extractedEmails, phones: extractedPhones } =
          extractData(combinedContent);

        emails = extractedEmails;
        phones = [...extractedPhones, ...linkPhones];

        results.push({ name: title || "None found", url, emails, phones });
        await page.close();
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
        results.push({ name: title || "None found", url, emails, phones });
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
