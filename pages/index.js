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
