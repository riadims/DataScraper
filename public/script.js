/**
 * Initiates the search and scraping process based on user input.
 *
 * This function retrieves the keywords and country from the input fields,
 * sends a search request to the server, and then sends the resulting URLs
 * to be scraped. The scraped data is then displayed in the results element.
 *
 * @async
 * @function startSearch
 */
async function startSearch() {
  const keywords = document.getElementById("keywords").value;
  const country = document.getElementById("country").value;

  const searchResponse = await fetch("http://localhost:3000/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, country }),
  });

  const searchData = await searchResponse.json();
  const urls = searchData.map((item) => item.url);

  const scrapeResponse = await fetch("http://localhost:3000/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });

  const scrapedData = await scrapeResponse.json();
  document.getElementById("results").textContent = JSON.stringify(
    scrapedData,
    null,
    2
  );
}
