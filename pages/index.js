class RelaxPlayer {
  constructor() {
    this.audio = new Audio();
    this.nextAudio = new Audio();
    this.audioElements = [this.audio, this.nextAudio];
    this.isPlaying = false;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.currentSound = null;
    this.timer = null;
    this.volume = 0.5;
    this.fadeAnimation = null;
    this.fadeResolve = null;
    this.fadeDuration = 800; // Длительность затухания/нарастания в мс
    this.crossfadeDuration = 1500; // Длительность перекрытия конца и начала трека
    this.loopMonitor = null;
    this.isCrossfading = false;
    this.audioTransitionId = 0;
    this.backgroundFadeDuration = 800;
    this.backgroundTransitionId = 0;
    this.saveVolumeTimeout = null;

    this.soundUrls = {
      rain_in_the_forest: "sounds/rain_in_the_forest.mp3",
      the_sound_of_rain: "sounds/the_sound_of_rain.mp3",
      glucophone: "sounds/Glucophone_(sleep_melody)_01.mp3",
      the_fire_in_the_oven: "sounds/the_fire_in_the_oven.mp3",
      fire_in_the_street: "sounds/fire_in_the_street.mp3",
      the_noise_of_the_forest: "sounds/the_noise_of_the_forest.mp3",
      wave_noise: "sounds/wave_noise.mp3",
      the_sound_of_the_sea: "sounds/the_sound_of_the_sea_01.mp3",
      the_sound_of_the_spring: "sounds/the_sound_of_the_spring.mp3",
      crickets: "sounds/crickets.mp3",
      cicadas: "sounds/cicadas.mp3",
      in_the_cafe: "sounds/in_the_cafe.mp3",
      the_hayloft: "sounds/the_hayloft.mp3",
      rustling_of_leaves: "sounds/rustling_of_leaves.mp3",
      frogs: "sounds/frogs.mp3",
      purring_of_the_cat: "sounds/purring_of_the_cat.mp3",
      birdsong: "sounds/birdsong.mp3",
      blizzard: "sounds/blizzard.mp3",
    };

    this.backgroundsImagesMap = {
      rain_in_the_forest: "images/img_bg/rain_in_the_forest.webp",
      the_sound_of_rain: "images/img_bg/noise_of_rain.webp",
      glucophone: "images/img_bg/glucophone.webp",
      the_fire_in_the_oven: "images/img_bg/Fire_in_the_oven.webp",
      fire_in_the_street: "images/img_bg/fire_on_the_street.webp",
      the_noise_of_the_forest: "images/img_bg/noise_forests.webp",
      wave_noise: "images/img_bg/noise_waves.webp",
      the_sound_of_the_sea: "images/img_bg/noise_of_the_sea.webp",
      the_sound_of_the_spring: "images/img_bg/sound_of_the_spring.webp",
      crickets: "images/img_bg/crickets_and_birds.webp",
      cicadas: "images/img_bg/tsykady.webp",
      in_the_cafe: "images/img_bg/in_cafe.webp",
      the_hayloft: "images/img_bg/the_hayloft.webp",
      rustling_of_leaves: "images/img_bg/rustling_of_leaves.webp",
      frogs: "images/img_bg/frogs.webp",
      purring_of_the_cat: "images/img_bg/purring_of_the_cat_01.webp",
      birdsong: "images/img_bg/birdsong.webp",
      blizzard: "images/img_bg/blizzard.webp",
    };

    this.initElements();
    this.bindEvents();
    this.setupAudio();

    if (this.isIOS) {
      if (this.volumeSlider) this.volumeSlider.style.display = "none";
      this.showIOSWarning();
    }

    this.updateCopyrightYear();
  }

  initElements() {
    this.playPauseBtn = document.querySelector(".player__buttonPlayPause");
    this.dropdown = document.querySelector(".player__dropdown");
    this.timerSelect = document.querySelector(".player__timer");
    this.volumeBtn = document.querySelector(".player__volumeOnOff");
    this.volumeSlider = document.querySelector(".player__volume");
    this.iconEQ = document.querySelector(".player__icon-eq");
    this.cardNomber = document.querySelector(".donations__card");
    this.iosWarning = document.getElementById("ios-warning");
    this.backgroundImagePage = document.querySelector(".page");
    this.backgroundLayerCurrent = null;
    this.backgroundLayerNext = null;

    this.initBackgroundLayers();
  }

  initBackgroundLayers() {
    if (!this.backgroundImagePage) return;

    const background = document.createElement("div");
    background.className = "page__background";

    this.backgroundLayerCurrent = document.createElement("div");
    this.backgroundLayerCurrent.className =
      "page__background-layer page__background-layer_current";

    this.backgroundLayerNext = document.createElement("div");
    this.backgroundLayerNext.className =
      "page__background-layer page__background-layer_next";

    background.append(this.backgroundLayerCurrent, this.backgroundLayerNext);
    this.backgroundImagePage.prepend(background);
    this.backgroundImagePage.classList.add("page_background-ready");
  }

  bindEvents() {
    // Основные контролы
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.dropdown.addEventListener("change", () => this.handleContentChange());
    this.timerSelect.addEventListener("change", () => this.setTimer());
    this.volumeBtn.addEventListener("click", () => this.toggleMute());
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
    this.audioElements.forEach((audio) => {
      audio.addEventListener("loadeddata", () => this.onAudioLoaded());
      audio.addEventListener("error", (e) => this.onAudioError(e));
      audio.addEventListener("ended", () => this.onAudioEnded(audio));
    });
  }

  setupAudio() {
    this.audioElements.forEach((audio) => {
      audio.loop = false;
      audio.volume = 0; // Начинаем с нулевой громкости
      audio.preload = "auto";
    });

    // Загружаем первый звук и фон
    this.handleContentChange();
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

  getInactiveAudio() {
    return this.audioElements.find((audio) => audio !== this.audio);
  }

  setAudioSource(src) {
    const isMuted = this.audio.muted;

    this.stopLoopMonitor();
    this.isCrossfading = false;
    this.audioTransitionId += 1;
    this.audio = this.audioElements[0];

    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.loop = false;
      audio.muted = isMuted;
      audio.volume = 0;
      audio.src = src;
      audio.load();
    });
  }

  setAudioElementsVolume(value) {
    const safeVolume = Math.max(0, Math.min(1, value));

    this.audioElements.forEach((audio) => {
      audio.volume = safeVolume;
    });
  }

  pauseAudioElements() {
    this.audioElements.forEach((audio) => {
      audio.pause();
    });
  }

  startLoopMonitor() {
    this.stopLoopMonitor();

    const monitor = () => {
      if (!this.isPlaying) return;

      const duration = this.audio.duration;
      const currentTime = this.audio.currentTime;

      if (duration && isFinite(duration)) {
        const timeLeft = duration - currentTime;
        const crossfadeSeconds = this.crossfadeDuration / 1000;

        if (!this.isCrossfading && timeLeft <= crossfadeSeconds) {
          this.startCrossfadeLoop();
        }
      }

      this.loopMonitor = requestAnimationFrame(monitor);
    };

    this.loopMonitor = requestAnimationFrame(monitor);
  }

  stopLoopMonitor() {
    if (this.loopMonitor) {
      cancelAnimationFrame(this.loopMonitor);
      this.loopMonitor = null;
    }
  }

  async startCrossfadeLoop() {
    if (this.isCrossfading || !this.isPlaying) return;

    const currentAudio = this.audio;
    const nextAudio = this.getInactiveAudio();
    const transitionId = ++this.audioTransitionId;

    if (!nextAudio || !currentAudio.src) return;

    this.isCrossfading = true;

    try {
      nextAudio.pause();
      if (nextAudio.src !== currentAudio.src) {
        nextAudio.src = currentAudio.src;
      }
      nextAudio.currentTime = 0;
      nextAudio.muted = currentAudio.muted;
      nextAudio.volume = this.volume;

      await nextAudio.play();

      this.audio = nextAudio;

      const timeLeft = Math.max(0, currentAudio.duration - currentAudio.currentTime);
      const stopDelay = timeLeft * 1000 + 50;

      setTimeout(() => {
        if (transitionId !== this.audioTransitionId) return;

        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.volume = this.volume;
        this.isCrossfading = false;
      }, stopDelay);
    } catch (error) {
      console.error("Ошибка crossfade-перехода:", error);
      this.isCrossfading = false;
    }
  }

  // Функция плавного изменения громкости
  fadeVolume(targetVolume) {
    if (this.fadeAnimation) {
      cancelAnimationFrame(this.fadeAnimation);
      this.fadeAnimation = null;
    }

    if (this.fadeResolve) {
      this.fadeResolve();
      this.fadeResolve = null;
    }

    const startVolumes = this.audioElements.map((audio) => audio.volume);
    const startTime = performance.now();

    return new Promise((resolve) => {
      this.fadeResolve = resolve;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / this.fadeDuration, 1);

        this.audioElements.forEach((audio, index) => {
          let newVolume =
            startVolumes[index] + (targetVolume - startVolumes[index]) * progress;
          // Ограничиваем значение от 0 до 1, чтобы избежать IndexSizeError
          newVolume = Math.max(0, Math.min(1, newVolume));

          audio.volume = newVolume;
        });

        if (progress < 1) {
          this.fadeAnimation = requestAnimationFrame(animate);
        } else {
          this.fadeAnimation = null;
          this.fadeResolve = null;
          resolve();
        }
      };

      this.fadeAnimation = requestAnimationFrame(animate);
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
    this.startLoopMonitor();
    this.playPauseBtn.classList.add("playing");
    this.iconEQ.setAttribute("src", "images/icon-equalizer-animated.svg");
    // Плавное нарастание звука
    await this.fadeVolume(this.volume);
  }

  async pause() {
    this.isPlaying = false;
    this.stopLoopMonitor();
    this.audioTransitionId += 1;
    this.isCrossfading = false;

    // Плавное затухание звука
    await this.fadeVolume(0);

    this.pauseAudioElements();
    this.playPauseBtn.classList.remove("playing");
    this.iconEQ.setAttribute("src", "images/icon-equalizer.svg");
  }

  async handleContentChange() {
    const key = this.dropdown.value;
    const wasPlaying = this.isPlaying;
    this.currentSound = key;

    if (wasPlaying) {
      await this.pause();
    }

    if (this.backgroundsImagesMap[key]) {
      this.setBackgroundImage(this.backgroundsImagesMap[key]);
    }

    // Смена аудио
    if (this.soundUrls[key]) {
      this.setAudioSource(this.soundUrls[key]);
    }

    // Сброс таймера
    this.timerSelect.value = "0";
    this.clearTimer();
  }

  setBackgroundImage(imageUrl) {
    if (!this.backgroundLayerCurrent || !this.backgroundLayerNext) {
      if (this.backgroundImagePage) {
        this.backgroundImagePage.style.backgroundImage = `url(${imageUrl})`;
      }
      return;
    }

    if (this.currentBackgroundImage === imageUrl) return;

    const transitionId = ++this.backgroundTransitionId;
    const nextImage = new Image();

    nextImage.onload = () => {
      if (transitionId !== this.backgroundTransitionId) return;

      if (!this.currentBackgroundImage) {
        this.backgroundLayerCurrent.style.backgroundImage = `url(${imageUrl})`;
        this.currentBackgroundImage = imageUrl;
        return;
      }

      this.backgroundLayerNext.style.transitionDuration = `${this.backgroundFadeDuration}ms`;
      this.backgroundLayerNext.style.backgroundImage = `url(${imageUrl})`;
      this.backgroundLayerNext.classList.add("page__background-layer_visible");

      window.setTimeout(() => {
        if (transitionId !== this.backgroundTransitionId) return;

        this.backgroundLayerCurrent.style.backgroundImage = `url(${imageUrl})`;
        this.backgroundLayerNext.classList.remove(
          "page__background-layer_visible"
        );
        this.currentBackgroundImage = imageUrl;
      }, this.backgroundFadeDuration);
    };

    nextImage.src = imageUrl;
  }

  async setTimer() {
    const minutes = parseInt(this.timerSelect.value);
    this.clearTimer();

    if (minutes > 0) {
      this.timer = setTimeout(async () => {
        if (this.isIOS) {
          this.isPlaying = false;
          this.stopLoopMonitor();
          this.pauseAudioElements();
          this.playPauseBtn.classList.remove("playing");
          this.iconEQ.setAttribute("src", "images/icon-equalizer.svg");
          this.timerSelect.value = "0";
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
    const isMuted = !this.audio.muted;

    this.audioElements.forEach((audio) => {
      audio.muted = isMuted;
    });

    if (isMuted) {
      this.volumeBtn.style.backgroundImage = "url('./images/sound-off.svg')";
      this.volumeSlider.parentElement.classList.add("player__label_disabled");
    } else {
      this.volumeBtn.style.backgroundImage = "url('./images/icon-vol-sound.svg')";
      this.volumeSlider.parentElement.classList.remove("player__label_disabled");
    }
  }

  setVolume(value) {
    let newVolume = value / 100;

    // Защита от некоректных значений
    if (!isFinite(newVolume)) newVolume = 0.5;
    newVolume = Math.max(0, Math.min(1, newVolume));

    this.volume = newVolume;

    // Если громкость больше 0, автоматически выключаем mute
    if (this.volume > 0 && this.audio.muted) {
      this.audioElements.forEach((audio) => {
        audio.muted = false;
      });
      this.volumeSlider.parentElement.classList.remove("player__label_disabled");
    }

    if (this.volume === 0) {
      this.volumeBtn.style.backgroundImage = "url('./images/sound-off.svg')";
    } else {
      this.volumeBtn.style.backgroundImage = "url('./images/icon-vol-sound.svg')";
    }

    if (this.isPlaying && !this.fadeAnimation) {
      this.setAudioElementsVolume(this.volume);
    }

    // Debounce для сохранения в localStorage
    if (this.saveVolumeTimeout) {
      clearTimeout(this.saveVolumeTimeout);
    }
    this.saveVolumeTimeout = setTimeout(() => {
      localStorage.setItem("relaxPlayerVolume", value);
    }, 500);
  }

  onAudioLoaded() {
    console.log("Аудио загружено:", this.currentSound);
  }

  onAudioError(e) {
    console.error("Ошибка загрузки аудио:", e);
    // Не показываем alert, чтобы не раздражать пользователя, лучше логировать
  }

  onAudioEnded(audio) {
    console.log("Аудио завершено");

    if (audio === this.audio && this.isPlaying && !this.isCrossfading) {
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.error("Ошибка перезапуска аудио:", error);
      });
    }
  }

  showIOSWarning(message = null) {
    if (!this.iosWarning) return; // Безопасная проверка

    this.iosWarning.style.display = "block";
    if (message) {
      this.iosWarning.textContent = message;
    }

    setTimeout(() => {
      this.iosWarning.style.display = "none";
    }, 5000);
  }

  // Восстановление настроек из localStorage
  loadSettings() {
    const savedVolume = localStorage.getItem("relaxPlayerVolume");
    if (savedVolume) {
      this.volumeSlider.value = savedVolume;
      this.setVolume(savedVolume);
    }
  }
  // Автоматическое обновление года в футере
  updateCopyrightYear() {
    const yearElement = document.getElementById("copyright-year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
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
