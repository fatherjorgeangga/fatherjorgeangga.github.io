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
// Display the Church Fathers grid (read-only, public)
// ===========================================

const fatherGrid = document.getElementById("fatherGrid");

onSnapshot(collection(db, "fathers"), function (snapshot) {
  if (snapshot.empty) {
    fatherGrid.innerHTML = '<p style="text-align:center; color:#888; grid-column:1/-1;">No additional Church Fathers have been added yet.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push(docSnap.data());
  });

  entries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  fatherGrid.innerHTML = "";

  entries.forEach(function (entry) {
    const card = document.createElement("div");
    card.className = "book-card searchable";

    const cover = document.createElement("div");
    cover.className = "book-cover";

    if (entry.coverImage) {
      const img = document.createElement("img");
      img.src = entry.coverImage;
      img.alt = entry.name;
      img.className = "book-image top";
      cover.appendChild(img);
    } else {
      cover.textContent = "👨‍🏫";
    }

    const content = document.createElement("div");
    content.className = "book-content";

    const nameEl = document.createElement("h3");
    nameEl.textContent = entry.name;
    content.appendChild(nameEl);

    if (entry.years) {
      const p = document.createElement("p");
      p.innerHTML = "<strong>Years:</strong> " + entry.years;
      content.appendChild(p);
    }

    if (entry.title) {
      const p = document.createElement("p");
      p.innerHTML = "<strong>Title:</strong> " + entry.title;
      content.appendChild(p);
    }

    if (entry.region) {
      const p = document.createElement("p");
      p.innerHTML = "<strong>Region:</strong> " + entry.region;
      content.appendChild(p);
    }

    if (entry.feastDay) {
      const p = document.createElement("p");
      p.innerHTML = "<strong>Feast Day:</strong> " + entry.feastDay;
      content.appendChild(p);
    }

    if (entry.majorWorks) {
      const label = document.createElement("p");
      label.innerHTML = "<strong>Major Works:</strong>";
      content.appendChild(label);

      const ul = document.createElement("ul");
      entry.majorWorks.split(",").forEach(function (work) {
        const trimmed = work.trim();
        if (!trimmed) return;
        const li = document.createElement("li");
        li.textContent = trimmed;
        ul.appendChild(li);
      });
      content.appendChild(ul);
    }

    if (entry.bio) {
      const p = document.createElement("p");
      p.textContent = entry.bio;
      content.appendChild(p);
    }

    const btn = document.createElement("a");
    btn.className = "book-button";
    btn.href = "#";
    btn.textContent = "Biography";
    content.appendChild(btn);

    card.appendChild(cover);
    card.appendChild(content);
    fatherGrid.appendChild(card);
  });
});
