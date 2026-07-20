class RelaxPlayer {
  constructor() {
    this.audio = new Audio();
    this.nextAudio = new Audio();
    this.audioElements = [this.audio, this.nextAudio];
    this.audioContext = null;
    this.masterGain = null;
    this.audioBufferCache = {};
    this.audioBufferPromises = {};
    this.audioMode = "html";
    this.currentBuffer = null;
    this.currentSoundUrl = null;
    this.webAudioSources = [];
    this.webAudioStartTime = 0;
    this.webAudioOffset = 0;
    this.webAudioScheduleAhead = 10 * 60 * 60; // Планируем повторы на долгий фоновый режим
    this.maxScheduledSources = 1500;
    this.isPlaying = false;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.currentSound = null;
    this.timer = null;
    this.isMuted = false;
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

    this.iosLoopSoundUrls = Object.keys(this.soundUrls).reduce((urls, key) => {
      urls[key] = this.soundUrls[key]
        .replace("sounds/", "sounds/ios_loop/")
        .replace(".mp3", ".m4a");
      return urls;
    }, {});

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

    document.addEventListener("visibilitychange", () =>
      this.syncHtmlAudioState()
    );
    window.addEventListener("pageshow", () => this.syncHtmlAudioState());
    window.addEventListener("focus", () => this.syncHtmlAudioState());

    // Обработчики для аудио
    this.audioElements.forEach((audio) => {
      audio.addEventListener("loadeddata", () => this.onAudioLoaded());
      audio.addEventListener("error", (e) => this.onAudioError(e));
      audio.addEventListener("ended", () => this.onAudioEnded(audio));
      audio.addEventListener("play", () => this.onNativeAudioPlay(audio));
      audio.addEventListener("pause", () => this.onNativeAudioPause(audio));
    });
  }

  setupAudio() {
    this.setAudioSessionPlayback();

    this.audioElements.forEach((audio) => {
      audio.loop = this.isIOS;
      audio.volume = this.isIOS ? 1 : 0; // На iOS системная громкость надежнее JS-громкости
      audio.preload = this.isIOS && audio === this.nextAudio ? "none" : "auto";
      audio.setAttribute("playsinline", "");
      audio.setAttribute("webkit-playsinline", "");
    });

    // Загружаем первый звук и фон
    this.handleContentChange();
  }

  unlockAudio() {
    this.setAudioSessionPlayback();

    if (this.isIOS) {
      console.log("Аудиосессия подготовлена для iOS");
      return;
    }

    const audioContext = this.getAudioContext();

    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Для iOS: создаем и воспроизводим пустой звук
    const source = audioContext.createBufferSource();
    source.buffer = audioContext.createBuffer(1, 1, 22050);
    source.connect(this.masterGain);
    source.start(0);

    console.log("Аудио разблокировано для iOS");
  }

  setAudioSessionPlayback() {
    if (!navigator.audioSession) return;

    try {
      navigator.audioSession.type = "playback";
    } catch (error) {
      console.warn("Не удалось установить audioSession playback:", error);
    }
  }

  getSoundUrl(key) {
    if (this.isIOS && this.iosLoopSoundUrls[key]) {
      return this.iosLoopSoundUrls[key];
    }

    return this.soundUrls[key];
  }

  getAudioContext() {
    if (this.audioContext) return this.audioContext;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    this.audioContext = new AudioContextClass();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.audioContext.destination);

    return this.audioContext;
  }

  decodeAudioData(audioContext, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const decoding = audioContext.decodeAudioData(arrayBuffer, resolve, reject);

      if (decoding && typeof decoding.then === "function") {
        decoding.then(resolve).catch(reject);
      }
    });
  }

  async loadAudioBuffer(src) {
    if (this.audioBufferCache[src]) {
      return this.audioBufferCache[src];
    }

    if (this.audioBufferPromises[src]) {
      return this.audioBufferPromises[src];
    }

    const audioContext = this.getAudioContext();

    if (!audioContext) {
      throw new Error("Web Audio API недоступен");
    }

    this.audioBufferPromises[src] = (async () => {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(`Не удалось загрузить аудио: ${src}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.decodeAudioData(audioContext, arrayBuffer);
      this.audioBufferCache[src] = audioBuffer;
      delete this.audioBufferPromises[src];

      return audioBuffer;
    })().catch((error) => {
      delete this.audioBufferPromises[src];
      throw error;
    });

    return this.audioBufferPromises[src];
  }

  preloadAudioBuffer(src) {
    if (this.isIOS || !src || this.audioBufferCache[src]) return;

    this.loadAudioBuffer(src).catch((error) => {
      console.warn("Не удалось заранее загрузить Web Audio:", error);
    });
  }

  primeWebAudioContext() {
    if (this.isIOS) return;

    const audioContext = this.getAudioContext();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch((error) => {
        console.warn("Не удалось заранее запустить AudioContext:", error);
      });
    }
  }

  getCrossfadeSeconds(buffer) {
    return Math.min(this.crossfadeDuration / 1000, buffer.duration / 2);
  }

  getLoopInterval(buffer) {
    return Math.max(0.25, buffer.duration - this.getCrossfadeSeconds(buffer));
  }

  getOutputVolume() {
    return this.isMuted ? 0 : this.volume;
  }

  setMasterGain(value) {
    if (!this.audioContext || !this.masterGain) return;

    const safeVolume = Math.max(0, Math.min(1, value));
    const now = this.audioContext.currentTime;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(safeVolume, now);
  }

  clearWebAudioSources() {
    this.webAudioSources.forEach(({ source }) => {
      try {
        source.stop(0);
      } catch (error) {
        // Источник мог уже завершиться сам.
      }

      try {
        source.disconnect();
      } catch (error) {
        // Источник мог уже быть отключен.
      }
    });

    this.webAudioSources = [];
  }

  scheduleWebAudioSource(startTime, offset = 0) {
    if (!this.audioContext || !this.masterGain || !this.currentBuffer) return;

    const source = this.audioContext.createBufferSource();
    const safeOffset = Math.max(
      0,
      Math.min(offset, Math.max(0, this.currentBuffer.duration - 0.01))
    );

    source.buffer = this.currentBuffer;
    source.connect(this.masterGain);
    source.start(startTime, safeOffset);
    source.addEventListener("ended", () => {
      try {
        source.disconnect();
      } catch (error) {
        // Источник мог уже быть отключен при остановке.
      }
    });

    this.webAudioSources.push({ source, startTime });
  }

  scheduleWebAudioLoops(offset = 0) {
    if (!this.audioContext || !this.currentBuffer) return;

    const now = this.audioContext.currentTime;
    const loopInterval = this.getLoopInterval(this.currentBuffer);
    const scheduleUntil = now + this.webAudioScheduleAhead;
    const safeOffset = Math.max(0, Math.min(offset, loopInterval));
    let nextStartTime = now;
    let scheduledCount = 0;

    this.clearWebAudioSources();
    this.scheduleWebAudioSource(nextStartTime, safeOffset);
    scheduledCount += 1;

    nextStartTime += Math.max(0, loopInterval - safeOffset);

    while (
      nextStartTime < scheduleUntil &&
      scheduledCount < this.maxScheduledSources
    ) {
      this.scheduleWebAudioSource(nextStartTime);
      nextStartTime += loopInterval;
      scheduledCount += 1;
    }
  }

  getInactiveAudio() {
    return this.audioElements.find((audio) => audio !== this.audio);
  }

  setAudioSource(src) {
    this.stopLoopMonitor();
    this.clearWebAudioSources();
    this.isCrossfading = false;
    this.audioTransitionId += 1;
    this.audioMode = "html";
    this.currentSoundUrl = src;
    this.currentBuffer = null;
    this.webAudioOffset = 0;
    this.audio = this.audioElements[0];

    if (this.isIOS) {
      this.audio.src = src;
      this.audio.loop = true;
      this.audio.muted = this.isMuted;
      this.audio.volume = 1;
      this.audio.preload = "auto";
      this.audio.load();

      this.nextAudio.pause();
      this.nextAudio.removeAttribute("src");
      this.nextAudio.preload = "none";
      this.nextAudio.load();
      return;
    }

    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.loop = false;
      audio.muted = this.isMuted;
      audio.volume = 0;
      audio.src = src;
      audio.load();
    });

    this.preloadAudioBuffer(src);
  }

  setAudioElementsVolume(value) {
    const safeVolume = Math.max(0, Math.min(1, value));

    this.audioElements.forEach((audio) => {
      audio.volume = safeVolume;
    });

    if (this.audioMode === "webAudio") {
      this.setMasterGain(this.getOutputVolume());
    }
  }

  pauseAudioElements() {
    this.audioElements.forEach((audio) => {
      audio.pause();
    });
  }

  updatePlaybackUi(isPlaying) {
    this.playPauseBtn.classList.toggle("playing", isPlaying);
    this.iconEQ.setAttribute(
      "src",
      isPlaying
        ? "images/icon-equalizer-animated.svg"
        : "images/icon-equalizer.svg"
    );
  }

  syncHtmlAudioState() {
    if (this.audioMode !== "html") return;

    const isAudioPlaying = !this.audio.paused && !this.audio.ended;
    this.isPlaying = isAudioPlaying;

    if (isAudioPlaying && !this.isIOS) {
      this.startLoopMonitor();
    } else {
      this.stopLoopMonitor();
    }

    this.updatePlaybackUi(isAudioPlaying);
  }

  pauseImmediately() {
    this.isPlaying = false;
    this.stopLoopMonitor();
    this.clearWebAudioSources();
    this.pauseAudioElements();
    this.updatePlaybackUi(false);
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

    const safeTargetVolume = Math.max(0, Math.min(1, targetVolume));
    const startVolumes = this.audioElements.map((audio) => audio.volume);
    const startTime = performance.now();

    if (this.audioContext && this.masterGain) {
      const now = this.audioContext.currentTime;
      const fadeSeconds = this.fadeDuration / 1000;

      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(
        safeTargetVolume,
        now + fadeSeconds
      );
    }

    return new Promise((resolve) => {
      this.fadeResolve = resolve;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / this.fadeDuration, 1);

        this.audioElements.forEach((audio, index) => {
          let newVolume =
            startVolumes[index] +
            (safeTargetVolume - startVolumes[index]) * progress;
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

  async playWithWebAudio(playId) {
    const src = this.currentSoundUrl || this.soundUrls[this.currentSound];
    const audioContext = this.getAudioContext();

    if (!src || !audioContext) {
      throw new Error("Web Audio API недоступен");
    }

    await audioContext.resume();
    const audioBuffer = await this.loadAudioBuffer(src);

    if (playId !== this.audioTransitionId) return;

    this.pauseAudioElements();
    this.currentBuffer = audioBuffer;
    this.audioMode = "webAudio";
    this.isPlaying = true;
    this.webAudioStartTime = audioContext.currentTime - this.webAudioOffset;
    this.scheduleWebAudioLoops(this.webAudioOffset);
    this.updatePlaybackUi(true);
    await this.fadeVolume(this.getOutputVolume());
  }

  async playWithHtmlAudio(playId) {
    // Для iOS важно, чтобы воспроизведение начиналось по жесту
    if (this.isIOS) {
      this.audio.volume = 1;
    }

    await this.audio.play();

    if (playId !== this.audioTransitionId) return;

    this.audioMode = "html";
    this.isPlaying = true;

    if (!this.isIOS) {
      this.startLoopMonitor();
    }

    this.updatePlaybackUi(true);

    if (this.isIOS) return;

    // Плавное нарастание звука
    await this.fadeVolume(this.getOutputVolume());
  }

  switchHtmlToWebAudio(audioBuffer, playId) {
    if (
      this.isIOS ||
      playId !== this.audioTransitionId ||
      !this.isPlaying ||
      this.audioMode !== "html" ||
      !this.audioContext ||
      !this.masterGain
    ) {
      return;
    }

    const htmlAudio = this.audio;
    const loopInterval = this.getLoopInterval(audioBuffer);
    const offset =
      ((htmlAudio.currentTime % loopInterval) + loopInterval) % loopInterval;
    const startVolume = htmlAudio.volume;
    const targetVolume = this.getOutputVolume();
    const crossfadeMs = 250;
    const startTime = performance.now();

    this.currentBuffer = audioBuffer;
    this.audioMode = "webAudio";
    this.webAudioOffset = offset;
    this.webAudioStartTime = this.audioContext.currentTime - offset;

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((error) => {
        console.warn("Не удалось возобновить AudioContext:", error);
      });
    }

    this.setMasterGain(0);
    this.scheduleWebAudioLoops(offset);

    const animate = (currentTime) => {
      if (playId !== this.audioTransitionId || this.audioMode !== "webAudio") {
        return;
      }

      const progress = Math.min((currentTime - startTime) / crossfadeMs, 1);
      const nextHtmlVolume = startVolume * (1 - progress);
      const nextWebAudioVolume = targetVolume * progress;

      htmlAudio.volume = Math.max(0, Math.min(1, nextHtmlVolume));
      this.setMasterGain(nextWebAudioVolume);

      if (progress < 1) {
        requestAnimationFrame(animate);
        return;
      }

      this.pauseAudioElements();
      this.updatePlaybackUi(true);
    };

    requestAnimationFrame(animate);
  }

  async play() {
    const playId = ++this.audioTransitionId;
    const src = this.currentSoundUrl || this.soundUrls[this.currentSound];

    this.setAudioSessionPlayback();

    if (this.isIOS) {
      await this.playWithHtmlAudio(playId);
      return;
    }

    this.primeWebAudioContext();

    if (!src) return;

    if (!this.audioBufferCache[src]) {
      const audioBufferPromise = this.loadAudioBuffer(src);
      audioBufferPromise.catch(() => {});

      await this.playWithHtmlAudio(playId);

      audioBufferPromise
        .then((audioBuffer) => this.switchHtmlToWebAudio(audioBuffer, playId))
        .catch((error) => {
          console.warn("Web Audio недоступен, остаемся на HTMLAudio:", error);
        });

      return;
    }

    try {
      await this.playWithWebAudio(playId);
    } catch (error) {
      console.warn("Web Audio недоступен, используем HTMLAudio:", error);
      await this.playWithHtmlAudio(playId);
    }
  }

  async pause() {
    this.isPlaying = false;
    this.stopLoopMonitor();
    this.audioTransitionId += 1;
    this.isCrossfading = false;

    if (this.audioMode === "webAudio" && this.audioContext && this.currentBuffer) {
      const loopInterval = this.getLoopInterval(this.currentBuffer);
      const elapsed = this.audioContext.currentTime - this.webAudioStartTime;
      this.webAudioOffset = ((elapsed % loopInterval) + loopInterval) % loopInterval;
    }

    // Плавное затухание звука
    await this.fadeVolume(0);

    this.clearWebAudioSources();
    this.pauseAudioElements();
    this.updatePlaybackUi(false);
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
    const soundUrl = this.getSoundUrl(key);

    if (soundUrl) {
      this.setAudioSource(soundUrl);
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
        if (this.isIOS && document.hidden) {
          this.pauseImmediately();
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
    const isMuted = !this.isMuted;
    this.isMuted = isMuted;

    this.audioElements.forEach((audio) => {
      audio.muted = isMuted;
    });

    if (this.audioMode === "webAudio" && !this.fadeAnimation) {
      this.setMasterGain(this.getOutputVolume());
    }

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
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
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

    if (!this.isMuted) {
      this.volumeSlider.parentElement.classList.remove("player__label_disabled");
    }

    if (this.isPlaying && !this.fadeAnimation) {
      this.setAudioElementsVolume(this.getOutputVolume());
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

  onNativeAudioPlay(audio) {
    if (this.audioMode !== "html" || audio !== this.audio) return;

    this.syncHtmlAudioState();
  }

  onNativeAudioPause(audio) {
    if (this.audioMode !== "html" || audio !== this.audio) return;

    this.syncHtmlAudioState();
  }

  onAudioEnded(audio) {
    console.log("Аудио завершено");

    if (
      this.audioMode === "html" &&
      audio === this.audio &&
      this.isPlaying &&
      !this.isCrossfading
    ) {
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
