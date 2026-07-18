// ===========================================
// Firebase setup
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");

const loggedInBox = document.getElementById("loggedInBox");
const userEmailDisplay = document.getElementById("userEmail");
const logoutButton = document.getElementById("logoutButton");

// ===========================================
// Handle login form submit
// ===========================================

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    errorMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(function () {
        loginForm.reset();
      })
      .catch(function (error) {
        errorMessage.textContent = friendlyErrorMessage(error.code);
      });
  });
}

// ===========================================
// Handle logout button
// ===========================================

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    signOut(auth);
  });
}

// ===========================================
// React to login state changes
// ===========================================

onAuthStateChanged(auth, function (user) {
  if (user) {
    if (loginForm) loginForm.style.display = "none";
    if (loggedInBox) {
      loggedInBox.style.display = "block";
      userEmailDisplay.textContent = user.email;
    }
  } else {
    if (loginForm) loginForm.style.display = "block";
    if (loggedInBox) loggedInBox.style.display = "none";
  }
});

// ===========================================
// Friendly error messages
// ===========================================

function friendlyErrorMessage(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "No account found with that email and password.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
