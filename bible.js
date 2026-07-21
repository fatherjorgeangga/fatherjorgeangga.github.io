// ===========================================
// Bible Reader (Douay-Rheims)
//
// Expects a JSON data file at /bible-data/bible.json
// shaped like:
//
// {
//   "Genesis": {
//     "1": ["In the beginning...", "And the earth was void..."],
//     "2": ["..."]
//   },
//   "Exodus": { ... },
//   ...
// }
//
// i.e. book name -> chapter number (as a string) -> array
// of verse strings, in order. If your downloaded data file
// uses a different shape, tell Claude the structure and the
// loader below can be adjusted quickly.
// ===========================================

const bookSelect = document.getElementById("bibleBook");
const chapterSelect = document.getElementById("bibleChapter");
const loadingEl = document.getElementById("bibleLoading");
const readerEl = document.getElementById("bibleReader");
const chapterTitleEl = document.getElementById("bibleChapterTitle");
const versesEl = document.getElementById("bibleVerses");
const prevBtn = document.getElementById("biblePrev");
const nextBtn = document.getElementById("bibleNext");

if (bookSelect) {

  let bibleData = null;
  let bookNames = [];

  fetch("/bible-data/bible.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Bible data file not found");
      return res.json();
    })
    .then(function (data) {
      bibleData = data;
      bookNames = Object.keys(data);
      populateBooks();
      loadingEl.style.display = "none";
      readerEl.style.display = "block";

      // Restore last-read position if saved, else start at Genesis 1
      const saved = getSavedPosition();
      if (saved && bibleData[saved.book] && bibleData[saved.book][saved.chapter]) {
        bookSelect.value = saved.book;
        populateChapters(saved.book);
        chapterSelect.value = saved.chapter;
      } else {
        populateChapters(bookNames[0]);
      }

      renderChapter();
    })
    .catch(function (err) {
      loadingEl.textContent = "Scripture text hasn't been added to the site yet. Please check back soon.";
      console.error(err);
    });

  function populateBooks() {
    bookSelect.innerHTML = "";
    bookNames.forEach(function (name) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      bookSelect.appendChild(opt);
    });
  }

  function populateChapters(bookName) {
    chapterSelect.innerHTML = "";
    const chapters = Object.keys(bibleData[bookName]);
    chapters.forEach(function (num) {
      const opt = document.createElement("option");
      opt.value = num;
      opt.textContent = "Chapter " + num;
      chapterSelect.appendChild(opt);
    });
  }

  function renderChapter() {
    const book = bookSelect.value;
    const chapter = chapterSelect.value;
    const verses = bibleData[book][chapter];

    chapterTitleEl.textContent = book + " " + chapter;
    versesEl.innerHTML = "";

    verses.forEach(function (text, i) {
      const verseNum = i + 1;
      const p = document.createElement("p");
      p.className = "bible-verse";
      p.innerHTML = "<span class='verse-num'>" + verseNum + "</span> " + text;
      versesEl.appendChild(p);
    });

    savePosition(book, chapter);
    window.scrollTo({ top: readerEl.offsetTop - 100, behavior: "smooth" });
  }

  function goToChapter(offset) {
    const book = bookSelect.value;
    const chapters = Object.keys(bibleData[book]);
    const currentIndex = chapters.indexOf(chapterSelect.value);
    const newIndex = currentIndex + offset;

    if (newIndex >= 0 && newIndex < chapters.length) {
      chapterSelect.value = chapters[newIndex];
      renderChapter();
      return;
    }

    // Move to next/previous book
    const bookIndex = bookNames.indexOf(book);
    const newBookIndex = bookIndex + offset;
    if (newBookIndex < 0 || newBookIndex >= bookNames.length) return;

    const newBook = bookNames[newBookIndex];
    bookSelect.value = newBook;
    populateChapters(newBook);
    const newChapters = Object.keys(bibleData[newBook]);
    chapterSelect.value = offset > 0 ? newChapters[0] : newChapters[newChapters.length - 1];
    renderChapter();
  }

  function getSavedPosition() {
    try {
      return JSON.parse(localStorage.getItem("sma_bible_position"));
    } catch (e) {
      return null;
    }
  }

  function savePosition(book, chapter) {
    try {
      localStorage.setItem("sma_bible_position", JSON.stringify({ book: book, chapter: chapter }));
    } catch (e) {}
  }

  bookSelect.addEventListener("change", function () {
    populateChapters(bookSelect.value);
    renderChapter();
  });

  chapterSelect.addEventListener("change", renderChapter);
  prevBtn.addEventListener("click", function () { goToChapter(-1); });
  nextBtn.addEventListener("click", function () { goToChapter(1); });

}
