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

  // ===========================================
  // Search — supports two modes, same as drbo.org:
  //   1. Reference lookup: "John 3:16", "Genesis 1:1"
  //   2. Keyword search: "charity", "shepherd"
  // ===========================================

  const searchInput = document.getElementById("bibleSearch");
  const searchClearBtn = document.getElementById("bibleSearchClear");
  const searchResultsEl = document.getElementById("bibleSearchResults");

  function findBookName(typed) {
    const lower = typed.toLowerCase().trim();
    return bookNames.find(function (name) {
      return name.toLowerCase() === lower;
    }) || bookNames.find(function (name) {
      return name.toLowerCase().startsWith(lower);
    });
  }

  // Matches "John 3:16", "Genesis 1:1", "1 John 4:8", "Song of Songs 2:1" etc.
  const REFERENCE_PATTERN = /^(.+?)\s+(\d+)\s*:\s*(\d+)$/;

  function tryReferenceLookup(query) {
    const match = query.match(REFERENCE_PATTERN);
    if (!match) return null;

    const bookTyped = match[1];
    const chapterNum = match[2];
    const verseNum = parseInt(match[3], 10);

    const book = findBookName(bookTyped);
    if (!book || !bibleData[book] || !bibleData[book][chapterNum]) return null;

    const verses = bibleData[book][chapterNum];
    if (verseNum < 1 || verseNum > verses.length) return null;

    return { book: book, chapter: chapterNum, verseNum: verseNum, text: verses[verseNum - 1] };
  }

  function keywordSearch(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const book of bookNames) {
      const chapters = bibleData[book];
      for (const chapterNum in chapters) {
        const verses = chapters[chapterNum];
        verses.forEach(function (text, i) {
          if (text.toLowerCase().includes(lowerQuery)) {
            results.push({ book: book, chapter: chapterNum, verseNum: i + 1, text: text });
          }
        });
        if (results.length >= 200) return results; // safety cap for very common words
      }
    }
    return results;
  }

  function renderSearchResults(query) {
    if (!query) {
      searchResultsEl.innerHTML = "";
      searchResultsEl.classList.remove("show");
      searchClearBtn.style.display = "none";
      readerEl.style.display = "block";
      return;
    }

    searchClearBtn.style.display = "block";

    const refResult = tryReferenceLookup(query);

    if (refResult) {
      readerEl.style.display = "none";
      searchResultsEl.classList.add("show");
      searchResultsEl.innerHTML = "";

      const card = document.createElement("div");
      card.className = "bible-search-item bible-search-item-single";
      card.innerHTML =
        "<h4>" + refResult.book + " " + refResult.chapter + ":" + refResult.verseNum + "</h4>" +
        "<p><span class='verse-num'>" + refResult.verseNum + "</span> " + refResult.text + "</p>";
      card.addEventListener("click", function () {
        jumpTo(refResult.book, refResult.chapter);
      });
      searchResultsEl.appendChild(card);
      return;
    }

    const matches = keywordSearch(query);
    readerEl.style.display = "none";
    searchResultsEl.classList.add("show");
    searchResultsEl.innerHTML = "";

    if (matches.length === 0) {
      searchResultsEl.innerHTML = '<p class="bible-search-empty">No verses found for "' + query + '". Try a verse reference like "John 3:16" or a different keyword.</p>';
      return;
    }

    const countEl = document.createElement("p");
    countEl.className = "bible-search-count";
    countEl.textContent = matches.length + (matches.length >= 200 ? "+" : "") + " verse" + (matches.length === 1 ? "" : "s") + " found";
    searchResultsEl.appendChild(countEl);

    matches.forEach(function (m) {
      const card = document.createElement("div");
      card.className = "bible-search-item";
      card.innerHTML =
        "<h4>" + m.book + " " + m.chapter + ":" + m.verseNum + "</h4>" +
        "<p><span class='verse-num'>" + m.verseNum + "</span> " + m.text + "</p>";
      card.addEventListener("click", function () {
        jumpTo(m.book, m.chapter);
      });
      searchResultsEl.appendChild(card);
    });
  }

  function jumpTo(book, chapter) {
    bookSelect.value = book;
    populateChapters(book);
    chapterSelect.value = chapter;
    searchInput.value = "";
    searchResultsEl.classList.remove("show");
    searchResultsEl.innerHTML = "";
    searchClearBtn.style.display = "none";
    readerEl.style.display = "block";
    renderChapter();
  }

  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener("keyup", function () {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();
      debounceTimer = setTimeout(function () {
        renderSearchResults(query);
      }, 200);
    });

    searchClearBtn.addEventListener("click", function () {
      searchInput.value = "";
      renderSearchResults("");
      searchInput.focus();
    });
  }

}
