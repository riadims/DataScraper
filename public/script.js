let currentPage = 1;
const resultsPerPage = 10;
let allResults = [];
let totalPages = 1;

/**
 * Opens or closes the advanced filters popup.
 */
function openFilters() {
  const popup = document.getElementById("filter-popup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

/**
 * Applies the blacklist settings from checkboxes.
 */
function applyFilters() {
  userBlacklist = Array.from(
    document.querySelectorAll(".filter-checkbox:checked")
  ).map((checkbox) => checkbox.value);

  openFilters();
}

/**
 * Initiates the search and scraping process based on user input.
 *
 * @async
 * @function startSearch
 */
async function startSearch() {
  currentPage = 1; // Reset page when starting new search
  const keywords = document.getElementById("keywords").value;
  const country = document.getElementById("country").value;

  try {
    const searchResponse = await fetch("http://localhost:3000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        country /*, blacklist: userBlacklist*/,
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

    allResults = await scrapeResponse.json();
    console.log("🕷 Scraped Data:", allResults);

    totalPages = Math.ceil(allResults.length / resultsPerPage);

    updatePagination();
    displayResults();
  } catch (error) {
    console.error("🚨 Error fetching data:", error);
    alert("Error fetching data: " + error.message);
  }
}

/**
 * Displays the scraped data for the current page.
 */
function displayResults() {
  const resultsList = document.getElementById("results");
  resultsList.innerHTML = "";

  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = allResults.slice(
    startIndex,
    startIndex + resultsPerPage
  );

  paginatedResults.forEach((result) => {
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
}

/**
 * Updates the pagination controls.
 */
function updatePagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.onclick = () => {
      currentPage--;
      displayResults();
      updatePagination();
    };
    paginationContainer.appendChild(prevButton);
  }

  const pageInfo = document.createElement("span");
  pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
  paginationContainer.appendChild(pageInfo);

  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.onclick = () => {
      currentPage++;
      displayResults();
      updatePagination();
    };
    paginationContainer.appendChild(nextButton);
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  startSearch();
});

/**
 * Converts scraped results to CSV format and triggers a download.
 */
function downloadCSV() {
  if (allResults.length === 0) {
    alert("No data available to download.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Name,URL,Email,Phone\n";

  allResults.forEach((result) => {
    const name = result.name.replace(/,/g, " ");
    const url = result.url;
    const emails = result.emails.length ? result.emails.join(" | ") : "N/A";
    const phones = result.phones.length ? result.phones.join(" | ") : "N/A";
    csvContent += `"${name}","${url}","${emails}","${phones}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "scraped_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
