// ===========================================
// Firebase setup
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  doc,
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
// Live-load the About page content
// (single document: siteContent/about)
// ===========================================

const missionEl = document.getElementById("aboutMission");
const historyEl = document.getElementById("aboutHistory");
const faithEl = document.getElementById("aboutFaith");
const locationEl = document.getElementById("aboutLocation");

if (missionEl) {
  onSnapshot(doc(db, "siteContent", "about"), function (docSnap) {
    const data = docSnap.exists() ? docSnap.data() : {};

    missionEl.textContent = data.mission || "Content coming soon.";
    historyEl.textContent = data.history || "Content coming soon.";
    faithEl.textContent = data.faith || "Content coming soon.";
    locationEl.textContent = data.location || "Content coming soon.";
  });
}
