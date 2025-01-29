/**
 * @file Configuration module for the DataScraper application.
 * @module config
 * @requires dotenv
 */

/**
 * Loads environment variables from a .env file into process.env.
 * @see {@link https://www.npmjs.com/package/dotenv|dotenv}
 */

/**
 * @typedef {Object} Config
 * @property {string} serpApiKey - The API key for accessing the SERP API.
 * @property {number} port - The port number on which the application will run.
 */

/**
 * The configuration object containing environment-specific settings.
 * @type {Config}
 * @default
 */
import dotenv from "dotenv";
dotenv.config();

export default {
  serpApiKey: process.env.SERPAPI_KEY,
  port: process.env.PORT || 3000,
};
