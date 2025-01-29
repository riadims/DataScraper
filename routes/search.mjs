/**
 * Express router to handle search requests.
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
 * @summary Handles search requests by querying the SerpApi with provided keywords and country.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.keywords - The search keywords.
 * @param {string} req.body.country - The country to refine the search.
 * @param {Object} res - Express response object.
 *
 * @returns {Promise<void>} - Returns a JSON response with search results or an error message.
 */
router.post("/", async (req, res) => {
  const { keywords, country } = req.body;

  try {
    const query = `${keywords} ${country}`;
    const numResults = 100; // Number of results to return
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&api_key=${config.serpApiKey}&num=${numResults}`;

    const response = await axios.get(url);

    const results = response.data.organic_results.map((result) => ({
      title: result.title,
      url: result.link,
    }));

    res.json(results);
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({ error: error.message });
  }
});

export default router;
