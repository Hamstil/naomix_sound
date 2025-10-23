class RelaxPlayer {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.currentSound = null;
    this.timer = null;
    this.volume = 0.5;
    this.fadeInterval = null;
    this.fadeDuration = 1000; // Длительность затухания/нарастания в мс

    this.initElements();
    this.bindEvents();
    this.setupAudio();

    if (this.isIOS) {
      this.showIOSWarning();
    }
  }

  initElements() {
    this.playPauseBtn = document.querySelector(".player__buttonPlayPause");
    this.dropdown = document.querySelector(".player__dropdown");
    this.timerSelect = document.querySelector(".player__timer");
    this.volumeBtn = document.querySelector(".player__volumeOnOff");
    this.volumeSlider = document.querySelector(".player__volume");
    this.iconEQ = document.querySelector(".player__icon-eq");
    this.donationsCardBtn = document.querySelector(".donations__icon-copy");
    this.cardNomber = document.querySelector(".donations__card");
    this.iosWarning = document.getElementById("ios-warning");
  }

  bindEvents() {
    // Основные контролы
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.dropdown.addEventListener("change", () => this.changeSound());
    this.timerSelect.addEventListener("change", () => this.setTimer());
    this.volumeBtn.addEventListener("click", () => this.toggleMute());
    this.donationsCardBtn.addEventListener("click", () => this.cardDonatCopy());
    this.volumeSlider.addEventListener("input", (e) =>
      this.setVolume(e.target.value)
    );

    // Особые обработчики для iOS
    if (this.isIOS) {
      document.addEventListener("touchstart", () => this.unlockAudio(), {
        once: true,
      });
    }

    // Обработчики для аудио
    this.audio.addEventListener("loadeddata", () => this.onAudioLoaded());
    this.audio.addEventListener("error", (e) => this.onAudioError(e));
    this.audio.addEventListener("ended", () => this.onAudioEnded());
  }

  setupAudio() {
    this.audio.loop = true;
    this.audio.volume = 0; // Начинаем с нулевой громкости
    this.audio.preload = "auto";

    // Загружаем первый звук
    this.changeSound();
  }

  unlockAudio() {
    // Для iOS: создаем и воспроизводим пустой звук
    const silentBuffer = new AudioContext();
    const source = silentBuffer.createBufferSource();
    source.buffer = silentBuffer.createBuffer(1, 1, 22050);
    source.connect(silentBuffer.destination);
    source.start(0);

    console.log("Аудио разблокировано для iOS");
  }

  // Функция плавного нарастания громкости
  fadeIn() {
    return new Promise((resolve) => {
      // Останавливаем предыдущее затухание, если оно есть
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }

      const targetVolume = this.volume;
      const step = targetVolume / (this.fadeDuration / 50); // 50ms интервал
      let currentVolume = 0;

      this.audio.volume = currentVolume;

      this.fadeInterval = setInterval(() => {
        currentVolume += step;

        if (currentVolume >= targetVolume) {
          this.audio.volume = targetVolume;
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        } else {
          this.audio.volume = currentVolume;
        }
      }, 50);
    });
  }

  // Функция плавного затухания громкости
  fadeOut() {
    return new Promise((resolve) => {
      // Останавливаем предыдущее нарастание, если оно есть
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }

      const startVolume = this.audio.volume;
      const step = startVolume / (this.fadeDuration / 50); // 50ms интервал
      let currentVolume = startVolume;

      this.fadeInterval = setInterval(() => {
        currentVolume -= step;

        if (currentVolume <= 0) {
          this.audio.volume = 0;
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        } else {
          this.audio.volume = currentVolume;
        }
      }, 50);
    });
  }

  async togglePlay() {
    if (!this.currentSound) return;

    try {
      if (this.isPlaying) {
        await this.pause();
      } else {
        await this.play();
      }
    } catch (error) {
      console.error("Ошибка воспроизведения:", error);
      if (this.isIOS) {
        this.showIOSWarning("Нажмите еще раз для воспроизведения");
      }
    }
  }

  async play() {
    // Для iOS важно, чтобы воспроизведение начиналось по жесту
    await this.audio.play();
    this.isPlaying = true;
    this.playPauseBtn.classList.add("playing");
    this.iconEQ.setAttribute("src", "images/icon-equalizer-animated.svg");
    // Плавное нарастание звука
    await this.fadeIn();
  }

  async pause() {
    // Плавное затухание звука
    await this.fadeOut();

    this.audio.pause();
    this.isPlaying = false;
    this.playPauseBtn.classList.remove("playing");
    this.iconEQ.setAttribute("src", "images/icon-equalizer.svg");
  }

  changeSound() {
    const soundKey = this.dropdown.value;
    this.currentSound = soundKey;

    const soundUrls = {
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

    this.audio.src = soundUrls[soundKey];

    if (this.isPlaying) {
      this.pause();
    }
  }

  async setTimer() {
    const minutes = parseInt(this.timerSelect.value);
    this.clearTimer();

    if (minutes > 0) {
      this.timer = setTimeout(async () => {
        if (this.isIOS) {
          this.audio.pause();
          this.isPlaying = false;
          this.playPauseBtn.classList.remove("playing");
          return;
        } else {
          await this.pause();
          this.timerSelect.value = "0";
        }
      }, minutes * 60 * 1000);
    }
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this.volumeBtn.classList.toggle("muted", this.audio.muted);

    if (this.audio.muted) {
      this.volumeSlider.parentElement.classList.add("player__label_disabled");
    } else {
      this.volumeSlider.parentElement.classList.remove(
        "player__label_disabled"
      );
    }
  }

  setVolume(value) {
    this.volume = value / 100;

    if (this.isPlaying && !this.fadeInterval) {
      this.audio.volume = this.volume;
    }

    localStorage.setItem("relaxPlayerVolume", value);
  }

  onAudioLoaded() {
    console.log("Аудио загружено:", this.currentSound);
  }

  onAudioError(e) {
    console.error("Ошибка загрузки аудио:", e);
    alert("Ошибка загрузки звука. Попробуйте другой вариант.");
  }

  onAudioEnded() {
    console.log("Аудио завершено");
  }

  showIOSWarning(message = null) {
    this.iosWarning.style.display = "block";
    if (message) {
      this.iosWarning.textContent = message;
    }

    setTimeout(() => {
      this.iosWarning.style.display = "none";
    }, 5000);
  }

  async cardDonatCopy() {
    try {
      await navigator.clipboard.writeText(this.cardNomber.textContent);
      this.donationsCardBtn.setAttribute("src", "./images/copy-ok.svg");
      setTimeout(() => {
        this.donationsCardBtn.setAttribute("src", "./images/copy.svg");
      }, 2000);
    } catch (err) {
      console.error("Ошибка копирования номера карты: ", err);
    }
  }

  // Восстановление настроек из localStorage
  loadSettings() {
    const savedVolume = localStorage.getItem("relaxPlayerVolume");
    if (savedVolume) {
      this.volumeSlider.value = savedVolume;
      this.setVolume(savedVolume);
    }
  }
}

// Инициализация плеера при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  const player = new RelaxPlayer();
  player.loadSettings();

  // Глобальный экспорт для отладки
  window.relaxPlayer = player;
});
