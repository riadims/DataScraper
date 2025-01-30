/**
 * Express router for handling search requests.
 *
 * @module routes/search
 */

import express from "express";
import axios from "axios";
import config from "../config.mjs";

const router = express.Router();

/**
 * POST /search
 *
 * Handles search requests by querying the SerpAPI with provided keywords and country.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.keywords - Keywords to search for.
 * @param {string} req.body.country - Country to include in the search query.
 * @param {Object} res - Express response object.
 *
 * @returns {Promise<void>} - Returns a JSON response with search results or an error message.
 */
router.post("/", async (req, res) => {
  const { keywords, country } = req.body;

  try {
    const query = `${keywords} ${country}`;
    const numResults = 100;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&api_key=${config.serpApiKey}&num=${numResults}`;

    const response = await axios.get(url);

    console.log("Raw search API response:", response.data);

    if (
      !response.data.organic_results ||
      !Array.isArray(response.data.organic_results)
    ) {
      throw new Error("Invalid API response structure");
    }

    const results = response.data.organic_results.map((result) => ({
      title: result.title || "N/A",
      url: typeof result.link === "string" ? result.link : "",
    }));

    res.json(results);
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
