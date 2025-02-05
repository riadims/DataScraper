/**
 * @fileoverview Main server file for the DataScraper application.
 * Sets up an Express server with routes for searching and scraping.
 * Serves static files from the "public" directory and serves the index.html file on the root route.
 *
 * @requires express
 * @requires cors
 * @requires ./routes/search.mjs
 * @requires ./routes/scrape.mjs
 * @requires ./config.mjs
 * @requires path
 * @requires url
 */

import express from "express";
import cors from "cors";
import searchRoutes from "./routes/search.mjs";
import scrapeRoutes from "./routes/scrape.mjs";
import config from "./config.mjs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Express application instance.
 * @type {import('express').Application}
 */
const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

/**
 * Serves the index.html file on the root route.
 * @name get/
 * @function
 * @memberof module:express.Router
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "index.html"));
});

app.get("/help", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "help.html"));
});

app.get("/support", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "support.html"));
});


// Routes
app.use("/search", searchRoutes);
app.use("/scrape", scrapeRoutes);

/**
 * Starts the server and listens on the specified port.
 * @function
 * @memberof module:express.Application
 * @param {number} port - The port number to listen on.
 */
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
