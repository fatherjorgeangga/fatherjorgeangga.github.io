// ===========================================
// Firebase setup
// (same config as login.js)
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjaYeBaaQMBH43eR0XIVyAlopxS6Ku3u0",
  authDomain: "saintmichaeltibuloy.firebaseapp.com",
  projectId: "saintmichaeltibuloy",
  storageBucket: "saintmichaeltibuloy.firebasestorage.app",
  messagingSenderId: "192594665363",
  appId: "1:192594665363:web:b030585199d7beb5cd5266"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ===========================================
// Page elements
// ===========================================

const checkingAuth = document.getElementById("checkingAuth");
const adminContent = document.getElementById("adminContent");
const userEmailDisplay = document.getElementById("userEmail");
const logoutButton = document.getElementById("logoutButton");

// ===========================================
// The guard: only show this page to logged-in users
// ===========================================

onAuthStateChanged(auth, function (user) {
  if (user) {
    // Logged in — show the admin panel
    checkingAuth.style.display = "none";
    adminContent.style.display = "block";
    userEmailDisplay.textContent = user.email;
  } else {
    // Not logged in — send them to the login page
    window.location.href = "login.html";
  }
});

// ===========================================
// Logout button
// ===========================================

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    signOut(auth).then(function () {
      window.location.href = "login.html";
    });
  });
}
