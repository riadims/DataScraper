import express from "express";
import axios from "axios";
import config from "../config.mjs";

const router = express.Router();

/**
 * POST /search
 *
 * Handles search requests by querying the SerpAPI with provided keywords and country.
 * Supports pagination and allows blacklisting specific domains.
 */
router.post("/", async (req, res) => {
  const { keywords, country, page = 1, limit = 10, blacklist = [] } = req.body;
  const numResults = 100;

  const fullBlacklist = [...new Set([...blacklist])];

  try {
    const query = `${keywords} ${country}`;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&api_key=${config.serpApiKey}&num=${numResults}`;

    const response = await axios.get(url);

    if (
      !response.data.organic_results ||
      !Array.isArray(response.data.organic_results)
    ) {
      throw new Error("Invalid API response structure");
    }

    const results = response.data.organic_results
      .map((result) => ({
        title: result.title || "N/A",
        url: typeof result.link === "string" ? result.link : "",
      }))
      .filter(
        (item) => !fullBlacklist.some((domain) => item.url.includes(domain))
      );

    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    res.json({
      page: page,
      limit: limit,
      totalResults: totalResults,
      totalPages: totalPages,
      results: paginatedResults,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
