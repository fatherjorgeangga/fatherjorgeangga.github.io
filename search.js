// ===========================================
// Firebase setup
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjaYeBaaQMBH43eR0XIVyAlopxS6Ku3u0",
  authDomain: "saintmichaeltibuloy.firebaseapp.com",
  projectId: "saintmichaeltibuloy",
  storageBucket: "saintmichaeltibuloy.firebasestorage.app",
  messagingSenderId: "192594665363",
  appId: "1:192594665363:web:b030585199d7beb5cd5266"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===========================================
// In-memory search index
// ===========================================

let staticEntries = [];
let liveEntries = { books: [], saints: [], fathers: [] };

const searchBox = document.getElementById("globalSearch");
const resultsEl = document.getElementById("searchResults");
const statusEl = document.getElementById("searchStatus");
const suggestionsEl = document.getElementById("searchSuggestions");
const recentWrap = document.getElementById("recentSearchesWrap");
const recentEl = document.getElementById("recentSearches");

if (!searchBox || !resultsEl) {
  // Not on the search page — do nothing.
} else {

  // ===========================================
  // Load static cards from each page
  // ===========================================

  const staticSources = [
    { url: "/saints/",   label: "Saint",         icon: "⛪" },
    { url: "/fathers/",  label: "Church Father", icon: "👨‍🏫" },
    { url: "/councils/", label: "Council",       icon: "📜" },
    { url: "/books/",    label: "Book",          icon: "📚" }
  ];

  function extractCards(doc, source) {
    const found = [];
    doc.querySelectorAll(".book-card, .card").forEach(function (el) {
      const heading = el.querySelector("h3, h2");
      if (!heading) return;
      found.push({
        title: heading.textContent.trim(),
        text: el.textContent.trim(),
        label: source.label,
        icon: source.icon,
        url: source.url
      });
    });
    return found;
  }

  Promise.all(
    staticSources.map(function (source) {
      return fetch(source.url)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          const doc = new DOMParser().parseFromString(html, "text/html");
          return extractCards(doc, source);
        })
        .catch(function () { return []; });
    })
  ).then(function (results) {
    staticEntries = results.flat();
    runSearch();
  });

  // ===========================================
  // Live Firestore collections
  // ===========================================

  function watchCollection(name, label, icon, url, titleField) {
    onSnapshot(collection(db, name), function (snapshot) {
      const entries = [];
      snapshot.forEach(function (docSnap) {
        const data = docSnap.data();
        const title = data[titleField] || "";
        const text = Object.values(data).filter(function (v) {
          return typeof v === "string";
        }).join(" ");
        entries.push({ title: title, text: text, label: label, icon: icon, url: url });
      });
      liveEntries[name] = entries;
      runSearch();
    });
  }

  watchCollection("books", "Book", "📚", "/books/", "title");
  watchCollection("saints", "Saint", "⛪", "/saints/", "name");
  watchCollection("fathers", "Church Father", "👨‍🏫", "/fathers/", "name");

  function allEntries() {
    return staticEntries
      .concat(liveEntries.books)
      .concat(liveEntries.saints)
      .concat(liveEntries.fathers);
  }

  function snippet(text, query) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 140) + (text.length > 140 ? "…" : "");
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + query.length + 60);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function uniqueMatches(query) {
    const lowerQuery = query.toLowerCase();
    const matches = allEntries().filter(function (entry) {
      return entry.text.toLowerCase().includes(lowerQuery);
    });
    const seen = new Set();
    return matches.filter(function (entry) {
      const key = entry.label + "|" + entry.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ===========================================
  // Recent searches (localStorage, last 5)
  // ===========================================

  const RECENT_KEY = "sma_recent_searches";

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveRecent(query) {
    if (!query) return;
    let recent = getRecent().filter(function (q) {
      return q.toLowerCase() !== query.toLowerCase();
    });
    recent.unshift(query);
    recent = recent.slice(0, 5);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) {}
    renderRecent();
  }

  function renderRecent() {
    if (!recentEl || !recentWrap) return;
    const recent = getRecent();

    if (recent.length === 0) {
      recentWrap.style.display = "none";
      return;
    }

    recentWrap.style.display = "flex";
    recentEl.innerHTML = "";
    recent.forEach(function (q) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "recent-chip";
      chip.textContent = q;
      chip.addEventListener("click", function () {
        searchBox.value = q;
        runSearch();
        suggestionsEl.classList.remove("show");
      });
      recentEl.appendChild(chip);
    });
  }

  // ===========================================
  // Autocomplete suggestions (top titles matching
  // what's currently typed, shown under the box)
  // ===========================================

  function renderSuggestions(query) {
    if (!suggestionsEl) return;

    if (!query) {
      suggestionsEl.classList.remove("show");
      suggestionsEl.innerHTML = "";
      return;
    }

    const lowerQuery = query.toLowerCase();
    const titleMatches = allEntries().filter(function (entry) {
      return entry.title.toLowerCase().includes(lowerQuery);
    });

    const seen = new Set();
    const unique = titleMatches.filter(function (entry) {
      if (seen.has(entry.title)) return false;
      seen.add(entry.title);
      return true;
    }).slice(0, 5);

    if (unique.length === 0) {
      suggestionsEl.classList.remove("show");
      suggestionsEl.innerHTML = "";
      return;
    }

    suggestionsEl.innerHTML = "";
    unique.forEach(function (entry) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "suggestion-item";
      item.innerHTML = "<span>" + entry.icon + "</span> " + entry.title;
      item.addEventListener("click", function () {
        searchBox.value = entry.title;
        suggestionsEl.classList.remove("show");
        runSearch();
      });
      suggestionsEl.appendChild(item);
    });

    suggestionsEl.classList.add("show");
  }

  // ===========================================
  // Render results
  // ===========================================

  function runSearch() {
    const query = searchBox.value.trim();

    if (!query) {
      resultsEl.innerHTML = "";
      statusEl.textContent = "";
      renderRecent();
      return;
    }

    const unique = uniqueMatches(query);

    statusEl.textContent = unique.length
      ? unique.length + " result" + (unique.length === 1 ? "" : "s") + " found"
      : "No results found for \"" + query + "\"";

    resultsEl.innerHTML = "";

    unique.forEach(function (entry) {
      const item = document.createElement("a");
      item.className = "search-result";
      item.href = entry.url + "?highlight=" + encodeURIComponent(entry.title);

      const badge = document.createElement("span");
      badge.className = "search-result-badge";
      badge.textContent = entry.icon + " " + entry.label;

      const title = document.createElement("h3");
      title.textContent = entry.title;

      const preview = document.createElement("p");
      preview.textContent = snippet(entry.text, query);

      item.appendChild(badge);
      item.appendChild(title);
      item.appendChild(preview);
      resultsEl.appendChild(item);
    });
  }

  searchBox.addEventListener("keyup", function (e) {
    const query = searchBox.value.trim();
    renderSuggestions(query);

    if (e.key === "Enter" && query) {
      saveRecent(query);
      suggestionsEl.classList.remove("show");
    }

    runSearch();
  });

  searchBox.addEventListener("focus", function () {
    if (!searchBox.value.trim()) renderRecent();
  });

  document.addEventListener("click", function (e) {
    if (!suggestionsEl.contains(e.target) && e.target !== searchBox) {
      suggestionsEl.classList.remove("show");
    }
  });

  renderRecent();
}
