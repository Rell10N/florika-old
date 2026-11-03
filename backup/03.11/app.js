const App = {
  playerName: "",
  currentTutorialStep: 0,
  maxVisitedStep: -1,
  inputStepIndex: -1,
  isTyping: false,
  isBusy: false,
  typewriterTimeout: null,
  currentFullText: "",

  save: { prologueDone: false, playerName: "" },
  saveKey: "florika_save_v1",
  soundOn: true,
  resetArmed: false,
  resetTimeout: null,
  toastTimeout: null,

  audioCtx: null,
  voiceBuffer: null,
  preloadedImages: [],
  bgmTracks: [],
  isMusicStarted: false,
  bgmVolume: 0.03,

  init() {
    this.loadSave();
    this.inputStepIndex = GameData.prologue.findIndex(step => step.type === "input");
    this.buildStepDots();
    this.preloadSprites();
    this.loadVoiceAudio();
    this.setupInteractionUnlock();
    this.setupNameInput();
    this.runStudioIntro();

    window.addEventListener("popstate", () => {
      const tutorialActive = document.getElementById("screen-tutorial").classList.contains("active");
      if (!tutorialActive || this.isBusy) return;
      const wasFirstStep = this.currentTutorialStep === 0;
      this.goBack();
      if (!wasFirstStep) {
        history.pushState({screen: "tutorial"}, "");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal("modal-settings");
        this.closeModal("modal-exit");
      }
    });
  },

  loadSave() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.save.prologueDone = data.prologueDone === true;
        this.save.playerName = typeof data.playerName === "string" ? data.playerName : "";
        this.soundOn = data.soundOn !== false;
      }
    } catch (e) {}
    this.playerName = this.save.playerName;
    this.updateSoundToggle();
  },

  persist() {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify({
        prologueDone: this.save.prologueDone,
        playerName: this.save.playerName,
        soundOn: this.soundOn
      }));
    } catch (e) {}
  },

  runStudioIntro() {
    const intro = document.getElementById("studio-intro");
    if (!intro) return;

    const minDelay = new Promise(resolve => setTimeout(resolve, 1900));
    const pageLoaded = new Promise(resolve => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
        setTimeout(resolve, 4000);
      }
    });

    Promise.all([minDelay, pageLoaded]).then(() => {
      intro.classList.add("hidden");
      setTimeout(() => {
        intro.style.display = "none";
      }, 1000);
    });
  },

  setupInteractionUnlock() {
    const unlock = () => {
      if (!this.isMusicStarted) {
        this.startMusic();
      }
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
  },

  setupNameInput() {
    const input = document.getElementById("player-name-input");
    if (!input) return;
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.advance();
      }
    });
  },

  buildStepDots() {
    const wrap = document.getElementById("step-indicator");
    if (!wrap) return;
    wrap.innerHTML = "";
    GameData.prologue.forEach(() => {
      const dot = document.createElement("span");
      dot.className = "step-dot";
      wrap.appendChild(dot);
    });
  },

  collectSprites() {
    const list = [];
    GameData.prologue.forEach(step => {
      if (step.type === "reaction") {
        list.push(step.named.sprite, step.anonymous.sprite);
      } else {
        list.push(step.sprite);
      }
    });
    Object.values(GameData.stubs).forEach(stub => list.push(stub.sprite));
    return list.filter((src, i, arr) => arr.indexOf(src) === i);
  },

  preloadSprites() {
    this.collectSprites().forEach(src => {
      const img = new Image();
      img.src = src;
      this.preloadedImages.push(img);
    });
  },

  loadVoiceAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioCtx = new AudioContextClass();

    fetch("assets/audio/voice.mp3")
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioCtx.decodeAudioData(arrayBuffer))
      .then(decodedBuffer => {
        this.voiceBuffer = decodedBuffer;
      })
      .catch(() => {});
  },

  resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  },

  playVoiceBeep() {
    if (!this.soundOn || !this.audioCtx || !this.voiceBuffer) return;

    this.resumeAudio();

    const source = this.audioCtx.createBufferSource();
    source.buffer = this.voiceBuffer;
    source.playbackRate.value = 1.1 + Math.random() * 0.6;

    const highpass = this.audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 400;

    const lowpass = this.audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2800;

    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.19 + Math.random() * 0.15;

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.audioCtx.destination);
    source.start(0);
  },

  initBGM() {
    this.bgmTracks = [
      new Audio("assets/audio/bgm_the_empty_lab.mp3"),
      new Audio("assets/audio/bgm_gears_and_sprouts.mp3")
    ];

    this.bgmTracks.forEach((track, i) => {
      track.crossfadeTriggered = false;
      track.isLeveled = false;

      track.addEventListener("timeupdate", () => {
        if (!track.crossfadeTriggered && track.duration && track.currentTime >= track.duration - 2) {
          track.crossfadeTriggered = true;
          const nextIndex = (i + 1) % this.bgmTracks.length;
          this.bgmTracks[nextIndex].crossfadeTriggered = false;
          this.bgmTracks[nextIndex].isLeveled = false;
          this.crossfade(track, this.bgmTracks[nextIndex]);
        }

        if (i === 0) {
          if (track.currentTime >= 55 && !track.isLeveled && !track.crossfadeTriggered) {
            track.isLeveled = true;
            this.fadeAudio(track, track.volume, this.bgmVolume * 0.55, 3000);
          } else if (track.currentTime < 55 && track.isLeveled) {
            track.isLeveled = false;
          }
        }
      });
    });

    this.applySoundState();
  },

  startMusic() {
    if (this.isMusicStarted) return;
    this.isMusicStarted = true;

    if (this.bgmTracks.length === 0) this.initBGM();
    const track = this.bgmTracks[0];
    track.isLeveled = false;
    track.volume = 0;
    track.play().catch(() => {});
    this.fadeAudio(track, 0, this.bgmVolume, 2500);
  },

  crossfade(fadeOutTrack, fadeInTrack) {
    this.fadeAudio(fadeOutTrack, fadeOutTrack.volume, 0, 2000);
    fadeInTrack.currentTime = 0;
    fadeInTrack.volume = 0;
    fadeInTrack.isLeveled = false;
    fadeInTrack.crossfadeTriggered = false;
    fadeInTrack.play().catch(() => {});
    this.fadeAudio(fadeInTrack, 0, this.bgmVolume, 1500);
  },

  fadeAudio(audioEl, startVol, endVol, duration) {
    if (audioEl.fadeInterval) {
      clearInterval(audioEl.fadeInterval);
    }
    const steps = 25;
    const stepTime = duration / steps;
    const volStep = (endVol - startVol) / steps;
    let currentStep = 0;

    audioEl.fadeInterval = setInterval(() => {
      currentStep++;
      let newVol = startVol + (volStep * currentStep);
      if (newVol < 0) newVol = 0;
      if (newVol > 1) newVol = 1;
      audioEl.volume = newVol;

      if (currentStep >= steps) {
        clearInterval(audioEl.fadeInterval);
        if (endVol === 0) {
          audioEl.pause();
        }
      }
    }, stepTime);
  },

  toggleSound() {
    this.soundOn = !this.soundOn;
    this.applySoundState();
    this.persist();
  },

  applySoundState() {
    this.bgmTracks.forEach(track => {
      track.muted = !this.soundOn;
    });
    this.updateSoundToggle();
  },

  updateSoundToggle() {
    const btn = document.getElementById("btn-sound-toggle");
    if (!btn) return;
    btn.textContent = this.soundOn ? "ВКЛ" : "ВЫКЛ";
    btn.classList.toggle("is-off", !this.soundOn);
  },

  fadeTransition(actionCallback) {
    const overlay = document.getElementById("fade-overlay");
    this.isBusy = true;
    if (!overlay) {
      actionCallback();
      this.isBusy = false;
      return;
    }
    overlay.classList.add("visible");
    setTimeout(() => {
      actionCallback();
      setTimeout(() => {
        overlay.classList.remove("visible");
        this.isBusy = false;
      }, 50);
    }, 350);
  },

  showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.toggle("active", screen.id === id);
    });
  },

  showStub(key) {
    const stub = GameData.stubs[key];
    if (!stub) return;
    document.getElementById("stub-title").textContent = stub.title;
    document.getElementById("stub-text").textContent = stub.text;
    document.getElementById("stub-flori-img").src = stub.sprite;
    this.showScreen("screen-stub");
  },

  backToMenu() {
    if (this.isBusy) return;
    this.fadeTransition(() => {
      this.showScreen("screen-menu");
    });
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("open");
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("open");
    if (id === "modal-settings") this.disarmReset();
  },

  showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2000);
  },

  showLocked() {
    this.showToast("Песочница откроется позже");
  },

  disarmReset() {
    if (this.resetTimeout) clearTimeout(this.resetTimeout);
    this.resetArmed = false;
    const btn = document.getElementById("btn-reset-progress");
    if (btn) btn.textContent = "СБРОСИТЬ ПРОГРЕСС";
  },

  resetProgress() {
    const btn = document.getElementById("btn-reset-progress");
    if (!this.resetArmed) {
      this.resetArmed = true;
      if (btn) btn.textContent = "НАЖМИ ЕЩЁ РАЗ";
      this.resetTimeout = setTimeout(() => this.disarmReset(), 3000);
      return;
    }
    this.disarmReset();
    this.save = { prologueDone: false, playerName: "" };
    this.playerName = "";
    this.currentTutorialStep = 0;
    this.maxVisitedStep = -1;
    const input = document.getElementById("player-name-input");
    if (input) input.value = "";
    this.persist();
    this.showToast("Прогресс сброшен");
  },

  confirmExit() {
    this.closeModal("modal-exit");
    window.close();
    setTimeout(() => {
      this.fadeTransition(() => {
        this.showStub("farewell");
      });
    }, 150);
  },

  onPlay() {
    if (this.isBusy) return;
    this.resumeAudio();
    if (!this.isMusicStarted) {
      this.startMusic();
    }
    if (this.save.prologueDone) {
      this.goToLevels();
    } else {
      this.goToTutorial();
    }
  },

  goToLevels() {
    this.fadeTransition(() => {
      this.showStub("levels");
    });
  },

  goToTutorial() {
    this.currentTutorialStep = 0;
    this.maxVisitedStep = -1;
    this.playerName = this.save.playerName;

    history.pushState({screen: "tutorial"}, "");

    this.fadeTransition(() => {
      this.showScreen("screen-tutorial");
      this.startTutorialStep();
    });
  },

  getAddress() {
    return this.playerName ? `Исследователь ${this.playerName}` : "Исследователь";
  },

  formatText(text) {
    return text.replace(/\{who\}/g, this.getAddress());
  },

  resolveStep(rawStep) {
    if (rawStep.type === "reaction") {
      return this.playerName ? rawStep.named : rawStep.anonymous;
    }
    return rawStep;
  },

  startTutorialStep() {
    const rawStep = GameData.prologue[this.currentTutorialStep];
    const step = this.resolveStep(rawStep);
    const imgEl = document.getElementById("tutorial-flori-img");
    const stageEl = document.getElementById("tutorial-stage");
    const boxEl = document.getElementById("dialogue-box");
    const btnEl = document.getElementById("btn-tutorial-next");
    const btnPrevEl = document.getElementById("btn-tutorial-prev");
    const lastIndex = GameData.prologue.length - 1;

    if (imgEl && imgEl.getAttribute("src") !== step.sprite) {
      imgEl.src = step.sprite;
      if (stageEl) {
        stageEl.classList.remove("pop");
        void stageEl.offsetWidth;
        stageEl.classList.add("pop");
      }
    }

    if (boxEl) {
      boxEl.classList.toggle("has-input", rawStep.type === "input");
    }

    if (btnPrevEl) {
      btnPrevEl.innerText = this.currentTutorialStep === 0 ? "В МЕНЮ" : "НАЗАД";
    }

    const dots = document.querySelectorAll("#step-indicator .step-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === this.currentTutorialStep);
    });

    if (btnEl) {
      btnEl.innerText = this.currentTutorialStep === lastIndex ? "В ЛАБОРАТОРИЮ!" : "ДАЛЬШЕ";
    }

    this.currentFullText = this.formatText(step.text);

    if (this.currentTutorialStep > this.maxVisitedStep) {
      this.maxVisitedStep = this.currentTutorialStep;
      this.typewriterEffect(this.currentFullText);
    } else {
      this.skipTypewriter();
    }
  },

  typewriterEffect(fullText) {
    const typedEl = document.getElementById("dialogue-typed");
    const pendingEl = document.getElementById("dialogue-pending");
    if (!typedEl || !pendingEl) return;

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    typedEl.textContent = "";
    pendingEl.textContent = fullText;
    this.isTyping = true;
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= fullText.length) {
        typedEl.textContent = fullText.slice(0, charIndex);
        pendingEl.textContent = fullText.slice(charIndex);
        if (charIndex > 0 && fullText[charIndex - 1] !== " ") {
          this.playVoiceBeep();
        }
        charIndex++;
        this.typewriterTimeout = setTimeout(typeChar, 35);
      } else {
        this.finishTyping();
      }
    };

    typeChar();
  },

  skipTypewriter() {
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
    const typedEl = document.getElementById("dialogue-typed");
    const pendingEl = document.getElementById("dialogue-pending");
    if (typedEl && pendingEl) {
      typedEl.textContent = this.currentFullText;
      pendingEl.textContent = "";
    }
    this.finishTyping();
  },

  finishTyping() {
    this.isTyping = false;
    if (this.currentTutorialStep === this.inputStepIndex && window.matchMedia("(hover: hover)").matches) {
      const input = document.getElementById("player-name-input");
      if (input) input.focus();
    }
  },

  commitName() {
    const input = document.getElementById("player-name-input");
    if (!input) return;
    const cleaned = input.value.replace(/\s+/g, " ").trim();
    if (cleaned !== this.playerName) {
      this.playerName = cleaned;
      this.maxVisitedStep = Math.min(this.maxVisitedStep, this.inputStepIndex);
    }
  },

  onScreenTap() {
    if (this.isBusy) return;
    if (this.isTyping) {
      this.skipTypewriter();
      return;
    }
    if (this.currentTutorialStep === this.inputStepIndex) return;
    this.advance();
  },

  advance() {
    if (this.isBusy) return;
    if (this.isTyping) {
      this.skipTypewriter();
      return;
    }
    const lastIndex = GameData.prologue.length - 1;
    if (this.currentTutorialStep === this.inputStepIndex) {
      this.commitName();
      const input = document.getElementById("player-name-input");
      if (input) input.blur();
    }
    if (this.currentTutorialStep < lastIndex) {
      this.currentTutorialStep++;
      this.startTutorialStep();
    } else {
      this.goToLab();
    }
  },

  goBack() {
    if (this.isBusy) return;
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
    this.isTyping = false;

    if (this.currentTutorialStep > 0) {
      this.currentTutorialStep--;
      this.startTutorialStep();
    } else {
      this.currentTutorialStep = 0;
      this.maxVisitedStep = -1;
      this.playerName = this.save.playerName;
      this.fadeTransition(() => {
        this.showScreen("screen-menu");
      });
    }
  },

  goToLab() {
    this.isBusy = true;
    this.save.prologueDone = true;
    this.save.playerName = this.playerName;
    this.persist();

    const stageEl = document.getElementById("tutorial-stage");
    if (stageEl) {
      stageEl.classList.remove("pop");
      stageEl.classList.add("flori-leave");
    }

    setTimeout(() => {
      this.fadeTransition(() => {
        if (stageEl) stageEl.classList.remove("flori-leave");
        this.showStub("lab");
      });
    }, 600);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
