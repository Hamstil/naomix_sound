// Элементы
const donationsCardBtn = document.querySelector('.donations__icon-copy'); // Кнопка копирования номера карты
const backgroundImagePage = document.querySelector('.page'); // Область с фоновой картинкой

const selector_BG_Music = document.querySelector('.player__dropdown'); // Выпадающий список фоновых изображений и музыки
const playBtn = document.querySelector('.player__buttonPlayPause'); // Кнопка Play/Pause
const volumeSlider = document.querySelector('.player__volume'); // Слайдер громкости
const timerInput = document.querySelector('.player__timer'); // Время таймера список

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = audioCtx.createGain(); // громкость
gainNode.connect(audioCtx.destination);

let currentBuffer = null;   // буфер трека
let sourceNode = null;      // проигрыватель
let isPlaying = false;
let timerId = null;

// Список треков
const sounds = {
    "rain_in_the_forest": '../sounds/rain_in_the_forest.mp3',
    "the_sound_of_rain": '../sounds/the_sound_of_rain.mp3',
    "glucophone": '../sounds/glucophone.mp3',
    "the_fire_in_the_oven": '../sounds/the_fire_in_the_oven.mp3',
    "fire_in_the_street": '../sounds/fire_in_the_street.mp3',
    "the_noise_of_the_forest": '../sounds/the_noise_of_the_forest.mp3',
    "wave_noise": '../sounds/wave_noise.mp3',
    "the_sound_of_the_sea": '../sounds/the_sound_of_the_sea.mp3',
    "the_sound_of_the_spring": '../sounds/the_sound_of_the_spring.mp3',
    "crickets": '../sounds/crickets.mp3',
    "cicadas": '../sounds/cicadas.mp3',
    "in_the_cafe": '../sounds/in_the_cafe.mp3',
};

// Загрузка трека
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

// Запуск
async function startSound() {
    if (!currentBuffer) return;

    stopSound(true); // если что-то играет — стопаем без фейда

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = currentBuffer;
    sourceNode.loop = true; // бесшовный луп
    sourceNode.connect(gainNode);
    sourceNode.start();

    playBtn.style.backgroundImage = "url('../../../images/pause.svg')";
    isPlaying = true;

    // Плавный fade-in
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volumeSlider.value / 100, audioCtx.currentTime + 2);

    // Таймер
    const timerMinutes = parseInt(timerInput.value, 10);
    if (timerMinutes > 0) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            stopSound();
        }, timerMinutes * 60 * 1000);
    }
}

// Стоп с fade-out
function stopSound(immediate = false) {
    if (!sourceNode) return;

    clearTimeout(timerId);

    if (immediate) {
        sourceNode.stop();
        sourceNode.disconnect();
        sourceNode = null;
        playBtn.style.backgroundImage = "url('../../../images/play.svg')";
        isPlaying = false;
        return;
    }

    // Плавный fade-out
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);

    setTimeout(() => {
        if (sourceNode) {
            sourceNode.stop();
            sourceNode.disconnect();
            sourceNode = null;
        }
        playBtn.style.backgroundImage = "url('../../../images/play.svg')";
        isPlaying = false;
    }, 2000);
}

// Переключение звука
selector_BG_Music.addEventListener('change', async () => {
    const selected = selector_BG_Music.value;
    currentBuffer = await loadSound(sounds[selected]);
    if (isPlaying) {
        startSound();
    }
});

// Кнопка Play/Pause
playBtn.addEventListener('click', () => {
    if (!isPlaying) {
        if (!currentBuffer) {
            const selected = selector_BG_Music.value;
            loadSound(sounds[selected]).then(buffer => {
                currentBuffer = buffer;
                startSound();
            });
        } else {
            startSound();
        }
    } else {
        stopSound();
    }
});

// Громкость
volumeSlider.addEventListener('input', () => {
    gainNode.gain.setValueAtTime(volumeSlider.value / 100, audioCtx.currentTime);
});


// Карта фоновых изображений для смены фона
const backgroundsImagesMap = {
  'rain_in_the_forest': '../../images/img_bg/rain_in_the_forest.webp',
  'the_sound_of_rain': '../../images/img_bg/noise_of_rain.webp',
  'glucophone': '../../images/img_bg/glucophone.webp',
  'the_fire_in_the_oven': '../../images/img_bg/fire_in_the_oven.webp',
  'fire_in_the_street': '../../images/img_bg/fire_on_the_street.webp',
  'the_noise_of_the_forest': '../../images/img_bg/noise_forests.webp',
  'wave_noise': '../../images/img_bg/noise_waves.webp',
  'the_sound_of_the_sea': '../../images/img_bg/noise_of_the_sea.webp',
  'the_sound_of_the_spring': '../../images/img_bg/sound_of_the_spring.webp',
  'crickets': '../../images/img_bg/crickets_and_birds.webp',
  'cicadas': '../../images/img_bg/tsykady.webp',
  'in_the_cafe': '../../images/img_bg/in_cafe.webp', 
};

// Смена фона при выборе в выпадающем списке
selector_BG_Music.addEventListener('change', function () {
  const imageUrl = backgroundsImagesMap[this.value] || backgroundsImagesMap['rain_in_the_forest'];
  applyBackgroundImage(imageUrl);
});

// Функция для применения нового фона
function applyBackgroundImage(imageUrl) {  
  backgroundImagePage.style.backgroundImage = `url('${imageUrl}')`;
}

 
// Копирования текста в буфер обмена (номер карты)
donationsCardBtn.addEventListener("click", async function () {
  const textCard = document.querySelector(".donations__card").textContent; // Получаем текст из элемента

  try {
    await navigator.clipboard.writeText(textCard.trim());
    donationsCardBtn.setAttribute("src", "./images/copy-ok.svg");
    setTimeout(() => {
      donationsCardBtn.setAttribute("src", "./images/copy.svg");
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
        "url('../../../images/icon-vol-sound.svg')";
    } else {
      previousVolume = parseInt(volumeInput.value);
      volumeInput.value = 0;
      volumeButton.style.backgroundImage =
        "url('../../../images/sound-off.svg')";
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
        "url('../../../images/sound-off.svg')";
      isMuted = true;
    } else {
      volumeButton.style.backgroundImage =
        "url('../../../images/icon-vol-sound.svg')";
      isMuted = false;
      previousVolume = currentVolume;
    }
  });
});


