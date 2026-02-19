document.getElementById("search").addEventListener("input", async e => {
  const q = e.target.value;
  if (q.length < 3) return;
  const data = await searchShows(q);
  renderShowResults(data.results);
});

// Updated saveRating and getRating to use consistent key format
function saveRating(showId, episodeId, rating) {
  const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  ratings[`${showId}_${episodeId}`] = rating;
  localStorage.setItem("ratings", JSON.stringify(ratings));
}

function getRating(showId, episodeId) {
  const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  return ratings[`${showId}_${episodeId}`] || null;
}

// Ensure ratings are loaded on page refresh
document.addEventListener("DOMContentLoaded", () => {
  const sliders = document.querySelectorAll(".rating-slider");
  sliders.forEach((slider) => {
    const showId = slider.dataset.showId;
    const episodeId = slider.dataset.episodeId;
    const savedRating = getRating(showId, episodeId);
    if (savedRating !== null) {
      slider.value = savedRating;
      const ratingValue = slider.nextElementSibling;
      if (ratingValue) {
        ratingValue.textContent = savedRating;
      }
    }

    slider.addEventListener("input", () => {
      const rating = slider.value;
      saveRating(showId, episodeId, rating);
      const ratingValue = slider.nextElementSibling;
      if (ratingValue) {
        ratingValue.textContent = rating;
      }
    });
  });
});

// Export ratings for a specific show
function exportRatings(showId) {
  const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
  const showRatings = Object.keys(ratings)
    .filter(key => key.startsWith(`${showId}_`))
    .reduce((obj, key) => {
      obj[key] = ratings[key];
      return obj;
    }, {});

  const blob = new Blob([JSON.stringify(showRatings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${showId}_ratings.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import ratings from a JSON file
function importRatings(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedRatings = JSON.parse(event.target.result);
      const existingRatings = JSON.parse(localStorage.getItem("ratings")) || {};
      const updatedRatings = { ...existingRatings, ...importedRatings };
      localStorage.setItem("ratings", JSON.stringify(updatedRatings));
      alert("Ratings have been successfully imported and updated!");
    } catch (error) {
      alert("Failed to import ratings. Please ensure the file is valid.");
    }
  };
  reader.readAsText(file);
}

// Add event listeners for export and import buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("export-btn")?.addEventListener("click", () => {
    const showId = prompt("Enter the Show ID to export ratings:");
    if (showId) {
      exportRatings(showId);
    }
  });

  document.getElementById("import-btn")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importRatings(file);
    }
  });
});
