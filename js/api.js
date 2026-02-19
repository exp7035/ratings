const API_KEY = "34f08afc63305bdcf9191b004d180f50";
const BASE = "https://api.themoviedb.org/3";

async function searchShows(query) {
  const res = await fetch(`${BASE}/search/tv?api_key=${API_KEY}&query=${query}`);
  return res.json();
}

async function getShowDetails(showId) {
  const res = await fetch(`${BASE}/tv/${showId}?api_key=${API_KEY}`);
  return res.json();
}

async function getEpisodes(showId, season) {
  const res = await fetch(`${BASE}/tv/${showId}/season/${season}?api_key=${API_KEY}`);
  return res.json();
}
