// ===== Элементы =====
const playBtn = document.querySelector('.player__buttonPlayPause');
const selector_BG_Music = document.querySelector('.player__dropdown');
const volumeSlider = document.querySelector('.player__volume');
const timerInput = document.querySelector('.player__timer');
const iconEQ = document.querySelector('.player__icon-eq');
const backgroundImagePage = document.querySelector('.page');

// ===== Списки звуков и фоновых изображений =====
const sounds = {
  rain_in_the_forest: "sounds/rain_in_the_forest.mp3",
  the_sound_of_rain: "sounds/the_sound_of_rain.mp3",
  glucophone: "sounds/Glucophone_(sleep_melody)_01.mp3",
  the_fire_in_the_oven: "sounds/the_fire_in_the_oven.mp3",
  fire_in_the_street: "sounds/fire_in_the_street.mp3",
  the_noise_of_the_forest: "sounds/the_noise_of_the_forest.mp3",
  wave_noise: "sounds/wave_noise.mp3",
  the_sound_of_the_sea: "sounds/the_sound_of_the_sea.mp3",
  the_sound_of_the_spring: "sounds/the_sound_of_the_spring.mp3",
  crickets: "sounds/crickets.mp3",
  cicadas: "sounds/cicadas.mp3",
  in_the_cafe: "sounds/in_the_cafe.mp3",
};

const backgroundsImagesMap = {
  rain_in_the_forest: "images/img_bg/rain_in_the_forest.webp",
  the_sound_of_rain: "images/img_bg/noise_of_rain.webp",
  glucophone: "images/img_bg/glucophone.webp",
  the_fire_in_the_oven: "images/img_bg/the_fire_in_the_oven.webp",
  fire_in_the_street: "images/img_bg/fire_on_the_street.webp",
  the_noise_of_the_forest: "images/img_bg/noise_forests.webp",
  wave_noise: "images/img_bg/noise_waves.webp",
  the_sound_of_the_sea: "images/img_bg/noise_of_the_sea.webp",
  the_sound_of_the_spring: "images/img_bg/sound_of_the_spring.webp",
  crickets: "images/img_bg/crickets_and_birds.webp",
  cicadas: "images/img_bg/tsykady.webp",
  in_the_cafe: "images/img_bg/in_cafe.webp",
};

let audio = null;
let isPlaying = false;
let timerId = null;
let fadeInterval = null;


// ===== Создание нового Audio =====
function setTrack(name) {
  if (audio) {
    audio.pause();
    audio = null;
  }

  audio = new Audio(sounds[name]);
  audio.loop = true;
  audio.volume = 0; // начинаем с нуля для fade-in
  applyBackgroundImage(backgroundsImagesMap[name]);
}

// ===== Fade-in =====
function fadeIn(targetVolume, duration = 1500) {
  clearInterval(fadeInterval);
  const step = 50; // каждые 50мс
  const increment = targetVolume / (duration / step);

  fadeInterval = setInterval(() => {
    if (!audio) return clearInterval(fadeInterval);
    if (audio.volume + increment >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(fadeInterval);
    } else {
      audio.volume += increment;
    }
  }, step);
}

// ===== Fade-out =====
function fadeOut(duration = 1500, callback) {
  clearInterval(fadeInterval);
  const step = 50;
  const decrement = audio.volume / (duration / step);

  fadeInterval = setInterval(() => {
    if (!audio) return clearInterval(fadeInterval);
    if (audio.volume - decrement <= 0) {
      audio.volume = 0;
      clearInterval(fadeInterval);
      if (callback) callback();
    } else {
      audio.volume -= decrement;
    }
  }, step);
}

// ===== Play/Pause =====
playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    if (!audio) setTrack(selector_BG_Music.value);

    audio.play().then(() => {
      isPlaying = true;
      playBtn.textContent = "⏸";
      iconEQ.src = "images/icon-equalizer-animated.svg";

      fadeIn(volumeSlider.value / 100, 2000);

      const timerMinutes = parseInt(timerInput.value, 10);
      if (timerMinutes > 0) {
        clearTimeout(timerId);
        timerId = setTimeout(() => stopSound(), timerMinutes * 60 * 1000);
      }
    }).catch(err => console.error("Ошибка воспроизведения:", err));
  } else {
    stopSound();
  }
});

// ===== Остановка =====
function stopSound() {
  if (!audio) return;
  fadeOut(2000, () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playBtn.textContent = "▶";
    iconEQ.src = "images/icon-equalizer.svg";
    clearTimeout(timerId);
  });
}

// ===== Громкость =====
volumeSlider.addEventListener("input", () => {
  if (audio) audio.volume = volumeSlider.value / 100;
});

// ===== Смена трека =====
selector_BG_Music.addEventListener("change", () => {
  const wasPlaying = isPlaying;
  setTrack(selector_BG_Music.value);
  if (wasPlaying) {
    audio.play();
    fadeIn(volumeSlider.value / 100, 2000);
  }
});

// ===== Фон =====
async function applyBackgroundImage(imageUrl) {
  try {
    await preloadImage(imageUrl);
    backgroundImagePage.style.opacity = '0';
    await wait(200);
    backgroundImagePage.style.backgroundImage = `url('${imageUrl}')`;
    backgroundImagePage.style.opacity = '1';
  } catch (err) {
    console.error('Ошибка загрузки фона:', err);
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

// ===== Установить первый трек при загрузке =====
setTrack(selector_BG_Music.value);



