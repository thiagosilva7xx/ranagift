/*CARROSSEL DE FOTOS (TOUCH + MOUSE)*/

const carousel = document.getElementById("carousel");
const carouselContainer = document.querySelector(".album-cover");
const slides = carousel.children;
const totalSlides = slides.length;
const dotsContainer = document.getElementById("carouselDots");
let index = 0;
let intervalId = null;
let startX = 0;
let startY = 0;
let currentX = 0;
let isDragging = false;
let isScrolling = false;
let carouselWidth = carouselContainer.offsetWidth;

/*dots*/
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
  carouselWidth = carouselContainer.offsetWidth;
  carousel.style.transform = `translateX(-${index * carouselWidth}px)`;
  updateDots();
}

/*AUTO SLIDE*/
function startAutoSlide() {
  stopAutoSlide();
  intervalId = setInterval(() => {
    index = (index + 1) % totalSlides;
    updateCarousel();
  }, 5000);
}

function stopAutoSlide() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function restartAutoSlide() {
  stopAutoSlide();
  startAutoSlide();
}

/*TOUCH + MOUSE EVENTS*/

function startDrag(x, y = 0) {
  stopAutoSlide();
  isDragging = true;
  isScrolling = false; // Reset
  startX = x;
  startY = y;
  currentX = x;
  carousel.style.transition = "none";
}

function moveDrag(x) {
  if (!isDragging) return;
  
  currentX = x;
  const diff = currentX - startX;
  const offset = -index * carouselWidth + diff;
  
  // Limites
  const minOffset = -(totalSlides - 1) * carouselWidth;
  const maxOffset = 0;
  
  let boundedOffset = offset;
  if (offset > maxOffset) boundedOffset = maxOffset + (diff * 0.3); 
  if (offset < minOffset) boundedOffset = minOffset + (diff * 0.3); 
  
  carousel.style.transform = `translateX(${boundedOffset}px)`;
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  
  const diff = currentX - startX;
  const threshold = carouselWidth * 0.15;
  
  if (diff < -threshold && index < totalSlides - 1) {
    index++;
  } else if (diff > threshold && index > 0) {
    index--;
  }
  
  updateCarousel();
  startAutoSlide();
}

// TOUCH
carouselContainer.addEventListener("touchstart", (e) => {
  startDrag(e.touches[0].clientX, e.touches[0].clientY);
});

carouselContainer.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  if (!isScrolling) {
    const diffX = Math.abs(x - startX);
    const diffY = Math.abs(y - startY);
    if (diffY > diffX && diffY > 5) {
      isScrolling = true;
      isDragging = false; 
      updateCarousel(); 
      return;
    }
  }
  if (isDragging && !isScrolling) {
    e.preventDefault(); 
    moveDrag(x);
  }
});

carouselContainer.addEventListener("touchend", (e) => {
  endDrag();
});

// MOUSE
carouselContainer.addEventListener("mousedown", (e) => {
  e.preventDefault(); 
  startDrag(e.clientX);
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  moveDrag(e.clientX);
});

window.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  endDrag();
});

carouselContainer.addEventListener("dragstart", (e) => {
  e.preventDefault();
});

window.addEventListener("resize", () => {
  carouselWidth = carouselContainer.offsetWidth;
  updateCarousel();
});

/*INIT CAROUSEL*/
createDots();
setTimeout(() => {
    carouselWidth = carouselContainer.offsetWidth;
    updateCarousel();
}, 100);
startAutoSlide();


/*PLAYER DE ÁUDIO*/

const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");

const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressThumb = document.getElementById("progressThumb");

const currentTimeEl = document.getElementById("currentTime");
const remainingTimeEl = document.getElementById("remainingTime");

if(audio) {
    audio.volume = 0.4; 
    let isPlaying = false;

    /* PLAY / PAUSE */
    function updatePlayIcon() {
      playIcon.innerHTML = isPlaying
        ? `<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/>`
        : `<path d="M8 5v14l11-7z" fill="currentColor"/>`;
    }

    playBtn.addEventListener("click", () => {
      if (isPlaying) {
        audio.pause();
        playBtn.classList.remove("playing");
      } else {
        audio.play().catch(e => console.log("Interação necessária para tocar áudio"));
        playBtn.classList.add("playing");
      }
      isPlaying = !isPlaying;
      updatePlayIcon();
    });

    /* TEMPO */
    function formatTime(seconds) {
      if(isNaN(seconds)) return "0:00";
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
      remainingTimeEl.textContent = `-${formatTime(audio.duration - audio.currentTime)}`;
    });

    /* CLIQUE NA BARRA */
    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });

    /* FIM DA MÚSICA */
    audio.addEventListener("ended", () => {
      if (!isRepeat) {
          isPlaying = false;
          playBtn.classList.remove("playing");
          updatePlayIcon();
          audio.currentTime = 0;
      }
    });
}

/*SHUFFLE & REPEAT*/
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

let isShuffle = false;
let isRepeat = false;

if(shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle("active", isShuffle);
    });
}

if(repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      isRepeat = !isRepeat;
      repeatBtn.classList.toggle("active", isRepeat);
      if(audio) audio.loop = isRepeat;
    });
}

/*REVELAR MENSAGEM*/
const revealBtn = document.getElementById("revealBtn");
const sonetoFull = document.getElementById("sonetoFull");

if (revealBtn && sonetoFull) {
  revealBtn.addEventListener("click", () => {
    sonetoFull.style.display = "block";
    revealBtn.remove();
  });
}