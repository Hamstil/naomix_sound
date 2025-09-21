// Элементы
const donationsCardBtn = document.querySelector(".donations__icon-copy"); // Кнопка копирования номера карты

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
