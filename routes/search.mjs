import express from "express";
import axios from "axios";
import config from "../config.mjs";

const router = express.Router();

/**
 * POST /search
 *
 * Handles search requests by querying the SerpAPI with provided keywords and country.
 * Returns all results without pagination, applying the blacklist to filter out unwanted domains.
 * Ensures only one page per domain is included.
 */
router.post("/", async (req, res) => {
  const { keywords, country, blacklist = [] } = req.body;

  const numResults = 300;

  const tldBlacklist = new Set([
    ".org",
    ".edu",
    ".gov",
    ".int",
    ".mil",
    ".ngo",
    ".ong",
    ".info",
    ".name",
    ".pro",
    ".biz",
    ".net",
    ".law",
  ]);

  const domainBlacklist = new Set([
    "youtube.com",
    "tripadvisor.com",
    "forbes.com",
    "reddit.com",
    "quora.com",
    "linkedin.com",
    "facebook.com",
    "tiktok.com",
    "wikipedia.org",
    "x.com",
    "instagram.com",
    "m.facebook.com",
    "wikipedia.com",
    "trustpilot.com",
    "statista.com",
    "shutterstock.com",
    "healtheuropa.com",
    "eea.europa.eu",
    "ie.trustpilot.com",
    "expats.cz",
    "rutlandandpartners.com",
    "euromonitor.com",
    "peytonlegal.cz",
    "alamy.com",
    "visitczechia.com",
    "cannacares.co.uk",
    "imago-images.com",
    "apps.apple.com",
    "play.google.com",
    "twitter.com",
    "pinterest.com",
    "flickr.com",
    "snapchat.com",
    "tumblr.com",
    "vimeo.com",
    "soundcloud.com",
    "mixcloud.com",
    "bandcamp.com",
    "behance.net",
    "dribbble.com",
    "medium.com",
    "wordpress.com",
    "blogspot.com",
    "twitch.tv",
    "discord.com",
    "telegram.org",
    "whatsapp.com",
    "messenger.com",
    "slack.com",
    "zoom.us",
    "meet.google.com",
    "hangouts.google.com",
    "skype.com",
    "linkedin.com",
    "xing.com",
    "vk.com",
    "ok.ru",
    "reddit.com",
    "quora.com",
    "stackexchange.com",
    "stackoverflow.com",
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "sourceforge.net",
    "codepen.io",
    "jsfiddle.net",
    "repl.it",
    "glitch.com",
    "netlify.com",
    "vercel.com",
    "heroku.com",
    "aws.amazon.com",
    "wikipedia.org",
    ".trustpilot.com",
    "businesswire.com",
    "finance.yahoo.com",
    "yahoo.com",
    "sciencedirect.com",
    "bbc.com",
    "nytimes.com",
    "reuters.com",
    "bloomberg.com",
    "politico.eu",
    "euronews.com",
    
  ]);

  blacklist.forEach((domain) => domainBlacklist.add(domain.toLowerCase()));

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

    const uniqueDomains = new Set();
    const filteredResults = [];

    response.data.organic_results.forEach((result) => {
      if (!result.link) return;
      const url = result.link.toLowerCase();
      const domain = new URL(url).hostname.replace(/^www\./, "");
      const extractedDomain = domain.split('.').slice(-2).join('.');

      if (
        !Array.from(tldBlacklist).some((tld) => extractedDomain.endsWith(tld)) &&
        !domainBlacklist.has(domain) &&
        !domainBlacklist.has(extractedDomain) &&
        !uniqueDomains.has(domain) &&
        !url.includes("news")
      ) {
        uniqueDomains.add(domain);
        filteredResults.push({ title: result.title || "N/A", url });
      }
    });

    res.json({ results: filteredResults });
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
