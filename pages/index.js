// ===== Элементы =====
const donationsCardBtn = document.querySelector('.donations__icon-copy');
const backgroundImagePage = document.querySelector('.page');
const selector_BG_Music = document.querySelector('.player__dropdown');
const playBtn = document.querySelector('.player__buttonPlayPause');
const volumeSlider = document.querySelector('.player__volume');
const timerInput = document.querySelector('.player__timer');
const iconEQ = document.querySelector('.player__icon-eq');

// ===== AudioContext =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);

let currentBuffer = null;
let sourceNode = null;
let isPlaying = false;
let timerId = null;

// ===== Разблокировка AudioContext для iOS =====
function unlockAudioContext(ctx) {
  if (ctx.state === "suspended") {
    const events = ["touchstart", "touchend", "click"];
    const unlock = () => {
      ctx.resume().then(() => console.log("AudioContext разблокирован!"));
      events.forEach(e => document.removeEventListener(e, unlock));
    };
    events.forEach(e => document.addEventListener(e, unlock, false));
  }
}
unlockAudioContext(audioCtx);

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

// ===== Загрузка трека =====
async function loadSound(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

// ===== Проигрывание с fade-in =====
async function startSound() {
  if (!currentBuffer) return;

  stopSound(true);

  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = currentBuffer;
  sourceNode.loop = true;
  sourceNode.connect(gainNode);
  sourceNode.start();

  playBtn.style.backgroundImage = "url('images/pause.svg')";
  iconEQ.setAttribute('src', 'images/icon-equalizer-animated.svg');
  isPlaying = true;

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volumeSlider.value / 100, audioCtx.currentTime + 2);

  const timerMinutes = parseInt(timerInput.value, 10);
  if (timerMinutes > 0) {
    clearTimeout(timerId);
    timerId = setTimeout(() => stopSound(), timerMinutes * 60 * 1000);
  }
}

// ===== Остановка с fade-out =====
function stopSound(immediate = false) {
  if (!sourceNode) return;
  clearTimeout(timerId);

  if (immediate) {
    sourceNode.stop();
    sourceNode.disconnect();
    sourceNode = null;
    playBtn.style.backgroundImage = "url('images/play.svg')";
    isPlaying = false;
    return;
  }

  gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);

  setTimeout(() => {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
      sourceNode = null;
    }
    playBtn.style.backgroundImage = "url('images/play.svg')";
    iconEQ.setAttribute('src', 'images/icon-equalizer.svg');
    isPlaying = false;
  }, 2000);
}

// ===== Смена трека =====
selector_BG_Music.addEventListener('change', async () => {
  const selected = selector_BG_Music.value;
  currentBuffer = await loadSound(sounds[selected]);
  applyBackgroundImage(backgroundsImagesMap[selected]);
  if (isPlaying) startSound();
});

// ===== Кнопка Play/Pause =====
playBtn.addEventListener('click', async () => {
  const selected = selector_BG_Music.value;
  if (!isPlaying) {
    if (!currentBuffer) currentBuffer = await loadSound(sounds[selected]);
    startSound();
  } else {
    stopSound();
  }
});

// ===== Громкость =====
volumeSlider.addEventListener('input', () => {
  gainNode.gain.setValueAtTime(volumeSlider.value / 100, audioCtx.currentTime);
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

// ===== Копирование номера карты =====
donationsCardBtn.addEventListener("click", async function () {
  const textCard = document.querySelector(".donations__card").textContent;
  try {
    await navigator.clipboard.writeText(textCard.trim());
    donationsCardBtn.setAttribute("src", "images/copy-ok.svg");
    setTimeout(() => {
      donationsCardBtn.setAttribute("src", "images/copy.svg");
    }, 2000);
  } catch (err) {
    console.error("Ошибка копирования: ", err);
  }
});


// Реализация влючения и выключение звука
document.addEventListener("DOMContentLoaded", function () {
  const volumeButton = document.querySelector(".player__volumeOnOff"); // Кнопка включения и выключения звука
  const volumeInput = document.querySelector(".player__volume"); // Ползунок звука
  const volumeLabel = document.querySelector(".player__label_disabled"); // Метка для отображения значения звука

  // Отмена поведения по умолчанию для метки
  volumeLabel.addEventListener("click", (event) => {
    event.preventDefault();
  });

  let previousVolume = parseInt(volumeInput.value);
  let isMuted = false;

  volumeButton.addEventListener("click", function () {
    if (isMuted) {
      // Включаем звук, возвращаем предыдущее значение
      volumeInput.value = previousVolume;
      volumeButton.style.backgroundImage =
        "url('./images/icon-vol-sound.svg')";
    } else {
      previousVolume = parseInt(volumeInput.value);
      volumeInput.value = 0;
      volumeButton.style.backgroundImage =
        "url('./images/sound-off.svg')";
    }

    isMuted = !isMuted;

    // Триггер события для обновления состояния звука
    volumeInput.dispatchEvent(new Event("input"));
    volumeInput.dispatchEvent(new Event("change"));
  });

  // Обновляем иконку кнопки при изменении значения ползунка
  volumeInput.addEventListener("input", function () {
    const currentVolume = parseInt(this.value);

    if (currentVolume === 0) {
      volumeButton.style.backgroundImage =
        "url('images/sound-off.svg')";
      isMuted = true;
    } else {
      volumeButton.style.backgroundImage =
        "url('images/icon-vol-sound.svg')";
      isMuted = false;
      previousVolume = currentVolume;
    }
  });
});


