const app = document.getElementById("app");
const EMBED_BASE_URL = "https://streamimdb.ru/embed/";

let allMovies = [];
let heroIndex = 0;
let heroTimer = null;
let currentView = "home";
let currentMovieIndex = null;
let socket = null;
let tvSession = null;

initTvRemote();

fetch("https://exam-miner.com/api/movies.php")
  .then(res => res.json())
  .then(movies => {
    allMovies = movies;
    showHome();
  })
  .catch(err => {
    console.error(err);
    app.innerHTML = "<p style='padding:20px;'>Failed to load movies.</p>";
  });

document.addEventListener("keydown", handleGlobalKeys);

document.addEventListener("keydown", () => {
  document.body.classList.add("keyboard-mode");
});

document.addEventListener("mousedown", () => {
  document.body.classList.remove("keyboard-mode");
});

document.addEventListener("touchstart", () => {
  document.body.classList.remove("keyboard-mode");
});

function showHome() {
  currentView = "home";
  currentMovieIndex = null;

  const categories = getAllCategories();

  app.innerHTML = `
    <header>
      <h1>Ivan Movies</h1>
    </header>

    <section class="hero" id="heroBanner">
      <div>
        <h2 id="heroTitle"></h2>
        <p id="heroDesc"></p>
        <button class="play-btn focusable" id="heroPlay">▶ Play</button>
      </div>
    </section>

    <main id="movieSections"></main>
  `;

  const movieSections = document.getElementById("movieSections");

  startHeroSlider();

  categories.forEach(category => {
    const moviesInCategory = allMovies.filter(movie =>
      getMovieCategories(movie.category).includes(category)
    );

    if (moviesInCategory.length < 5) return;

    const section = document.createElement("section");
    section.className = "movie-row-section";

    section.innerHTML = `
      <div class="row-header">
        <h2 class="section-title">${category}</h2>

        <div class="row-buttons">
          <button class="row-btn left-btn focusable" type="button">‹</button>
          <button class="row-btn right-btn focusable" type="button">›</button>
        </div>
      </div>

      <div class="movie-row" data-row></div>
    `;

    const row = section.querySelector(".movie-row");

    section.querySelector(".left-btn").addEventListener("click", () => {
      slideRow(row, -1);
    });

    section.querySelector(".right-btn").addEventListener("click", () => {
      slideRow(row, 1);
    });

    moviesInCategory.forEach(movie => {
      const index = allMovies.indexOf(movie);
      row.appendChild(createMovieCard(movie, index));
    });

    movieSections.appendChild(section);
  });

  const allSection = document.createElement("section");
  allSection.className = "movie-row-section";

  allSection.innerHTML = `
    <div class="row-header">
      <h2 class="section-title">All Movies</h2>
    </div>

    <div id="movieGrid" class="movie-grid" data-grid></div>
  `;

  movieSections.appendChild(allSection);

  const movieGrid = document.getElementById("movieGrid");

  allMovies.forEach((movie, index) => {
    movieGrid.appendChild(createMovieCard(movie, index));
  });

  setTimeout(() => {
    document.getElementById("heroPlay")?.focus();
  }, 100);
}

function slideRow(row, direction) {
  const card = row.querySelector(".movie-card");
  if (!card) return;

  const gap = 14;
  const distance = card.offsetWidth + gap;

  row.scrollBy({
    left: distance * direction,
    behavior: "smooth"
  });
}

function getMovieCategories(categoryText) {
  if (!categoryText) return [];

  return categoryText
    .split(/·|•|,|\//)
    .map(cat => cat.trim())
    .filter(cat => cat.length > 0);
}

function getAllCategories() {
  const categorySet = new Set();

  allMovies.forEach(movie => {
    getMovieCategories(movie.category).forEach(cat => {
      categorySet.add(cat);
    });
  });

  return [...categorySet].sort();
}

function startHeroSlider() {
  if (heroTimer) {
    clearInterval(heroTimer);
  }

  updateHero();

  heroTimer = setInterval(() => {
    heroIndex++;

    if (heroIndex >= allMovies.length) {
      heroIndex = 0;
    }

    updateHero();
  }, 5000);
}

function updateHero() {
  const movie = allMovies[heroIndex];
  if (!movie || currentView !== "home") return;

  const heroBanner = document.getElementById("heroBanner");
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroPlay = document.getElementById("heroPlay");

  if (!heroBanner || !heroTitle || !heroDesc || !heroPlay) return;

  heroBanner.style.backgroundImage =
    `linear-gradient(to top, #080808 5%, rgba(0,0,0,0.25)), url('${movie.thumbnail}')`;

  heroTitle.textContent = movie.title;
  heroDesc.textContent = movie.description;

  heroPlay.onclick = () => showMoviePage(heroIndex);
}

function createMovieCard(movie, index) {
  const card = document.createElement("div");
  card.className = "movie-card focusable";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", movie.title);
  card.dataset.index = index;

  card.innerHTML = `
    <img src="${movie.thumbnail}" alt="${movie.title}">
    <div class="movie-card-info">
      <h3>${movie.title}</h3>
      <p>${movie.category || "Movie"}</p>
    </div>
  `;

  card.addEventListener("click", () => {
    showMoviePage(index);
  });

  card.addEventListener("focus", () => {
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  });

  return card;
}

function showMoviePage(index) {
  currentView = "details";
  currentMovieIndex = index;

  if (heroTimer) {
    clearInterval(heroTimer);
  }

  const movie = allMovies[index];

  app.innerHTML = `
    <div class="movie-page">
      <button class="back-btn focusable" id="backBtn">← Back</button>

      <section class="movie-hero" style="background-image: linear-gradient(to top, #080808 5%, rgba(0,0,0,0.35)), url('${movie.thumbnail}')">
        <div class="movie-info">
          <h1>${movie.title}</h1>
          <p>${movie.description}</p>
          <button class="play-btn focusable" id="playBtn">▶ Play</button>
        </div>
      </section>

      <section class="suggestions">
        <h2>More Like This</h2>
        <div class="movie-grid" id="suggestionGrid" data-grid></div>
      </section>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", showHome);

  document.getElementById("playBtn").addEventListener("click", () => {
    playMovie(movie.video_code);
  });

  const suggestionGrid = document.getElementById("suggestionGrid");

  allMovies.forEach((m, i) => {
    if (i === index) return;
    suggestionGrid.appendChild(createMovieCard(m, i));
  });

  setTimeout(() => {
    document.getElementById("playBtn")?.focus();
  }, 100);
}

function playMovie(videoCode) {
  currentView = "player";

  app.innerHTML = `
    <div class="watch-screen">

      <div class="player-controls">
        <button class="fullscreen-btn focusable" id="fullscreenBtn">⛶</button>
        <button class="close-watch focusable" id="closeWatch">×</button>
      </div>

      <iframe 
        src="${EMBED_BASE_URL + videoCode}" 
        allowfullscreen
        allow="autoplay; fullscreen">
      </iframe>

    </div>
  `;

  document.getElementById("closeWatch").addEventListener("click", closePlayer);

  document.getElementById("fullscreenBtn").addEventListener("click", () => {
    const player = document.querySelector(".watch-screen");

    if (!document.fullscreenElement) {
      player.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  document.querySelector(".watch-screen").requestFullscreen?.();

  screen.orientation?.lock?.("landscape").catch(() => {});

  setTimeout(() => {
    document.getElementById("closeWatch")?.focus();
  }, 100);
}

async function closePlayer() {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  }

  screen.orientation?.unlock?.();

  if (currentMovieIndex !== null) {
    showMoviePage(currentMovieIndex);
  } else {
    showHome();
  }
}

function handleGlobalKeys(e) {
  const key = e.key;

  if (key === "Escape" || key === "Backspace" || key === "BrowserBack") {
    e.preventDefault();

    if (currentView === "player") {
      closePlayer();
      return;
    }

    if (currentView === "details") {
      showHome();
      return;
    }

    return;
  }

  if (key === "Enter") {
    const active = document.activeElement;

    if (
      active &&
      active.classList.contains("focusable")
    ) {
      e.preventDefault();
      active.click();
    }

    return;
  }

  if (
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown"
  ) {
    moveFocus(key);
  }
}

function getFocusableItems() {
  return Array.from(
    document.querySelectorAll(
      ".focusable, button, a, input, textarea, select, .movie-card"
    )
  ).filter(el => {
    return (
      !el.disabled &&
      el.offsetParent !== null &&
      getComputedStyle(el).visibility !== "hidden"
    );
  });
}

function moveFocus(key) {
  const items = getFocusableItems();

  if (items.length === 0) return;

  let active = document.activeElement;

  if (!items.includes(active)) {
    items[0].focus();
    return;
  }

  const activeRect = active.getBoundingClientRect();

  let candidates = items.filter(el => el !== active).map(el => {
    const rect = el.getBoundingClientRect();

    const dx =
      rect.left + rect.width / 2 -
      (activeRect.left + activeRect.width / 2);

    const dy =
      rect.top + rect.height / 2 -
      (activeRect.top + activeRect.height / 2);

    return { el, rect, dx, dy };
  });

  if (key === "ArrowRight") {
    candidates = candidates.filter(c => c.dx > 10);
  }

  if (key === "ArrowLeft") {
    candidates = candidates.filter(c => c.dx < -10);
  }

  if (key === "ArrowDown") {
    candidates = candidates.filter(c => c.dy > 10);
  }

  if (key === "ArrowUp") {
    candidates = candidates.filter(c => c.dy < -10);
  }

  if (candidates.length === 0) return;

  candidates.sort((a, b) => {
    if (key === "ArrowLeft" || key === "ArrowRight") {
      return Math.abs(a.dx) + Math.abs(a.dy) * 2 -
             (Math.abs(b.dx) + Math.abs(b.dy) * 2);
    }

    return Math.abs(a.dy) + Math.abs(a.dx) * 2 -
           (Math.abs(b.dy) + Math.abs(b.dx) * 2);
  });

  candidates[0].el.focus();
}





// Remote control functions:

function initTvRemote() {
  if (typeof io === "undefined") {
    console.warn("Socket.IO not loaded.");
    return;
  }

  tvSession = localStorage.getItem("ivan_movies_tv_session");

  if (!tvSession) {
    tvSession = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("ivan_movies_tv_session", tvSession);
  }

  socket = io("https://movie-server-h2wb.onrender.com", {
  transports: ["websocket", "polling"]
});

  socket.on("connect", () => {
    socket.emit("join-tv", tvSession);
    showRemoteQR();
  });

  socket.on("remote-connected", () => {
    hideRemoteQR();
  });

  socket.on("remote-command", command => {
    handleRemoteCommand(command);
  });
}

function showRemoteQR() {
  const oldBox = document.getElementById("remoteQrBox");
  if (oldBox) oldBox.remove();

  const remoteUrl =
    `https://exam-miner.com/remote.html?session=${tvSession}`;

  const box = document.createElement("div");
  box.id = "remoteQrBox";
  box.innerHTML = `
    <div class="qr-card">
      <h3>Control with Phone</h3>
      <canvas id="remoteQrCanvas"></canvas>
      <p>Scan this QR to use your phone as remote.</p>
      <small>Session: ${tvSession}</small>
      <button id="hideQrBtn" class="focusable">Hide</button>
    </div>
  `;

  document.body.appendChild(box);

  QRCode.toCanvas(
    document.getElementById("remoteQrCanvas"),
    remoteUrl,
    {
      width: 180,
      margin: 1
    }
  );

  document.getElementById("hideQrBtn").onclick = hideRemoteQR;
}

function hideRemoteQR() {
  document.getElementById("remoteQrBox")?.remove();
}

function handleRemoteCommand(command) {
  document.body.classList.add("keyboard-mode");

  switch (command) {
    case "UP":
      moveFocus("ArrowUp");
      break;

    case "DOWN":
      moveFocus("ArrowDown");
      break;

    case "LEFT":
      moveFocus("ArrowLeft");
      break;

    case "RIGHT":
      moveFocus("ArrowRight");
      break;

    case "OK":
      document.activeElement?.click();
      break;

    case "BACK":
      if (currentView === "player") {
        closePlayer();
      } else if (currentView === "details") {
        showHome();
      }
      break;

    case "HOME":
      showHome();
      break;

    case "FULLSCREEN":
      document.getElementById("fullscreenBtn")?.click();
      break;

    case "PLAY":
      document.getElementById("heroPlay")?.click();
      document.getElementById("playBtn")?.click();
      break;
  }
}
