let currentPage = 1;
const resultsPerPage = 10;
let allResults = [];
let totalPages = 1;
let userBlacklist = new Set();
const API_BASE_URL = window.location.origin;


/**
 * Opens or closes the advanced filters popup.
 */
function openFilters() {
  const popup = document.getElementById("filter-popup");
  if (popup.style.display === "block") {
    popup.style.display = "none";
  } else {
    popup.style.display = "block";
  }
}

/**
 * Adds a website to the blacklist when Enter is pressed.
 */
function setupBlacklistInput() {
  const input = document.getElementById("exclude-websites");
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const website = input.value.trim();
      if (website) {
        userBlacklist.add(website);
        input.value = "";
        updateBlacklistDisplay();
      }
    }
  });
}

/**
 * Updates the displayed blacklist in the popup.
 */
function updateBlacklistDisplay() {
  const blacklistContainer = document.getElementById("blacklist-items");
  blacklistContainer.innerHTML = "";

  userBlacklist.forEach((website) => {
    const item = document.createElement("div");
    item.textContent = website;

    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.onclick = () => {
      userBlacklist.delete(website);
      updateBlacklistDisplay();
    };

    item.appendChild(removeButton);
    blacklistContainer.appendChild(item);
  });
}

/**
 * Closes the filters popup and applies the filters to the search results.
 */
function applyFilters() {
  openFilters();
}

/**
 * Initiates the search and scraping process based on user input.
 */
async function startSearch() {
  currentPage = 1; // Reset page when starting new search
  const keywords = document.getElementById("keywords").value;
  const country = document.getElementById("country").value;

  try {
    const searchResponse = await fetch(`${API_BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        country,
        blacklist: Array.from(userBlacklist),
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

    const scrapeResponse = await fetch(`${API_BASE_URL}/scrape`, {
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
  const resultsTable = document.getElementById("results");
  const resultsSection = document.getElementById("results-section");
  resultsTable.innerHTML = "";

  if (allResults.length === 0) {
    resultsSection.classList.add("hidden");
    return;
  } else {
    resultsSection.classList.remove("hidden");
  }

  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = allResults.slice(
    startIndex,
    startIndex + resultsPerPage
  );

  paginatedResults.forEach((result) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${shortenText(result.name || "N/A", 20)}</td>
                     <td><a href="${result.url}" target="_blank">${shortenText(
      result.url,
      30
    )}</a></td>
                     <td>${
                       shortenArray(result.emails, 1).join(", ") || "N/A"
                     }</td>
                     <td>${
                       shortenArray(result.phones, 1).join(", ") || "N/A"
                     }</td>`;
    resultsTable.appendChild(row);
  });
}

/**
 * Shortens text to a specified length and adds ellipsis if necessary.
 */
function shortenText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Limits the array to a specified length and adds ellipsis if necessary.
 */
function shortenArray(arr, maxLength) {
  return arr.length > maxLength ? arr.slice(0, maxLength).concat("...") : arr;
}

/**
 * Updates the pagination controls.
 */
function updatePagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  if (allResults.length === 0) {
    paginationContainer.classList.add("hidden");
    return;
  } else {
    paginationContainer.classList.remove("hidden");
  }

  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.classList.add("pagination-button");
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
    nextButton.classList.add("pagination-button");
    nextButton.onclick = () => {
      currentPage++;
      displayResults();
      updatePagination();
    };
    paginationContainer.appendChild(nextButton);
  }
}

// Set up event listeners
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  startSearch();
});

setupBlacklistInput(); // Initialize the blacklist input functionality

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

/**
 * Footer year update on application start
 */
window.onload = () => {
  updateFooterYear();
};

/**
 * Updates the footer to display the current year.
 */
function updateFooterYear() {
  const footerText = document.getElementById("rights");
  const currentYear = new Date().getFullYear();
  footerText.innerHTML = `&copy; ${currentYear} DataScraper. All rights reserved.`;
}
