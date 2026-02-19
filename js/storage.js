function saveRating(showId, episodeId, rating) {
  const data = JSON.parse(localStorage.getItem("ratings") || "{}");
  data[`${showId}_${episodeId}`] = rating;
  localStorage.setItem("ratings", JSON.stringify(data));
}

function loadRating(showId, episodeId) {
  const data = JSON.parse(localStorage.getItem("ratings") || "{}");
  return data[`${showId}_${episodeId}`] || "";
}
