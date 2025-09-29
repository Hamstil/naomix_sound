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


// ===== Инициализация =====
function init() {
  setTrack(selector_BG_Music.value);
  setupEventListeners();
}

// ===== Настройка обработчиков событий =====
function setupEventListeners() {
  playBtn.addEventListener("click", handlePlayPause);
  volumeSlider.addEventListener("input", handleVolumeChange);
  selector_BG_Music.addEventListener("change", handleTrackChange);
}

// ===== Создание и настройка аудио =====
function createAudioElement(name) {
  const newAudio = new Audio();
  newAudio.src = sounds[name];
  newAudio.loop = false; // Отключаем стандартный loop
  newAudio.volume = 0;
  newAudio.setAttribute('playsinline', 'true');
  newAudio.setAttribute('preload', 'auto');

  // Обработчики событий аудио
  newAudio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButton(true);
  });

  newAudio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButton(false);
  });

  newAudio.addEventListener('ended', handleAudioEnded);

  // Слушаем событие времени для плавного перехода
  newAudio.addEventListener('timeupdate', handleTimeUpdate);

  return newAudio;
}

// ===== Плавный переход при окончании трека =====
function handleTimeUpdate() {
  if (!audio) return;

  // Если до конца трека осталось меньше 3 секунд, начинаем fade-out
  const timeRemaining = audio.duration - audio.currentTime;
  const fadeDuration = 3000; // 3 секунды на плавный переход

  if (timeRemaining <= fadeDuration / 1000 && !audio._isFadingOut) {
    startSmoothLoop();
  }
}

// ===== Плавный переход на новый цикл =====
function startSmoothLoop() {
  if (!audio || audio._isFadingOut) return;

  audio._isFadingOut = true;

  // Fade-out перед концом трека
  fadeOut(3000, () => {
    if (!audio) return;

    // Перематываем в начало
    audio.currentTime = 0;

    // Fade-in для нового цикла
    fadeIn(volumeSlider.value / 100, 3000, () => {
      if (audio) {
        audio._isFadingOut = false;
      }
    });
  });
}

// ===== Обработчик окончания трека (резервный) =====
function handleAudioEnded() {
  if (!audio) return;

  // Если по какой-то причине timeupdate не сработал
  audio.currentTime = 0;
  audio._isFadingOut = false;

  // Плавно запускаем заново
  audio.volume = 0;
  fadeIn(volumeSlider.value / 100, 2000);

  // Воспроизводим снова
  audio.play().catch(error => {
    console.error("Ошибка при повторном воспроизведении:", error);
  });
}

// ===== Полная очистка аудио =====
function cleanupAudio() {
  if (audio) {
    // Останавливаем все эффекты
    clearInterval(fadeInterval);
    clearTimeout(timerId);

    // Удаляем все обработчики событий
    audio.removeEventListener('ended', handleAudioEnded);
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    audio.load();

    audio = null;
  }
  isPlaying = false;
  fadeInterval = null;
}

// ===== Установка трека =====
function setTrack(name) {
  // Полностью очищаем предыдущее аудио
  cleanupAudio();

  // Создаем новый аудио элемент
  audio = createAudioElement(name);

  // Устанавливаем текущую громкость
  if (audio) {
    audio.volume = volumeSlider.value / 100;
  }

  applyBackgroundImage(backgroundsImagesMap[name]);
}

// ===== Обработчик Play/Pause =====
async function handlePlayPause() {
  if (!audio) return;

  try {
    if (!isPlaying) {
      await startPlayback();
    } else {
      stopPlayback();
    }
  } catch (error) {
    console.error("Ошибка управления воспроизведением:", error);
    isPlaying = false;
    updatePlayButton(false);
  }
}

// ===== Запуск воспроизведения =====
async function startPlayback() {
  if (!audio) return;

  try {
    // Сбрасываем флаги
    audio._isFadingOut = false;

    await audio.play();

    // Fade-in эффект при старте
    fadeIn(volumeSlider.value / 100, 2000);

    // Запуск таймера остановки
    startTimer();

  } catch (error) {
    console.error("Ошибка воспроизведения:", error);
    throw error;
  }
}

// ===== Остановка воспроизведения =====
function stopPlayback() {
  if (!audio) return;

  // Немедленно обновляем состояние
  isPlaying = false;
  updatePlayButton(false);
  clearTimeout(timerId);

  // Fade-out с остановкой
  fadeOut(2000, () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio._isFadingOut = false;
    }
  });
}

// ===== Fade-in =====
function fadeIn(targetVolume, duration = 1500, callback) {
  clearInterval(fadeInterval);

  if (!audio || targetVolume === 0) {
    if (callback) callback();
    return;
  }

  const step = 50;
  const increment = targetVolume / (duration / step);

  // Устанавливаем начальную громкость 0
  audio.volume = 0;

  fadeInterval = setInterval(() => {
    if (!audio) {
      clearInterval(fadeInterval);
      if (callback) callback();
      return;
    }

    if (audio.volume + increment >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(fadeInterval);
      if (callback) callback();
    } else {
      audio.volume += increment;
    }
  }, step);
}

// ===== Fade-out =====
function fadeOut(duration = 1500, callback) {
  clearInterval(fadeInterval);

  if (!audio || audio.volume === 0) {
    if (callback) callback();
    return;
  }

  const step = 50;
  const decrement = audio.volume / (duration / step);

  fadeInterval = setInterval(() => {
    if (!audio) {
      clearInterval(fadeInterval);
      if (callback) callback();
      return;
    }

    if (audio.volume - decrement <= 0) {
      audio.volume = 0;
      clearInterval(fadeInterval);
      if (callback) callback();
    } else {
      audio.volume -= decrement;
    }
  }, step);
}

// ===== Обновление кнопки воспроизведения =====
function updatePlayButton(playing) {
  playBtn.style.backgroundImage = playing ? "url('images/pause.svg')" : "url('images/play.svg')";
  iconEQ.src = playing ? "images/icon-equalizer-animated.svg" : "images/icon-equalizer.svg";
}

// ===== Обработчик громкости =====
function handleVolumeChange() {
  if (audio && !audio._isFadingOut) {
    audio.volume = volumeSlider.value / 100;
  }
}

// ===== Обработчик смены трека =====
function handleTrackChange() {
  const wasPlaying = isPlaying;

  // Останавливаем текущее воспроизведение перед сменой трека
  if (wasPlaying) {
    // Быстрая остановка без fade-out
    clearInterval(fadeInterval);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    isPlaying = false;
    updatePlayButton(false);
  }

  // Меняем трек
  setTrack(selector_BG_Music.value);

  // Если был запущен - запускаем новый трек
  if (wasPlaying) {
    setTimeout(() => {
      startPlayback();
    }, 100);
  }
}

// ===== Таймер автоматической остановки =====
function startTimer() {
  const timerMinutes = parseInt(timerInput.value, 10);
  if (timerMinutes > 0) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      stopPlayback();
    }, timerMinutes * 60 * 1000);
  }
}

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

// ===== Инициализация при загрузке =====
document.addEventListener('DOMContentLoaded', init);



