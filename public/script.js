let currentPage = 1;
const resultsPerPage = 10;
let userBlacklist = [];

/**
 * Opens the advanced filters popup.
 */
function openFilters() {
  if (document.getElementById("filter-popup").style.display == "block") {
    document.getElementById("filter-popup").style.display = "none";
  } else {
    document.getElementById("filter-popup").style.display = "block";
  }
}

/**
 * Closes the advanced filters popup.
 */
function closeFilters() {
  document.getElementById("filter-popup").style.display = "none";
}

/**
 * Applies the blacklist settings from checkboxes.
 */
function applyFilters() {
  userBlacklist = Array.from(
    document.querySelectorAll(".filter-checkbox:checked")
  ).map((checkbox) => checkbox.value);

  console.log("Applied Blacklist:", userBlacklist);
  closeFilters();
}

/**
 * Initiates the search and scraping process based on user input.
 *
 * @async
 * @function startSearch
 * @param {number} page - The page number for pagination.
 */
async function startSearch(page = 1) {
  currentPage = page;
  const keywords = document.getElementById("keywords").value;
  const country = document.getElementById("country").value;

  try {
    const searchResponse = await fetch("http://localhost:3000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        country,
        page,
        limit: resultsPerPage,
        blacklist: userBlacklist,
      }),
    });

    const searchData = await searchResponse.json();
    console.log("🔍 Search Response:", searchData);

    if (!searchData.results || !Array.isArray(searchData.results)) {
      throw new Error("Unexpected response format, expected an array");
    }

    const urls = searchData.results.map((item) => ({
      title: item.title,
      url: item.url,
    }));

    const scrapeResponse = await fetch("http://localhost:3000/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    const scrapedData = await scrapeResponse.json();
    console.log("🕷 Scraped Data:", scrapedData);

    displayResults(scrapedData, searchData.page, searchData.totalPages);
  } catch (error) {
    console.error("🚨 Error fetching data:", error);
    alert("Error fetching data: " + error.message);
  }
}

/**
 * Displays the scraped data along with pagination controls.
 *
 * @function displayResults
 * @param {Array} scrapedData - The scraped data to display.
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 */
function displayResults(scrapedData, currentPage, totalPages) {
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";

  scrapedData.forEach((result) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>Name:</strong> ${result.name || "N/A"}<br>
                    <strong>URL:</strong> <a href="${
                      result.url
                    }" target="_blank">${result.url}</a><br>
                    <strong>Email:</strong> ${
                      result.emails.length ? result.emails.join(", ") : "N/A"
                    }<br>
                    <strong>Phone:</strong> ${
                      result.phones.length ? result.phones.join(", ") : "N/A"
                    }<br>`;
    resultsList.appendChild(li);
  });

  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.onclick = () => startSearch(currentPage - 1);
    paginationContainer.appendChild(prevButton);
  }

  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
  paginationContainer.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.onclick = () => startSearch(currentPage + 1);
    paginationContainer.appendChild(nextButton);
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  startSearch(1);
});
