// ===========================================
// Firebase setup
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
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
const auth = getAuth(app);
const db = getFirestore(app);

// ===========================================
// Known admins
// ===========================================

const adminNames = {
  "kennmagbanua02@gmail.com": "Kent Magbanua",
  "kerr35712@gmail.com": "Kerr"
};

function getDisplayName(email) {
  return adminNames[email] || email;
}

// ===========================================
// Page elements — login guard
// ===========================================

const checkingAuth = document.getElementById("checkingAuth");
const adminContent = document.getElementById("adminContent");
const userEmailDisplay = document.getElementById("userEmail");
const logoutButton = document.getElementById("logoutButton");

onAuthStateChanged(auth, function (user) {
  if (user) {
    checkingAuth.style.display = "none";
    adminContent.style.display = "block";
    userEmailDisplay.textContent = getDisplayName(user.email);
  } else {
    window.location.href = "login.html";
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    signOut(auth).then(function () {
      window.location.href = "login.html";
    });
  });
}

// ===========================================
// Mass Schedule elements
// ===========================================

const scheduleForm = document.getElementById("scheduleForm");
const scheduleDay = document.getElementById("scheduleDay");
const scheduleTime = document.getElementById("scheduleTime");
const scheduleLanguage = document.getElementById("scheduleLanguage");
const scheduleDescription = document.getElementById("scheduleDescription");
const scheduleError = document.getElementById("scheduleError");
const scheduleSubmitButton = document.getElementById("scheduleSubmitButton");
const scheduleCancelButton = document.getElementById("scheduleCancelButton");
const scheduleList = document.getElementById("scheduleList");

const dayOrder = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

let editingId = null; // tracks which schedule we're editing, if any

// ===========================================
// Add or update a schedule entry
// ===========================================

if (scheduleForm) {
  scheduleForm.addEventListener("submit", function (e) {
    e.preventDefault();
    scheduleError.textContent = "";

    const data = {
      day: scheduleDay.value,
      time: scheduleTime.value.trim(),
      language: scheduleLanguage.value.trim(),
      description: scheduleDescription.value.trim()
    };

    if (!data.day || !data.time) {
      scheduleError.textContent = "Day and Time are required.";
      return;
    }

    const savePromise = editingId
      ? updateDoc(doc(db, "massSchedules", editingId), data)
      : addDoc(collection(db, "massSchedules"), data);

    savePromise
      .then(function () {
        scheduleForm.reset();
        exitEditMode();
      })
      .catch(function (error) {
        scheduleError.textContent = "Error saving schedule: " + error.message;
      });
  });
}

if (scheduleCancelButton) {
  scheduleCancelButton.addEventListener("click", function () {
    scheduleForm.reset();
    exitEditMode();
  });
}

function enterEditMode(id, data) {
  editingId = id;
  scheduleDay.value = data.day || "";
  scheduleTime.value = data.time || "";
  scheduleLanguage.value = data.language || "";
  scheduleDescription.value = data.description || "";
  scheduleSubmitButton.textContent = "Save Changes";
  scheduleCancelButton.style.display = "block";
  scheduleForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitEditMode() {
  editingId = null;
  scheduleSubmitButton.textContent = "Add Mass Schedule";
  scheduleCancelButton.style.display = "none";
}

// ===========================================
// Live list of current schedules
// ===========================================

const schedulesQuery = query(collection(db, "massSchedules"));

onSnapshot(schedulesQuery, function (snapshot) {
  if (snapshot.empty) {
    scheduleList.innerHTML = '<p style="text-align:center; color:#888;">No Mass schedules added yet.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort(function (a, b) {
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.time.localeCompare(b.time);
  });

  scheduleList.innerHTML = "";

  entries.forEach(function (entry) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #eee;";

    const info = document.createElement("div");
    info.innerHTML =
      "<strong>" + entry.day + " — " + entry.time + "</strong>" +
      (entry.language ? " <span style=\"color:#7b5a2c;\">(" + entry.language + ")</span>" : "") +
      (entry.description ? "<br><span style=\"color:#666; font-size:14px;\">" + entry.description + "</span>" : "");

    const buttons = document.createElement("div");
    buttons.style.cssText = "display:flex; gap:8px; flex-shrink:0;";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "book-button";
    editBtn.style.cssText = "border:none; cursor:pointer; padding:8px 16px;";
    editBtn.addEventListener("click", function () {
      enterEditMode(entry.id, entry);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "book-button";
    deleteBtn.style.cssText = "border:none; cursor:pointer; padding:8px 16px; background:#b00020;";
    deleteBtn.addEventListener("click", function () {
      if (confirm("Delete the " + entry.day + " " + entry.time + " Mass schedule?")) {
        deleteDoc(doc(db, "massSchedules", entry.id));
      }
    });

    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(buttons);
    scheduleList.appendChild(row);
  });
});
