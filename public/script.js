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

document.getElementById("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const keywords = document.getElementById("keywords").value;
  const country = document.getElementById("country").value;

  try {
    const response = await fetch("http://localhost:3000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, country }),
    });

    const results = await response.json();
    console.log("Received search results:", results);

    if (!Array.isArray(results)) {
      throw new Error("Unexpected response format, expected an array");
    }

    const scrapeResponse = await fetch("http://localhost:3000/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: results }),
    });

    const scrapedData = await scrapeResponse.json();
    console.log("Scraped data:", scrapedData);

    const resultsList = document.getElementById("results");
    resultsList.innerHTML = "";

    scrapedData.forEach((result) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>Name:</strong> ${result.name || "N/A"}<br>
                            <strong>URL:</strong> <a href="${
                              result.url
                            }" target="_blank">${result.url}</a><br>
                            <strong>Email:</strong> ${
                              result.emails.length
                                ? result.emails.join(", ")
                                : "N/A"
                            }<br>
                            <strong>Phone:</strong> ${
                              result.phones.length
                                ? result.phones.join(", ")
                                : "N/A"
                            }<br>`;
      resultsList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching data", error);
    alert("Error fetching data: " + error.message);
  }
});
