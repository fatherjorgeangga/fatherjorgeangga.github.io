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
// Display the schedule (read-only, public)
// ===========================================

const massScheduleList = document.getElementById("massScheduleList");
const dayOrder = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

onSnapshot(collection(db, "massSchedules"), function (snapshot) {
  if (snapshot.empty) {
    massScheduleList.innerHTML = '<p style="text-align:center; color:#888;">No Mass schedules have been posted yet. Please check back soon.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push(docSnap.data());
  });

  entries.sort(function (a, b) {
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.time.localeCompare(b.time);
  });

  // Group entries by day
  const grouped = {};
  entries.forEach(function (entry) {
    if (!grouped[entry.day]) grouped[entry.day] = [];
    grouped[entry.day].push(entry);
  });

  massScheduleList.innerHTML = "";

  dayOrder.forEach(function (day) {
    if (!grouped[day]) return;

    const dayCard = document.createElement("div");
    dayCard.className = "card";

    const heading = document.createElement("h2");
    heading.textContent = day;
    dayCard.appendChild(heading);

    grouped[day].forEach(function (entry) {
      const line = document.createElement("p");
      line.innerHTML =
        "<strong>" + entry.time + "</strong>" +
        (entry.language ? " — " + entry.language : "") +
        (entry.description ? "<br><span style=\"color:#666; font-size:15px;\">" + entry.description + "</span>" : "");
      dayCard.appendChild(line);
    });

    massScheduleList.appendChild(dayCard);
  });
});
