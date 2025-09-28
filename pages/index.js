// ===== Элементы =====
const playBtn = document.querySelector('.player__buttonPlayPause');
const selector_BG_Music = document.querySelector('.player__dropdown');
const volumeSlider = document.querySelector('.player__volume');
const timerInput = document.querySelector('.player__timer');
const iconEQ = document.querySelector('.player__icon-eq');
const backgroundImagePage = document.querySelector('.page');

// ===== Списки звуков и фоновых изображений =====
const sounds = {
  "rain_in_the_forest": "sounds/rain_in_the_forest.mp3",
  "the_sound_of_rain": "sounds/the_sound_of_rain.mp3",
  "glucophone": "sounds/Glucophone_(sleep_melody)_01.mp3",
  "the_fire_in_the_oven": "sounds/the_fire_in_the_oven.mp3",
  "fire_in_the_street": "sounds/fire_in_the_street.mp3",
  "the_noise_of_the_forest": "sounds/the_noise_of_the_forest.mp3",
  "wave_noise": "sounds/wave_noise.mp3",
  "the_sound_of_the_sea": "sounds/the_sound_of_the_sea.mp3",
  "the_sound_of_the_spring": "sounds/the_sound_of_the_spring.mp3",
  "crickets": "sounds/crickets.mp3",
  "cicadas": "sounds/cicadas.mp3",
  "in_the_cafe": "sounds/in_the_cafe.mp3",
};

const backgroundsImagesMap = {
  "rain_in_the_forest": "images/img_bg/rain_in_the_forest.webp",
  "the_sound_of_rain": "images/img_bg/noise_of_rain.webp",
  "glucophone": "images/img_bg/glucophone.webp",
  "the_fire_in_the_oven": "images/img_bg/the_fire_in_the_oven.webp",
  "fire_in_the_street": "images/img_bg/fire_on_the_street.webp",
  "the_noise_of_the_forest": "images/img_bg/noise_forests.webp",
  "wave_noise": "images/img_bg/noise_waves.webp",
  "the_sound_of_the_sea": "images/img_bg/noise_of_the_sea.webp",
  "the_sound_of_the_spring": "images/img_bg/sound_of_the_spring.webp",
  "crickets": "images/img_bg/crickets_and_birds.webp",
  "cicadas": "images/img_bg/tsykady.webp",
  "in_the_cafe": "images/img_bg/in_cafe.webp",
};

// ===== Audio =====
let audioCtx = null;
let gainNode = null;
let currentBuffer = null;
let sourceNode = null;
let isPlaying = false;
let timerId = null;
let isPreloaded = false; // уже ли все звуки в памяти

// ===== Карта буферов =====
const audioBuffers = {}; // { key: AudioBuffer }

// ===== Инициализация AudioContext =====
function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
}

// ===== Загрузка трека в буфер =====
async function loadSound(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

// ===== Предзагрузка всех звуков =====
async function preloadAllSounds() {
  if (isPreloaded) return;
  const entries = Object.entries(sounds);
  for (const [key, url] of entries) {
    try {
      audioBuffers[key] = await loadSound(url);
      console.log(`Звук ${key} предзагружен`);
    } catch (e) {
      console.error(`Ошибка загрузки ${key}:`, e);
    }
  }
  isPreloaded = true;
}

// ===== Старт звука =====
function startSound() {
  if (!currentBuffer || !audioCtx) return;

  stopSound(true);

  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = currentBuffer;
  sourceNode.loop = true;
  sourceNode.connect(gainNode);
  sourceNode.start(0);

  playBtn.style.backgroundImage = "url('images/pause.svg')";
  iconEQ.setAttribute('src', 'images/icon-equalizer-animated.svg');
  isPlaying = true;

  // fade-in
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volumeSlider.value / 100, audioCtx.currentTime + 1.5);

  // таймер авто-остановки
  const timerMinutes = parseInt(timerInput.value, 10);
  if (timerMinutes > 0) {
    clearTimeout(timerId);
    timerId = setTimeout(() => stopSound(), timerMinutes * 60 * 1000);
  }
}

// ===== Остановка =====
function stopSound(immediate = false) {
  if (!sourceNode) return;
  clearTimeout(timerId);

  if (immediate) {
    sourceNode.stop();
    sourceNode.disconnect();
    sourceNode = null;
    playBtn.style.backgroundImage = "url('images/play.svg')";
    iconEQ.setAttribute('src', 'images/icon-equalizer.svg');
    isPlaying = false;
    return;
  }

  gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

  setTimeout(() => {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
      sourceNode = null;
    }
    playBtn.style.backgroundImage = "url('images/play.svg')";
    iconEQ.setAttribute('src', 'images/icon-equalizer.svg');
    isPlaying = false;
  }, 1500);
}

// ===== Смена трека =====
selector_BG_Music.addEventListener('change', async () => {
  initAudioContext();
  const selected = selector_BG_Music.value;

  // берем из предзагруженных буферов
  currentBuffer = audioBuffers[selected] || null;
  applyBackgroundImage(backgroundsImagesMap[selected]);

  if (isPlaying) startSound();
});

// ===== Кнопка Play/Pause =====
playBtn.addEventListener('click', async () => {
  initAudioContext();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // при первом нажатии предзагружаем все звуки
  if (!isPreloaded) {
    await preloadAllSounds();
    // выбрать текущий трек
    const selected = selector_BG_Music.value;
    currentBuffer = audioBuffers[selected] || null;
  }

  if (!isPlaying) {
    startSound();
  } else {
    stopSound();
  }
});

// ===== Громкость =====
volumeSlider.addEventListener('input', () => {
  if (gainNode) {
    gainNode.gain.setValueAtTime(volumeSlider.value / 100, audioCtx.currentTime);
  }
});

// ===== Смена фона =====
async function applyBackgroundImage(imageUrl) {
  try {
    await preloadImage(imageUrl);
    backgroundImagePage.style.opacity = '0';
    await wait(200);
    backgroundImagePage.style.backgroundImage = `url('${imageUrl}')`;
    backgroundImagePage.style.opacity = '1';
  } catch (err) {
    console.error('Ошибка загрузки фона:', err);
    backgroundImagePage.style.opacity = '1';
  }
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Не удалось загрузить: ${url}`));
    img.src = url;
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


