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
  query
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
  "fatherjorgeangga@parish.org": "Fr. Jorge Angga",
  "petroetpauloalcazaren@parish.org": "Petro et Paulo"
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
// MASS SCHEDULE MANAGER
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

let editingScheduleId = null;

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

    const savePromise = editingScheduleId
      ? updateDoc(doc(db, "massSchedules", editingScheduleId), data)
      : addDoc(collection(db, "massSchedules"), data);

    savePromise
      .then(function () {
        scheduleForm.reset();
        exitScheduleEditMode();
      })
      .catch(function (error) {
        scheduleError.textContent = "Error saving schedule: " + error.message;
      });
  });
}

if (scheduleCancelButton) {
  scheduleCancelButton.addEventListener("click", function () {
    scheduleForm.reset();
    exitScheduleEditMode();
  });
}

function enterScheduleEditMode(id, data) {
  editingScheduleId = id;
  scheduleDay.value = data.day || "";
  scheduleTime.value = data.time || "";
  scheduleLanguage.value = data.language || "";
  scheduleDescription.value = data.description || "";
  scheduleSubmitButton.textContent = "Save Changes";
  scheduleCancelButton.style.display = "block";
  scheduleForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitScheduleEditMode() {
  editingScheduleId = null;
  scheduleSubmitButton.textContent = "Add Mass Schedule";
  scheduleCancelButton.style.display = "none";
}

onSnapshot(query(collection(db, "massSchedules")), function (snapshot) {
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
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #eee; flex-wrap:wrap; gap:10px;";

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
      enterScheduleEditMode(entry.id, entry);
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

// ===========================================
// BOOKS MANAGER
// ===========================================

const bookForm = document.getElementById("bookForm");
const bookTitle = document.getElementById("bookTitle");
const bookAuthor = document.getElementById("bookAuthor");
const bookCategory = document.getElementById("bookCategory");
const bookDescription = document.getElementById("bookDescription");
const bookCoverImage = document.getElementById("bookCoverImage");
const bookPdfLink = document.getElementById("bookPdfLink");
const bookError = document.getElementById("bookError");
const bookSubmitButton = document.getElementById("bookSubmitButton");
const bookCancelButton = document.getElementById("bookCancelButton");
const bookList = document.getElementById("bookList");

let editingBookId = null;

if (bookForm) {
  bookForm.addEventListener("submit", function (e) {
    e.preventDefault();
    bookError.textContent = "";

    const data = {
      title: bookTitle.value.trim(),
      author: bookAuthor.value.trim(),
      category: bookCategory.value.trim(),
      description: bookDescription.value.trim(),
      coverImage: bookCoverImage.value.trim(),
      pdfLink: bookPdfLink.value.trim()
    };

    if (!data.title) {
      bookError.textContent = "Title is required.";
      return;
    }

    const savePromise = editingBookId
      ? updateDoc(doc(db, "books", editingBookId), data)
      : addDoc(collection(db, "books"), data);

    savePromise
      .then(function () {
        bookForm.reset();
        exitBookEditMode();
      })
      .catch(function (error) {
        bookError.textContent = "Error saving book: " + error.message;
      });
  });
}

if (bookCancelButton) {
  bookCancelButton.addEventListener("click", function () {
    bookForm.reset();
    exitBookEditMode();
  });
}

function enterBookEditMode(id, data) {
  editingBookId = id;
  bookTitle.value = data.title || "";
  bookAuthor.value = data.author || "";
  bookCategory.value = data.category || "";
  bookDescription.value = data.description || "";
  bookCoverImage.value = data.coverImage || "";
  bookPdfLink.value = data.pdfLink || "";
  bookSubmitButton.textContent = "Save Changes";
  bookCancelButton.style.display = "block";
  bookForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitBookEditMode() {
  editingBookId = null;
  bookSubmitButton.textContent = "Add Book";
  bookCancelButton.style.display = "none";
}

onSnapshot(query(collection(db, "books")), function (snapshot) {
  if (snapshot.empty) {
    bookList.innerHTML = '<p style="text-align:center; color:#888;">No books added yet.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort(function (a, b) {
    return a.title.localeCompare(b.title);
  });

  bookList.innerHTML = "";

  entries.forEach(function (entry) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #eee; flex-wrap:wrap; gap:10px;";

    const info = document.createElement("div");
    info.innerHTML =
      "<strong>" + entry.title + "</strong>" +
      (entry.author ? " <span style=\"color:#7b5a2c;\">— " + entry.author + "</span>" : "") +
      (entry.category ? "<br><span style=\"color:#666; font-size:14px;\">" + entry.category + "</span>" : "");

    const buttons = document.createElement("div");
    buttons.style.cssText = "display:flex; gap:8px; flex-shrink:0;";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "book-button";
    editBtn.style.cssText = "border:none; cursor:pointer; padding:8px 16px;";
    editBtn.addEventListener("click", function () {
      enterBookEditMode(entry.id, entry);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "book-button";
    deleteBtn.style.cssText = "border:none; cursor:pointer; padding:8px 16px; background:#b00020;";
    deleteBtn.addEventListener("click", function () {
      if (confirm('Delete "' + entry.title + '"?')) {
        deleteDoc(doc(db, "books", entry.id));
      }
    });

    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(buttons);
    bookList.appendChild(row);
  });
});
