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
  setDoc,
  getDoc,
  onSnapshot,
  query,
  increment
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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
const storage = getStorage(app);

// ===========================================
// Storage usage tracker — caps uploads at 4.7GB,
// leaving a safety buffer under Firebase's real
// 5GB free limit.
// ===========================================

const STORAGE_LIMIT_BYTES = 4.7 * 1024 * 1024 * 1024; // 4.7 GB
let currentUsageBytes = 0;

const usageBarFill = document.getElementById("usageBarFill");
const usageText = document.getElementById("usageText");

onSnapshot(doc(db, "siteContent", "storageUsage"), function (docSnap) {
  currentUsageBytes = docSnap.exists() ? (docSnap.data().totalBytes || 0) : 0;
  renderUsageBar();
});

function renderUsageBar() {
  if (!usageBarFill || !usageText) return;

  const usedGB = currentUsageBytes / (1024 * 1024 * 1024);
  const limitGB = STORAGE_LIMIT_BYTES / (1024 * 1024 * 1024);
  const percent = Math.min(100, (currentUsageBytes / STORAGE_LIMIT_BYTES) * 100);

  usageBarFill.style.width = percent + "%";
  usageText.textContent = usedGB.toFixed(2) + " GB used of " + limitGB.toFixed(1) + " GB";

  usageBarFill.classList.remove("usage-warn", "usage-full");
  if (percent >= 90) {
    usageBarFill.classList.add("usage-full");
  } else if (percent >= 70) {
    usageBarFill.classList.add("usage-warn");
  }
}

function addToStorageUsage(bytes) {
  if (!bytes) return Promise.resolve();
  return setDoc(doc(db, "siteContent", "storageUsage"), { totalBytes: increment(bytes) }, { merge: true });
}

function wouldExceedLimit(newBytes) {
  return (currentUsageBytes + newBytes) > STORAGE_LIMIT_BYTES;
}
// Storage and returns the public download URL.
// folder e.g. "books/covers", "saints/portraits"
// ===========================================

function uploadFile(file, folder) {
  const safeName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storageRef = ref(storage, folder + "/" + safeName);
  return uploadBytes(storageRef, file).then(function () {
    return getDownloadURL(storageRef);
  }).then(function (url) {
    return { url: url, size: file.size };
  });
}

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
    window.location.href = "/login/";
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    signOut(auth).then(function () {
      window.location.href = "/login/";
    });
  });
}

// ===========================================
// TAB SWITCHING
// ===========================================

const tabButtons = document.querySelectorAll(".admin-tab-btn");
const tabPanels = document.querySelectorAll(".admin-panel");

tabButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    const target = btn.getAttribute("data-tab");

    tabButtons.forEach(function (b) { b.classList.remove("active"); });
    tabPanels.forEach(function (p) { p.classList.remove("active"); });

    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

// ===========================================
// Small helper to build a consistent admin list row
// ===========================================

function buildAdminRow(titleHtml, subtitleText, onEdit, onDelete) {
  const row = document.createElement("div");
  row.className = "admin-row";

  const info = document.createElement("div");
  info.className = "admin-row-info";
  info.innerHTML =
    "<strong>" + titleHtml + "</strong>" +
    (subtitleText ? "<br><span>" + subtitleText + "</span>" : "");

  const actions = document.createElement("div");
  actions.className = "admin-row-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "admin-btn-edit";
  editBtn.addEventListener("click", onEdit);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "admin-btn-delete";
  deleteBtn.addEventListener("click", onDelete);

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  row.appendChild(info);
  row.appendChild(actions);
  return row;
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
    scheduleList.innerHTML = '<p class="admin-list-empty">No Mass schedules added yet.</p>';
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
    const subtitle =
      (entry.language ? entry.language : "") +
      (entry.description ? (entry.language ? " · " : "") + entry.description : "");

    const row = buildAdminRow(
      entry.day + " — " + entry.time,
      subtitle,
      function () { enterScheduleEditMode(entry.id, entry); },
      function () {
        if (confirm("Delete the " + entry.day + " " + entry.time + " Mass schedule?")) {
          deleteDoc(doc(db, "massSchedules", entry.id));
        }
      }
    );

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
const bookCoverImageUrl = document.getElementById("bookCoverImageUrl");
const bookPdfLink = document.getElementById("bookPdfLink");
const bookPdfLinkUrl = document.getElementById("bookPdfLinkUrl");
const bookError = document.getElementById("bookError");
const bookSubmitButton = document.getElementById("bookSubmitButton");
const bookCancelButton = document.getElementById("bookCancelButton");
const bookList = document.getElementById("bookList");
const bookCoverCurrent = document.getElementById("bookCoverCurrent");
const bookPdfCurrent = document.getElementById("bookPdfCurrent");

let editingBookId = null;
let editingBookCoverUrl = "";
let editingBookPdfUrl = "";
let editingBookCoverSize = 0;
let editingBookPdfSize = 0;

// Resolves one asset slot: URL fallback wins if filled,
// otherwise a selected file uploads, otherwise the existing
// value (edit mode) or empty (add mode) is kept.
function resolveAsset(file, pastedUrl, folder, existingUrl, existingSize) {
  const url = pastedUrl.trim();
  if (url) {
    return Promise.resolve({ url: url, size: 0, wasUploaded: false, previousSize: existingSize });
  }
  if (file) {
    if (wouldExceedLimit(file.size)) {
      return Promise.reject(new Error("Uploading this file would exceed your 4.7GB storage limit. Use the URL fallback field instead, or delete some existing uploads."));
    }
    return uploadFile(file, folder).then(function (result) {
      return { url: result.url, size: result.size, wasUploaded: true, previousSize: existingSize };
    });
  }
  return Promise.resolve({ url: existingUrl, size: existingSize, wasUploaded: false, previousSize: existingSize, unchanged: true });
}

if (bookForm) {
  bookForm.addEventListener("submit", function (e) {
    e.preventDefault();
    bookError.textContent = "";

    if (!bookTitle.value.trim()) {
      bookError.textContent = "Title is required.";
      return;
    }

    bookSubmitButton.disabled = true;
    bookSubmitButton.textContent = "Saving…";

    const coverFile = bookCoverImage.files[0];
    const pdfFile = bookPdfLink.files[0];

    Promise.all([
      resolveAsset(coverFile, bookCoverImageUrl.value, "books/covers", editingBookCoverUrl, editingBookCoverSize),
      resolveAsset(pdfFile, bookPdfLinkUrl.value, "books/pdfs", editingBookPdfUrl, editingBookPdfSize)
    ])
      .then(function (results) {
        const coverResult = results[0];
        const pdfResult = results[1];

        const data = {
          title: bookTitle.value.trim(),
          author: bookAuthor.value.trim(),
          category: bookCategory.value.trim(),
          description: bookDescription.value.trim(),
          coverImage: coverResult.url || "",
          pdfLink: pdfResult.url || "",
          coverImageSize: coverResult.size || 0,
          pdfSize: pdfResult.size || 0
        };

        const savePromise = editingBookId
          ? updateDoc(doc(db, "books", editingBookId), data)
          : addDoc(collection(db, "books"), data);

        return savePromise.then(function () {
          // Adjust the running storage total: subtract whatever
          // was replaced/removed, add whatever was newly uploaded.
          let delta = 0;
          if (!coverResult.unchanged) delta += coverResult.size - coverResult.previousSize;
          if (!pdfResult.unchanged) delta += pdfResult.size - pdfResult.previousSize;
          return addToStorageUsage(delta);
        });
      })
      .then(function () {
        bookForm.reset();
        exitBookEditMode();
      })
      .catch(function (error) {
        bookError.textContent = "Error saving book: " + error.message;
      })
      .finally(function () {
        bookSubmitButton.disabled = false;
        bookSubmitButton.textContent = editingBookId ? "Save Changes" : "Add Book";
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
  editingBookCoverUrl = data.coverImage || "";
  editingBookPdfUrl = data.pdfLink || "";
  editingBookCoverSize = data.coverImageSize || 0;
  editingBookPdfSize = data.pdfSize || 0;
  bookTitle.value = data.title || "";
  bookAuthor.value = data.author || "";
  bookCategory.value = data.category || "";
  bookDescription.value = data.description || "";
  bookCoverImage.value = "";
  bookPdfLink.value = "";
  bookCoverImageUrl.value = "";
  bookPdfLinkUrl.value = "";
  bookCoverCurrent.textContent = editingBookCoverUrl ? "Current file on record — choose a new one, or paste a URL, only to replace it." : "No cover uploaded yet.";
  bookPdfCurrent.textContent = editingBookPdfUrl ? "Current file on record — choose a new one, or paste a URL, only to replace it." : "No PDF uploaded yet.";
  bookSubmitButton.textContent = "Save Changes";
  bookCancelButton.style.display = "block";
  bookForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitBookEditMode() {
  editingBookId = null;
  editingBookCoverUrl = "";
  editingBookPdfUrl = "";
  editingBookCoverSize = 0;
  editingBookPdfSize = 0;
  bookCoverCurrent.textContent = "";
  bookPdfCurrent.textContent = "";
  bookSubmitButton.textContent = "Add Book";
  bookCancelButton.style.display = "none";
}

onSnapshot(query(collection(db, "books")), function (snapshot) {
  if (snapshot.empty) {
    bookList.innerHTML = '<p class="admin-list-empty">No books added yet.</p>';
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
    const row = buildAdminRow(
      entry.title,
      entry.author ? "by " + entry.author : (entry.category || ""),
      function () { enterBookEditMode(entry.id, entry); },
      function () {
        if (confirm('Delete "' + entry.title + '"?')) {
          const freedBytes = (entry.coverImageSize || 0) + (entry.pdfSize || 0);
          deleteDoc(doc(db, "books", entry.id)).then(function () {
            if (freedBytes) addToStorageUsage(-freedBytes);
          });
        }
      }
    );

    bookList.appendChild(row);
  });
});

// ===========================================
// SAINTS MANAGER
// ===========================================

const saintForm = document.getElementById("saintForm");
const saintName = document.getElementById("saintName");
const saintTitle = document.getElementById("saintTitle");
const saintYears = document.getElementById("saintYears");
const saintFeastDay = document.getElementById("saintFeastDay");
const saintPatronage = document.getElementById("saintPatronage");
const saintMajorWorks = document.getElementById("saintMajorWorks");
const saintBio = document.getElementById("saintBio");
const saintCoverImage = document.getElementById("saintCoverImage");
const saintCoverImageUrl = document.getElementById("saintCoverImageUrl");
const saintError = document.getElementById("saintError");
const saintSubmitButton = document.getElementById("saintSubmitButton");
const saintCancelButton = document.getElementById("saintCancelButton");
const saintList = document.getElementById("saintList");
const saintCoverCurrent = document.getElementById("saintCoverCurrent");

let editingSaintId = null;
let editingSaintCoverUrl = "";
let editingSaintCoverSize = 0;

if (saintForm) {
  saintForm.addEventListener("submit", function (e) {
    e.preventDefault();
    saintError.textContent = "";

    if (!saintName.value.trim()) {
      saintError.textContent = "Name is required.";
      return;
    }

    saintSubmitButton.disabled = true;
    saintSubmitButton.textContent = "Saving…";

    const coverFile = saintCoverImage.files[0];

    resolveAsset(coverFile, saintCoverImageUrl.value, "saints/portraits", editingSaintCoverUrl, editingSaintCoverSize)
      .then(function (coverResult) {
        const data = {
          name: saintName.value.trim(),
          title: saintTitle.value.trim(),
          years: saintYears.value.trim(),
          feastDay: saintFeastDay.value.trim(),
          patronage: saintPatronage.value.trim(),
          majorWorks: saintMajorWorks.value.trim(),
          bio: saintBio.value.trim(),
          coverImage: coverResult.url || "",
          coverImageSize: coverResult.size || 0
        };

        const savePromise = editingSaintId
          ? updateDoc(doc(db, "saints", editingSaintId), data)
          : addDoc(collection(db, "saints"), data);

        return savePromise.then(function () {
          if (coverResult.unchanged) return;
          return addToStorageUsage(coverResult.size - coverResult.previousSize);
        });
      })
      .then(function () {
        saintForm.reset();
        exitSaintEditMode();
      })
      .catch(function (error) {
        saintError.textContent = "Error saving saint: " + error.message;
      })
      .finally(function () {
        saintSubmitButton.disabled = false;
        saintSubmitButton.textContent = editingSaintId ? "Save Changes" : "Add Saint";
      });
  });
}

if (saintCancelButton) {
  saintCancelButton.addEventListener("click", function () {
    saintForm.reset();
    exitSaintEditMode();
  });
}

function enterSaintEditMode(id, data) {
  editingSaintId = id;
  editingSaintCoverUrl = data.coverImage || "";
  editingSaintCoverSize = data.coverImageSize || 0;
  saintName.value = data.name || "";
  saintTitle.value = data.title || "";
  saintYears.value = data.years || "";
  saintFeastDay.value = data.feastDay || "";
  saintPatronage.value = data.patronage || "";
  saintMajorWorks.value = data.majorWorks || "";
  saintBio.value = data.bio || "";
  saintCoverImage.value = "";
  saintCoverImageUrl.value = "";
  saintCoverCurrent.textContent = editingSaintCoverUrl ? "Current portrait on record — choose a new one, or paste a URL, only to replace it." : "No portrait uploaded yet.";
  saintSubmitButton.textContent = "Save Changes";
  saintCancelButton.style.display = "block";
  saintForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitSaintEditMode() {
  editingSaintId = null;
  editingSaintCoverUrl = "";
  editingSaintCoverSize = 0;
  saintCoverCurrent.textContent = "";
  saintSubmitButton.textContent = "Add Saint";
  saintCancelButton.style.display = "none";
}

onSnapshot(query(collection(db, "saints")), function (snapshot) {
  if (snapshot.empty) {
    saintList.innerHTML = '<p class="admin-list-empty">No saints added yet.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  saintList.innerHTML = "";

  entries.forEach(function (entry) {
    const row = buildAdminRow(
      entry.name,
      entry.title || "",
      function () { enterSaintEditMode(entry.id, entry); },
      function () {
        if (confirm('Delete "' + entry.name + '"?')) {
          const freedBytes = entry.coverImageSize || 0;
          deleteDoc(doc(db, "saints", entry.id)).then(function () {
            if (freedBytes) addToStorageUsage(-freedBytes);
          });
        }
      }
    );

    saintList.appendChild(row);
  });
});

// ===========================================
// CHURCH FATHERS MANAGER
// ===========================================

const fatherForm = document.getElementById("fatherForm");
const fatherName = document.getElementById("fatherName");
const fatherTitle = document.getElementById("fatherTitle");
const fatherYears = document.getElementById("fatherYears");
const fatherRegion = document.getElementById("fatherRegion");
const fatherFeastDay = document.getElementById("fatherFeastDay");
const fatherMajorWorks = document.getElementById("fatherMajorWorks");
const fatherBio = document.getElementById("fatherBio");
const fatherCoverImage = document.getElementById("fatherCoverImage");
const fatherCoverImageUrl = document.getElementById("fatherCoverImageUrl");
const fatherError = document.getElementById("fatherError");
const fatherSubmitButton = document.getElementById("fatherSubmitButton");
const fatherCancelButton = document.getElementById("fatherCancelButton");
const fatherList = document.getElementById("fatherList");
const fatherCoverCurrent = document.getElementById("fatherCoverCurrent");

let editingFatherId = null;
let editingFatherCoverUrl = "";
let editingFatherCoverSize = 0;

if (fatherForm) {
  fatherForm.addEventListener("submit", function (e) {
    e.preventDefault();
    fatherError.textContent = "";

    if (!fatherName.value.trim()) {
      fatherError.textContent = "Name is required.";
      return;
    }

    fatherSubmitButton.disabled = true;
    fatherSubmitButton.textContent = "Saving…";

    const coverFile = fatherCoverImage.files[0];

    resolveAsset(coverFile, fatherCoverImageUrl.value, "fathers/portraits", editingFatherCoverUrl, editingFatherCoverSize)
      .then(function (coverResult) {
        const data = {
          name: fatherName.value.trim(),
          title: fatherTitle.value.trim(),
          years: fatherYears.value.trim(),
          region: fatherRegion.value.trim(),
          feastDay: fatherFeastDay.value.trim(),
          majorWorks: fatherMajorWorks.value.trim(),
          bio: fatherBio.value.trim(),
          coverImage: coverResult.url || "",
          coverImageSize: coverResult.size || 0
        };

        const savePromise = editingFatherId
          ? updateDoc(doc(db, "fathers", editingFatherId), data)
          : addDoc(collection(db, "fathers"), data);

        return savePromise.then(function () {
          if (coverResult.unchanged) return;
          return addToStorageUsage(coverResult.size - coverResult.previousSize);
        });
      })
      .then(function () {
        fatherForm.reset();
        exitFatherEditMode();
      })
      .catch(function (error) {
        fatherError.textContent = "Error saving Church Father: " + error.message;
      })
      .finally(function () {
        fatherSubmitButton.disabled = false;
        fatherSubmitButton.textContent = editingFatherId ? "Save Changes" : "Add Church Father";
      });
  });
}

if (fatherCancelButton) {
  fatherCancelButton.addEventListener("click", function () {
    fatherForm.reset();
    exitFatherEditMode();
  });
}

function enterFatherEditMode(id, data) {
  editingFatherId = id;
  editingFatherCoverUrl = data.coverImage || "";
  editingFatherCoverSize = data.coverImageSize || 0;
  fatherName.value = data.name || "";
  fatherTitle.value = data.title || "";
  fatherYears.value = data.years || "";
  fatherRegion.value = data.region || "";
  fatherFeastDay.value = data.feastDay || "";
  fatherMajorWorks.value = data.majorWorks || "";
  fatherBio.value = data.bio || "";
  fatherCoverImage.value = "";
  fatherCoverImageUrl.value = "";
  fatherCoverCurrent.textContent = editingFatherCoverUrl ? "Current portrait on record — choose a new one, or paste a URL, only to replace it." : "No portrait uploaded yet.";
  fatherSubmitButton.textContent = "Save Changes";
  fatherCancelButton.style.display = "block";
  fatherForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitFatherEditMode() {
  editingFatherId = null;
  editingFatherCoverUrl = "";
  editingFatherCoverSize = 0;
  fatherCoverCurrent.textContent = "";
  fatherSubmitButton.textContent = "Add Church Father";
  fatherCancelButton.style.display = "none";
}

onSnapshot(query(collection(db, "fathers")), function (snapshot) {
  if (snapshot.empty) {
    fatherList.innerHTML = '<p class="admin-list-empty">No Church Fathers added yet.</p>';
    return;
  }

  const entries = [];
  snapshot.forEach(function (docSnap) {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  fatherList.innerHTML = "";

  entries.forEach(function (entry) {
    const row = buildAdminRow(
      entry.name,
      entry.title || "",
      function () { enterFatherEditMode(entry.id, entry); },
      function () {
        if (confirm('Delete "' + entry.name + '"?')) {
          const freedBytes = entry.coverImageSize || 0;
          deleteDoc(doc(db, "fathers", entry.id)).then(function () {
            if (freedBytes) addToStorageUsage(-freedBytes);
          });
        }
      }
    );

    fatherList.appendChild(row);
  });
});

// ===========================================
// ABOUT PAGE MANAGER
// ===========================================

const aboutForm = document.getElementById("aboutForm");
const aboutMissionInput = document.getElementById("aboutMissionInput");
const aboutHistoryInput = document.getElementById("aboutHistoryInput");
const aboutFaithInput = document.getElementById("aboutFaithInput");
const aboutLocationInput = document.getElementById("aboutLocationInput");
const aboutError = document.getElementById("aboutError");
const aboutSavedNote = document.getElementById("aboutSavedNote");

if (aboutForm) {
  // Pre-fill the form with whatever is currently saved
  getDoc(doc(db, "siteContent", "about")).then(function (docSnap) {
    if (docSnap.exists()) {
      const data = docSnap.data();
      aboutMissionInput.value = data.mission || "";
      aboutHistoryInput.value = data.history || "";
      aboutFaithInput.value = data.faith || "";
      aboutLocationInput.value = data.location || "";
    }
  });

  aboutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    aboutError.textContent = "";
    aboutSavedNote.style.display = "none";

    const data = {
      mission: aboutMissionInput.value.trim(),
      history: aboutHistoryInput.value.trim(),
      faith: aboutFaithInput.value.trim(),
      location: aboutLocationInput.value.trim()
    };

    setDoc(doc(db, "siteContent", "about"), data)
      .then(function () {
        aboutSavedNote.style.display = "block";
        setTimeout(function () { aboutSavedNote.style.display = "none"; }, 3000);
      })
      .catch(function (error) {
        aboutError.textContent = "Error saving About page: " + error.message;
      });
  });
}
