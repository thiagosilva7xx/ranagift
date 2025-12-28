/*CARROSSEL DE FOTOS (FIX MOBILE)*/

const carousel = document.getElementById("carousel");
const slides = carousel.children;
const totalSlides = slides.length;
const dotsContainer = document.getElementById("carouselDots");

let index = 0;
let intervalId = null;

// TOUCH
let startX = 0;
let currentTranslate = 0;
let isDragging = false;
let carouselWidth = carousel.offsetWidth;

/*DOTS*/

function createDots() {
  dotsContainer.innerHTML = "";
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("div");
    dot.className = "carousel-dot";
    dot.addEventListener("click", () => {
      index = i;
      updateCarousel();
      restartAutoSlide();
    });
    dotsContainer.appendChild(dot);
  }
}

function updateDots() {
  [...dotsContainer.children].forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

/*CAROUSEL*/

function updateCarousel() {
  carousel.style.transition = "transform 0.4s ease";
  carousel.style.transform = `translateX(-${index * carouselWidth}px)`;
  updateDots();
}

/*AUTO SLIDE*/

function startAutoSlide() {
  intervalId = setInterval(() => {
    index = (index + 1) % totalSlides;
    updateCarousel();
  }, 5000);
}

function restartAutoSlide() {
  clearInterval(intervalId);
  startAutoSlide();
}

/*TOUCH EVENTS*/

carousel.addEventListener("touchstart", (e) => {
  clearInterval(intervalId);
  isDragging = true;
  startX = e.touches[0].clientX;
  carouselWidth = carousel.offsetWidth;
  carousel.style.transition = "none";
});

carousel.addEventListener("touchmove", (e) => {
  if (!isDragging) return;

  const currentX = e.touches[0].clientX;
  const diff = currentX - startX;

  currentTranslate = -index * carouselWidth + diff;
  carousel.style.transform = `translateX(${currentTranslate}px)`;
});

carousel.addEventListener("touchend", (e) => {
  isDragging = false;
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (diff < -carouselWidth * 0.2 && index < totalSlides - 1) {
    index++;
  } else if (diff > carouselWidth * 0.2 && index > 0) {
    index--;
  }

  updateCarousel();
  restartAutoSlide();
});

/*INIT*/

createDots();
updateCarousel();
startAutoSlide();

/*PLAYER DE ÁUDIO SVG*/

const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");

const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressThumb = document.getElementById("progressThumb");

const currentTimeEl = document.getElementById("currentTime");
const remainingTimeEl = document.getElementById("remainingTime");

audio.volume = 0.25;
let isPlaying = false;

// PLAY / PAUSE
function updatePlayIcon() {
  playIcon.innerHTML = isPlaying
    ? `<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/>`
    : `<path d="M8 5v14l11-7z" fill="currentColor"/>`;
}

playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play();
    isPlaying = true;
    playBtn.classList.add("playing");
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.classList.remove("playing");
  }
  updatePlayIcon();
});

// TEMPO
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;

  currentTimeEl.textContent = formatTime(audio.currentTime);
  remainingTimeEl.textContent =
    `-${formatTime(audio.duration - audio.currentTime)}`;
});

// CLIQUE NA BARRA
progressBar.addEventListener("click", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

// FIM DA MÚSICA
audio.addEventListener("ended", () => {
  isPlaying = false;
  playBtn.classList.remove("playing");
  updatePlayIcon();
  audio.currentTime = 0;
});

/*SHUFFLE & REPEAT (UI)*/

const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

let isShuffle = false;
let isRepeat = false;

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
});

repeatBtn.addEventListener("click", () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle("active", isRepeat);
  audio.loop = isRepeat;
});

/*REVELAR SONETO*/

const revealBtn = document.getElementById("revealBtn");
const sonetoFull = document.getElementById("sonetoFull");

if (revealBtn && sonetoFull) {
  revealBtn.addEventListener("click", () => {
    sonetoFull.style.display = "block";
    revealBtn.remove();
  });
}
