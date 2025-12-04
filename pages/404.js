document.addEventListener("DOMContentLoaded", () => {
  const donationsCardBtn = document.querySelector(".donations__icon-copy");
  const cardElement = document.querySelector(".donations__card");

  if (donationsCardBtn && cardElement) {
    donationsCardBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(cardElement.textContent.trim());
        donationsCardBtn.setAttribute("src", "./images/copy-ok.svg");

        setTimeout(() => {
          donationsCardBtn.setAttribute("src", "./images/copy.svg");
        }, 2000);
      } catch (err) {
        console.error("Ошибка копирования: ", err);
      }
    });
  }
});
