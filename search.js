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
// In-memory search index. Rebuilt whenever
// static pages finish loading or Firestore
// data changes.
// ===========================================

let staticEntries = [];   // from the permanent, hand-written cards
let liveEntries = {       // from Firestore, keyed by collection
  books: [],
  saints: [],
  fathers: []
};

const searchBox = document.getElementById("globalSearch");
const resultsEl = document.getElementById("searchResults");
const statusEl = document.getElementById("searchStatus");

// ===========================================
// Step 1 — load static cards from each page
// by fetching the page and reading its
// already-written HTML (councils, plus the
// permanent Saints/Fathers/Books sections).
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
      .catch(function () {
        return [];
      });
  })
).then(function (results) {
  staticEntries = results.flat();
  runSearch();
});

// ===========================================
// Step 2 — keep Firestore collections in sync
// live, so newly-added entries are searchable
// immediately without a page refresh.
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

// ===========================================
// Step 3 — search + render
// ===========================================

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

function runSearch() {
  if (!searchBox || !resultsEl) return;

  const query = searchBox.value.trim();

  if (!query) {
    resultsEl.innerHTML = "";
    if (statusEl) statusEl.textContent = "";
    return;
  }

  const lowerQuery = query.toLowerCase();
  const matches = allEntries().filter(function (entry) {
    return entry.text.toLowerCase().includes(lowerQuery);
  });

  // De-duplicate by title+url (Firestore listeners can briefly overlap with static fetch results)
  const seen = new Set();
  const unique = matches.filter(function (entry) {
    const key = entry.label + "|" + entry.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (statusEl) {
    statusEl.textContent = unique.length
      ? unique.length + " result" + (unique.length === 1 ? "" : "s") + " found"
      : "No results found for \"" + query + "\"";
  }

  resultsEl.innerHTML = "";

  unique.forEach(function (entry) {
    const item = document.createElement("a");
    item.className = "search-result";
    item.href = entry.url;

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

if (searchBox) {
  searchBox.addEventListener("keyup", runSearch);
}
