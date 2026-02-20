let currentSource = "search"; // Track where we navigated from

function renderShowResults(shows) {
  const content = document.getElementById("content");
  content.innerHTML = "";
  currentSource = "search"; // Mark that we came from search

  // Add header with back button
  const resultsHeader = document.createElement("div");
  resultsHeader.className = "results-header";
  resultsHeader.innerHTML = `
    <button class="back-to-home-btn" id="back-home-btn">← Back to My Shows</button>
    <h2>Search Results</h2>
  `;
  content.appendChild(resultsHeader);

  // Add back home handler
  setTimeout(() => {
    const backBtn = document.getElementById("back-home-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        renderHomepage();
      });
    }
  }, 100);

  if (!shows || shows.length === 0) {
    content.innerHTML += `<p class='no-results'>No shows found. Try a different search.</p>`;
    return;
  }

  shows.forEach(show => {
    const div = document.createElement("div");
    div.className = "card show-card";
    const posterUrl = show.poster_path
      ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect fill='%23333' width='300' height='450'/%3E%3Ctext x='50%25' y='50%25' fill='%23999' text-anchor='middle' dominant-baseline='middle' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";
    
    const followedShows = JSON.parse(localStorage.getItem("followedShows")) || [];
    const isFollowed = followedShows.find(f => f.id === show.id);

    div.innerHTML = `
      <div class="poster-container">
        <img src="${posterUrl}" alt="${show.name}" class="poster" />
      </div>
      <h3>${show.name}</h3>
      <p>${show.first_air_date ? show.first_air_date.split("-")[0] : "N/A"}</p>
      <button class="view-btn">View Episodes</button>
      <button class="follow-btn ${isFollowed ? 'following' : ''}">${isFollowed ? '✓ Following' : '+ Follow'}</button>
      <button class="export-btn">Export Ratings</button>
    `;

    div.querySelector(".view-btn").addEventListener("click", () => {
      loadSeason(show.id, show.name);
    });

    div.querySelector(".follow-btn").addEventListener("click", (e) => {
      const followedShowsList = JSON.parse(localStorage.getItem("followedShows")) || [];
      if (isFollowed) {
        const filtered = followedShowsList.filter(f => f.id !== show.id);
        localStorage.setItem("followedShows", JSON.stringify(filtered));
        e.target.textContent = "+ Follow";
        e.target.classList.remove("following");
      } else {
        followedShowsList.push({ id: show.id, name: show.name, first_air_date: show.first_air_date, poster_path: show.poster_path });
        localStorage.setItem("followedShows", JSON.stringify(followedShowsList));
        e.target.textContent = "✓ Following";
        e.target.classList.add("following");
      }
    });

    div.querySelector(".export-btn").addEventListener("click", () => {
      exportRatings(show.id);
    });

    content.appendChild(div);
  });
}

async function loadSeason(showId, showName) {
  const showDetails = await getShowDetails(showId);
  const numSeasons = showDetails.number_of_seasons || 1;
  const content = document.getElementById("content");
  
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← Back to Shows";
  backBtn.onclick = () => {
    const searchInput = document.getElementById("search");
    if (currentSource === "followed") {
      // Go back to homepage (followed shows view)
      renderHomepage();
      searchInput.value = "";
    } else if (searchInput.value) {
      // Go back to search results
      searchShows(searchInput.value);
    } else {
      // Fallback to homepage
      renderHomepage();
    }
  };
  
  content.innerHTML = `
    <div class="season-header">
      <div class="header-top">
        <div>
          <h2>${showName}</h2>
          <p class="episode-count">${numSeasons} season${numSeasons !== 1 ? 's' : ''}</p>
        </div>
        <div class="season-selector">
          <label for="season-select">Season:</label>
          <select id="season-select">
            ${Array.from({length: numSeasons}, (_, i) => i + 1)
              .map(s => `<option value="${s}">Season ${s}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      <div class="filter-controls" id="filter-controls" style="display:none;">
        <button class="filter-btn active" id="filter-all">All Episodes</button>
        <button class="filter-btn" id="filter-rated">Rated Only</button>
        <button class="filter-btn danger" id="clear-all">Clear All</button>
      </div>
    </div>
    <div id="episodes-list"></div>
  `;
  content.prepend(backBtn);
  
  let currentSeason = 1;
  let currentFilter = "all";
  
  async function renderSeason(seasonNum) {
    console.log("Loading season:", seasonNum);
    try {
      const season = await getEpisodes(showId, seasonNum);
      console.log("Season loaded:", season);
      
      if (!season.episodes || season.episodes.length === 0) {
        document.getElementById("episodes-list").innerHTML = "<p class='no-results'>No episodes found for this season.</p>";
        return;
      }
      
      const episodesContainer = document.getElementById("episodes-list");
      episodesContainer.innerHTML = "";
      
      const allRatings = season.episodes
        .map(ep => loadRating(showId, ep.id))
        .filter(r => r);
      const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / allRatings.length).toFixed(1) : "N/A";
      
      // Update season header with stats
      const headerTop = document.querySelector(".header-top");
      let statsBox = headerTop.querySelector(".stats-box");
      if (!statsBox) {
        statsBox = document.createElement("div");
        statsBox.className = "stats-box";
        headerTop.appendChild(statsBox);
      }
      statsBox.innerHTML = `
        <div class="stat">
          <span class="stat-label">Avg Rating</span>
          <span class="stat-value">${avgRating}</span>
        </div>
      `;
      
      // Show filter controls
      const filterControls = document.getElementById("filter-controls");
      if (filterControls) {
        filterControls.style.display = "flex";
      }
      
      season.episodes.forEach(ep => {
        const rating = loadRating(showId, ep.id);
        const div = document.createElement("div");
        div.className = "card episode-card";
        const stillUrl = ep.still_path 
          ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='169'%3E%3Crect fill='%23333' width='300' height='169'/%3E%3Ctext x='50%25' y='50%25' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
        
        div.innerHTML = `
          <img src="${stillUrl}" alt="${ep.name}" class="episode-image" />
          <div class="episode-content">
            <h4>Ep. ${ep.episode_number}: ${ep.name}</h4>
            <p class="episode-overview">${ep.overview || "No description available"}</p>
            <div class="rating-section">
              <div class="rating-visual">
                <span class="rating-number">${rating || "0"}</span>
              </div>
              <button class="rate-btn">Rate</button>
              <div class="slider-container" style="display: none;">
                <input class="slider" type="range" min="0" max="10" step="0.1" value="${rating || 0}" />
              </div>
            </div>
          </div>
        `;

        const rateBtn = div.querySelector(".rate-btn");
        const sliderContainer = div.querySelector(".slider-container");
        const slider = div.querySelector(".slider");
        const ratingNumber = div.querySelector(".rating-number");

        rateBtn.addEventListener("click", () => {
          sliderContainer.style.display = "flex"; // Ensure proper display on desktop
          slider.style.display = "block"; // Ensure slider is visible
          rateBtn.style.display = "none";
        });

        slider.addEventListener("input", function() {
          ratingNumber.textContent = parseFloat(this.value).toFixed(1);
        });

        slider.addEventListener("change", function() {
          saveRating(showId, ep.id, this.value);
          sliderContainer.style.display = "none";
          rateBtn.style.display = "block";
        });

        episodesContainer.appendChild(div);
      });
    } catch (error) {
      console.error("Error rendering season:", error);
      document.getElementById("episodes-list").innerHTML = "<p class='no-results'>Error loading episodes.</p>";
    }
  }
  
  // Season selector change event
  setTimeout(() => {
    const seasonSelect = document.getElementById("season-select");
    if (seasonSelect) {
      seasonSelect.addEventListener("change", async function(e) {
        const selectedSeason = parseInt(this.value);
        console.log("Season changed to:", selectedSeason);
        currentSeason = selectedSeason;
        currentFilter = "all";
        const filterBtns = document.querySelectorAll(".filter-btn");
        filterBtns.forEach(b => b.classList.remove("active"));
        const filterAll = document.getElementById("filter-all");
        if (filterAll) filterAll.classList.add("active");
        await renderSeason(currentSeason);
      });
    }
  }, 100);
  
  // Filter controls
  setTimeout(() => {
    const filterAll = document.getElementById("filter-all");
    const filterRated = document.getElementById("filter-rated");
    const clearAll = document.getElementById("clear-all");
    
    if (filterAll) {
      filterAll.addEventListener("click", () => {
        currentFilter = "all";
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        filterAll.classList.add("active");
        renderSeason(currentSeason);
      });
    }
    
    if (filterRated) {
      filterRated.addEventListener("click", () => {
        currentFilter = "rated";
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        filterRated.classList.add("active");
        renderSeason(currentSeason);
      });
    }
    
    if (clearAll) {
      clearAll.addEventListener("click", async () => {
        if (confirm("Delete all ratings for this season?")) {
          const season = await getEpisodes(showId, currentSeason);
          season.episodes.forEach(ep => {
            saveRating(showId, ep.id, "");
          });
          renderSeason(currentSeason);
        }
      });
    }
  }, 0);
  
  renderSeason(currentSeason);
}

function renderHomepage() {
  const content = document.getElementById("content");
  content.innerHTML = "";
  currentSource = "followed"; // Mark that we came from followed shows

  const followedShows = JSON.parse(localStorage.getItem("followedShows")) || [];

  // Add home header with tools
  const homeHeader = document.createElement("div");
  homeHeader.className = "home-header";
  homeHeader.innerHTML = `
    <div class="home-title">
      <h2>My Shows</h2>
      <p class="subtitle">${followedShows.length} show${followedShows.length !== 1 ? 's' : ''} followed</p>
    </div>
    <div class="home-tools">
      <button class="export-btn" id="export-all-btn">📤 Export All Ratings</button>
      <button class="import-btn" id="import-file-btn">📥 Import Ratings</button>
      <input type="file" id="import-file-input" accept="application/json" style="display: none;" />
    </div>
  `;
  content.appendChild(homeHeader);

  // Add import handler
  setTimeout(() => {
    const importBtn = document.getElementById("import-file-btn");
    const importInput = document.getElementById("import-file-input");
    const exportAllBtn = document.getElementById("export-all-btn");
    
    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => importInput.click());
      importInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              localStorage.setItem("ratings", JSON.stringify(data));
              alert("Ratings imported successfully!");
              importInput.value = "";
            } catch (error) {
              alert("Invalid ratings file. Please upload a valid JSON file.");
            }
          };
          reader.readAsText(file);
        }
      });
    }
    
    if (exportAllBtn) {
      exportAllBtn.addEventListener("click", () => {
        const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
        const dataStr = JSON.stringify(ratings, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ratings_${new Date().getTime()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  }, 100);

  if (followedShows.length > 0) {
    const followedSection = document.createElement("div");
    followedSection.className = "followed-section";

    followedShows.forEach(show => {
      const div = document.createElement("div");
      div.className = "card show-card";
      const posterUrl = show.poster_path
        ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect fill='%23333' width='300' height='450'/%3E%3Ctext x='50%25' y='50%25' fill='%23999' text-anchor='middle' dominant-baseline='middle' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";
      
      div.innerHTML = `
        <div class="poster-container">
          <img src="${posterUrl}" alt="${show.name}" class="poster" />
        </div>
        <h3>${show.name}</h3>
        <p class="show-year">${show.first_air_date ? show.first_air_date.split("-")[0] : "N/A"}</p>
        <button class="view-btn">View Episodes</button>
      `;

      div.querySelector(".view-btn").addEventListener("click", () => {
        loadSeason(show.id, show.name);
      });

      followedSection.appendChild(div);
    });

    content.appendChild(followedSection);
  } else {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-icon">📺</div>
      <h3>No Followed Shows Yet</h3>
      <p>Search for your favorite TV shows and follow them to get started!</p>
    `;
    content.appendChild(emptyState);
  }
}

// Call renderHomepage on initial load
window.addEventListener("DOMContentLoaded", renderHomepage);

async function searchShows(query) {
  const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=34f08afc63305bdcf9191b004d180f50&query=${query}`);
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    renderShowResults(data.results);
  } else {
    document.getElementById("content").innerHTML = "<p class='no-results'>No shows found. Try another search.</p>";
  }
}

// Debugging: Ensure sliders have correct data attributes and ratings persist
function renderEpisodes(episodes, showId) {
  const episodesList = document.getElementById("episodes-list");
  episodesList.innerHTML = "";

  episodes.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";
    episodeCard.innerHTML = `
      <h4>${episode.name}</h4>
      <p>${episode.overview || "No description available."}</p>
      <input 
        type="range" 
        class="rating-slider" 
        data-show-id="${showId}" 
        data-episode-id="${episode.id}" 
        min="0" 
        max="10" 
        step="0.5"
      />
      <span class="rating-value">0</span>
    `;

    const slider = episodeCard.querySelector(".rating-slider");
    const ratingValue = episodeCard.querySelector(".rating-value");

    // Load saved rating
    const savedRating = getRating(`${showId}-${episode.id}`);
    if (savedRating !== null) {
      slider.value = savedRating;
      ratingValue.textContent = savedRating;
    }

    // Save rating on slider input
    slider.addEventListener("input", () => {
      const rating = slider.value;
      saveRating(`${showId}-${episode.id}`, rating);
      ratingValue.textContent = rating;
    });

    episodesList.appendChild(episodeCard);
  });
}

// Add unfollow functionality
function renderFollowedShows() {
  const followedShows = JSON.parse(localStorage.getItem("followedShows")) || [];
  const followedContainer = document.getElementById("followed-container");
  followedContainer.innerHTML = "";

  followedShows.forEach((show) => {
    const showElement = document.createElement("div");
    showElement.classList.add("followed-show");
    showElement.innerHTML = `
      <h3>${show.name}</h3>
      <button class="unfollow-btn" data-id="${show.id}">Unfollow</button>
    `;
    followedContainer.appendChild(showElement);
  });

  // Add event listeners for unfollow buttons
  document.querySelectorAll(".unfollow-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const showId = e.target.getAttribute("data-id");
      unfollowShow(showId);
    });
  });
}

function unfollowShow(showId) {
  let followedShows = JSON.parse(localStorage.getItem("followedShows")) || [];
  followedShows = followedShows.filter((show) => show.id !== showId);
  localStorage.setItem("followedShows", JSON.stringify(followedShows));
  renderFollowedShows();
}
