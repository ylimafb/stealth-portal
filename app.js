(() => {
  const markerKey = "__browser_portal_fixture_marker_v1";
  const storageState = document.getElementById("storage-state");
  document.getElementById("origin").textContent = location.origin;

  function showMarker() {
    try { storageState.textContent = localStorage.getItem(markerKey) || "none"; }
    catch (error) { storageState.textContent = `unavailable (${error.name})`; }
  }

  document.getElementById("write-marker").addEventListener("click", () => {
    try { localStorage.setItem(markerKey, crypto.randomUUID()); }
    catch (error) { storageState.textContent = `unavailable (${error.name})`; return; }
    showMarker();
  });
  document.getElementById("clear-marker").addEventListener("click", () => {
    try { localStorage.removeItem(markerKey); }
    catch (error) { storageState.textContent = `unavailable (${error.name})`; return; }
    showMarker();
  });
  showMarker();

  fetch("./data.json", { credentials: "same-origin", cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => { document.getElementById("fetch-state").textContent = data.message; })
    .catch((error) => { document.getElementById("fetch-state").textContent = `failed (${error.message})`; });
})();
