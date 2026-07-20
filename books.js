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
// The 3 category sections. "key" must exactly
// match the value saved from admin.html's
// bookCategory dropdown.
// ===========================================

const sections = [
  { key: "Fr. Jorge Publications", gridId: "bookGrid-fatherjorge" },
  { key: "Catechism / Baltimore",  gridId: "bookGrid-catechism" },
  { key: "Catholic Books",         gridId: "bookGrid-catholic" }
];

function buildCard(entry) {
  const card = document.createElement("div");
  card.className = "book-card searchable";

  const cover = document.createElement("div");
  cover.className = "book-cover";

  if (entry.coverImage) {
    const img = document.createElement("img");
    img.src = entry.coverImage;
    img.alt = entry.title;
    img.className = "book-image";
    cover.appendChild(img);
  } else {
    cover.textContent = "📖";
  }

  const content = document.createElement("div");
  content.className = "book-content";

  const titleEl = document.createElement("h3");
  titleEl.textContent = entry.title;
  content.appendChild(titleEl);

  if (entry.author) {
    const authorEl = document.createElement("p");
    authorEl.innerHTML = "<strong>Author:</strong> " + entry.author;
    content.appendChild(authorEl);
  }

  if (entry.description) {
    const descEl = document.createElement("p");
    descEl.textContent = entry.description;
    content.appendChild(descEl);
  }

  const linkEl = document.createElement("a");
  linkEl.className = "book-button";
  if (entry.pdfLink) {
    linkEl.href = entry.pdfLink;
    linkEl.target = "_blank";
    linkEl.textContent = "Read PDF";
  } else {
    linkEl.href = "#";
    linkEl.textContent = "Coming Soon";
  }
  content.appendChild(linkEl);

  card.appendChild(cover);
  card.appendChild(content);
  return card;
}

onSnapshot(collection(db, "books"), function (snapshot) {

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push(docSnap.data());
  });

  entries.sort(function (a, b) {
    return (a.title || "").localeCompare(b.title || "");
  });

  sections.forEach(function (section) {
    const gridEl = document.getElementById(section.gridId);
    if (!gridEl) return;

    const matches = entries.filter(function (entry) {
      return entry.category === section.key;
    });

    if (matches.length === 0) {
      gridEl.innerHTML = '<p style="text-align:center; color:#888; grid-column:1/-1;">No books added yet in this section.</p>';
      return;
    }

    gridEl.innerHTML = "";
    matches.forEach(function (entry) {
      gridEl.appendChild(buildCard(entry));
    });
  });

});
