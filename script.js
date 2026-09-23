/*========================================================
  CARROSSEL DE FOTOS (leitura automática da pasta + touch/mouse)
========================================================*/

const FOTOS_DIR = "assets/fotos";

// Lista de reserva, usada para o carrossel aparecer na hora (sem
// esperar a rede) e como plano B caso a busca automática abaixo falhe.
// Quem garante que TODAS as fotos da pasta apareçam, mesmo as que forem
// adicionadas depois, é a busca via API do GitHub logo abaixo.
const FALLBACK_PHOTOS = [
  "1.jpeg", "1.jpg", "2.jpeg", "2.jpg", "3.jpeg", "4.jpeg", "5.jpeg",
  "6.jpeg", "7.jpeg", "8.jpeg", "9.jpeg", "10.jpeg", "11.jpeg", "12.jpeg",
  "13.jpeg", "14.jpeg", "15.jpeg", "16.jpeg", "17.jpeg", "18.jpeg",
  "19.jpeg", "20.jpeg", "21.jpeg",
].map((name) => `${FOTOS_DIR}/${name}`);

// Descobre owner/repo do GitHub a partir da própria URL da página, para
// não precisar deixar isso "chumbado" no código.
// Página de projeto: usuario.github.io/repositorio/  -> repo = repositorio
// Página de usuário: usuario.github.io/               -> repo = usuario.github.io
function detectGithubRepo() {
  const host = window.location.hostname;
  if (!host.endsWith(".github.io")) return null;

  const owner = host.split(".")[0];
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  const repo = firstSegment || `${owner}.github.io`;

  return { owner, repo };
}

// Ordena "1, 2, 3, ..., 10, 11" em vez da ordem alfabética "1, 10, 11, 2..."
function naturalPhotoSort(a, b) {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

// Busca a lista real de arquivos em assets/fotos direto no repositório
// no GitHub. Assim, toda foto que for adicionada/removida ali passa a
// aparecer sozinha no site, sem precisar mexer no código de novo.
async function fetchAllPhotos() {
  const repoInfo = detectGithubRepo();
  if (!repoInfo) return null;

  const { owner, repo } = repoInfo;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${FOTOS_DIR}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`GitHub API respondeu ${response.status}`);

  const files = await response.json();
  if (!Array.isArray(files)) return null;

  const imagens = files
    .filter((f) => f.type === "file" && /\.(jpe?g|png|webp)$/i.test(f.name))
    .map((f) => f.name)
    .sort(naturalPhotoSort)
    .map((name) => `${FOTOS_DIR}/${name}`);

  return imagens.length ? imagens : null;
}

/*ELEMENTOS*/
const carousel = document.getElementById("carousel");
const carouselContainer = document.querySelector(".album-cover");
const dotsContainer = document.getElementById("carouselDots");

let totalSlides = 0;
let index = 0;
let intervalId = null;
let startX = 0;
let startY = 0;
let currentX = 0;
let isDragging = false;
let isScrolling = false;
let carouselWidth = carouselContainer.offsetWidth;

/*MONTA AS FOTOS NO DOM*/
function renderSlides(photoList) {
  carousel.innerHTML = "";
  photoList.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `Foto ${i + 1} de Thiago e Rana`;
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";
    carousel.appendChild(img);
  });
  totalSlides = photoList.length;
  index = totalSlides ? Math.min(index, totalSlides - 1) : 0;
}

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
  updateDots();
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
  if (totalSlides < 2) return;
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
  if (totalSlides < 2) return;
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
}, { passive: true });

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
}, { passive: false }); // passive:false explícito, senão o preventDefault acima é ignorado em alguns navegadores

carouselContainer.addEventListener("touchend", () => {
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

window.addEventListener("mouseup", () => {
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
// Mostra a lista de reserva na hora (sem esperar rede) e, assim que a
// API do GitHub responder com a lista real da pasta, atualiza o
// carrossel para refletir exatamente o que está no repositório.
function initCarousel(photoList) {
  renderSlides(photoList);
  createDots();
  setTimeout(() => {
    carouselWidth = carouselContainer.offsetWidth;
    updateCarousel();
  }, 100);
  startAutoSlide();
}

initCarousel(FALLBACK_PHOTOS);

fetchAllPhotos()
  .then((imagens) => {
    if (imagens && imagens.length) {
      initCarousel(imagens);
    }
  })
  .catch(() => {
    // Sem internet, API fora do ar ou site rodando fora do GitHub Pages:
    // mantém a lista de reserva que já está na tela.
  });


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


/*========================================================
  CONTADOR DE TEMPO JUNTOS (mais preciso)
========================================================*/

const startDate = new Date(2020, 8, 23, 0, 40, 0);

const counterEls = {
  years: document.getElementById("years"),
  months: document.getElementById("months"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

function updateCounter() {
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();
  let hours = now.getHours() - startDate.getHours();
  let minutes = now.getMinutes() - startDate.getMinutes();
  let seconds = now.getSeconds() - startDate.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }

  if (minutes < 0) {
    minutes += 60;
    hours--;
  }

  if (hours < 0) {
    hours += 24;
    days--;
  }

  if (days < 0) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  counterEls.years.textContent = years;
  counterEls.months.textContent = months;
  counterEls.days.textContent = days;
  counterEls.hours.textContent = hours;
  counterEls.minutes.textContent = minutes;
  counterEls.seconds.textContent = seconds;
}

// Em vez de setInterval(updateCounter, 1000) — que vai acumulando atraso
// aos poucos, porque cada disparo já sai um pouco depois do anterior —
// este loop recalcula sempre a partir do relógio real (Date.now()) e
// agenda o próximo tick exatamente na virada do segundo seguinte, então
// não desalinha com o tempo de verdade.
let counterTimeoutId = null;
function scheduleNextCounterTick() {
  updateCounter();
  const delayUntilNextSecond = 1000 - (Date.now() % 1000);
  counterTimeoutId = setTimeout(scheduleNextCounterTick, delayUntilNextSecond);
}
scheduleNextCounterTick();

// Em celulares e abas em segundo plano, o navegador quase para os timers
// (economia de bateria) e o contador fica "congelado". Ao voltar para a
// aba, atualiza na hora em vez de esperar o próximo tick.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    clearTimeout(counterTimeoutId);
    scheduleNextCounterTick();
  }
});
