// Элементы
const donationsCardBtn = document.querySelector('.donations__icon-copy'); // Кнопка копирования номера карты
const selector_BG_Music = document.querySelector('.player__dropdown'); // Выбор фоновой музыки и изображения
const backgroundImagePage = document.querySelector('.page'); // Область с фоновой картинкой

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


