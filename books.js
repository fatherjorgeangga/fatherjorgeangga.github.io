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
// Display the book grid (read-only, public)
// ===========================================

const bookGrid = document.getElementById("bookGrid");

onSnapshot(collection(db, "books"), function (snapshot) {
  if (snapshot.empty) {
    bookGrid.innerHTML = '<p style="text-align:center; color:#888; grid-column:1/-1;">No books added yet. Please check back soon.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push(docSnap.data());
  });

  entries.sort(function (a, b) {
    return a.title.localeCompare(b.title);
  });

  bookGrid.innerHTML = "";

  entries.forEach(function (entry) {
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

    if (entry.category) {
      const categoryEl = document.createElement("p");
      categoryEl.innerHTML = "<strong>Category:</strong> " + entry.category;
      content.appendChild(categoryEl);
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
    bookGrid.appendChild(card);
  });
});
