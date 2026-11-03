const Progress = {
  labChecked(labId) {
    const map = App.save.checked[labId];
    return map ? Object.keys(map).length : 0;
  },

  labStars(labId) {
    const count = this.labChecked(labId);
    return GameConfig.starThresholds.filter(limit => count >= limit).length;
  },

  totalStars() {
    return GameConfig.labs.reduce((sum, lab) => sum + this.labStars(lab.id), 0);
  },

  maxStars() {
    return GameConfig.labs.length * GameConfig.starThresholds.length;
  },

  availableLabs() {
    return GameConfig.labs.filter(lab => lab.available);
  },

  totalHypotheses() {
    return this.availableLabs().length * GameConfig.hypothesesPerLab;
  },

  realPercent() {
    const total = this.totalHypotheses();
    if (!total) return 0;
    const done = this.availableLabs().reduce((sum, lab) => sum + this.labChecked(lab.id), 0);
    return Math.min(100, (done / total) * 100);
  },

  effectivePercent() {
    if (App.save.demo.active) {
      return Math.max(0, Math.min(100, Number(App.save.demo.percent) || 0));
    }
    return this.realPercent();
  },

  canSubmit() {
    return this.effectivePercent() >= GameConfig.finalThreshold;
  }
};

const Levels = {
  lockArt() {
    return '<svg class="level-lock-art" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g fill="none" stroke-linecap="round">' +
      '<line x1="6" y1="6" x2="94" y2="94" stroke="#6d776a" stroke-width="9" stroke-dasharray="9 6"/>' +
      '<line x1="6" y1="6" x2="94" y2="94" stroke="#bcc5b6" stroke-width="4" stroke-dasharray="9 6"/>' +
      '<line x1="94" y1="6" x2="6" y2="94" stroke="#6d776a" stroke-width="9" stroke-dasharray="9 6"/>' +
      '<line x1="94" y1="6" x2="6" y2="94" stroke="#bcc5b6" stroke-width="4" stroke-dasharray="9 6"/>' +
      '</g>' +
      '<g transform="translate(50 52)">' +
      '<path d="M-9 -4v-7a9 9 0 0 1 18 0v7" stroke="#8a6d1f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<rect x="-14" y="-5" width="28" height="22" rx="5" fill="#f2c94c" stroke="#8a6d1f" stroke-width="3"/>' +
      '<circle cx="0" cy="5" r="3" fill="#8a6d1f"/><rect x="-1.5" y="6" width="3" height="6" fill="#8a6d1f"/>' +
      '</g></svg>';
  },

  houseArt() {
    return '<svg class="level-deco" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M8 32L32 10l24 22z" fill="#e5484d" stroke="#a02226" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="14" y="31" width="36" height="24" rx="3" fill="#fff4e0" stroke="#7a4a22" stroke-width="3"/>' +
      '<rect x="27" y="40" width="10" height="15" rx="2" fill="#b8733a"/>' +
      '<rect x="17" y="36" width="7" height="7" rx="1.5" fill="#bfe9f0" stroke="#7a4a22" stroke-width="1.5"/>' +
      '<rect x="40" y="36" width="7" height="7" rx="1.5" fill="#bfe9f0" stroke="#7a4a22" stroke-width="1.5"/>' +
      '</svg>';
  },

  starsMarkup(count) {
    let html = "";
    for (let i = 0; i < GameConfig.starThresholds.length; i++) {
      html += '<svg class="star-icon' + (i < count ? ' earned' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    return html;
  },

  render() {
    const grid = document.getElementById("levels-grid");
    if (!grid) return;
    grid.innerHTML = "";

    GameConfig.labs.forEach((lab, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.lab = lab.id;
      card.title = lab.title;
      card.className = "level-card " + (lab.available ? "is-open" : "is-locked");

      let html = '<span class="level-num">' + (index + 1) + '</span>';
      if (lab.available) {
        html += this.houseArt();
        html += '<span class="level-name">' + lab.title + '</span>';
        html += '<span class="level-stars">' + this.starsMarkup(Progress.labStars(lab.id)) + '</span>';
      } else {
        html += this.lockArt();
      }
      card.innerHTML = html;

      card.addEventListener("click", () => {
        if (lab.available) {
          App.openLab(lab.id);
        } else {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          App.showToast("Эта лаборатория пока закрыта");
        }
      });

      grid.appendChild(card);
    });
  }
};

const App = {
  playerName: "",
  currentTutorialStep: 0,
  maxVisitedStep: -1,
  inputStepIndex: -1,
  isTyping: false,
  isBusy: false,
  typewriterTimeout: null,
  currentFullText: "",

  save: { prologueDone: false, playerName: "", checked: {}, demo: { active: false, percent: 0 } },
  saveKey: "florika_save_v2",
  soundOn: true,
  devUnlocked: false,
  resetArmed: false,
  resetTimeout: null,
  toastTimeout: null,

  combos: [],
  comboMap: {},

  audioCtx: null,
  voiceBuffer: null,
  preloadedImages: [],
  bgmTracks: [],
  isMusicStarted: false,
  bgmVolume: 0.03,

  init() {
    this.loadSave();
    this.updateLayout();
    this.inputStepIndex = GameData.prologue.findIndex(step => step.type === "input");
    this.buildStepDots();
    this.preloadSprites();
    this.loadVoiceAudio();
    this.setupInteractionUnlock();
    this.setupNameInput();
    this.setupDevInputs();
    this.runStudioIntro();
    this.loadCombos();
    Levels.render();
    this.refreshProgressUI();
    if (typeof Lab !== "undefined") Lab.init();

    window.addEventListener("resize", () => {
      this.updateLayout();
    });

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
        this.closeModal("modal-fact");
      }
    });
  },

  updateLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const split = w >= 900 && h >= 540 && w >= h;
    const wide = split || (w >= 640 && w / h >= 1.4);
    const body = document.body;
    body.dataset.layout = wide ? "wide" : "compact";
    body.dataset.split = split ? "on" : "off";
    body.dataset.short = h < 560 && w > h ? "yes" : "no";
    if (typeof Lab !== "undefined" && Lab.onLayoutChange) Lab.onLayoutChange();
  },

  defaultSave() {
    return { prologueDone: false, playerName: "", checked: {}, demo: { active: false, percent: 0 } };
  },

  loadSave() {
    this.save = this.defaultSave();
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.save.prologueDone = data.prologueDone === true;
        this.save.playerName = typeof data.playerName === "string" ? data.playerName : "";
        this.save.checked = data.checked && typeof data.checked === "object" ? data.checked : {};
        if (data.demo && typeof data.demo === "object") {
          this.save.demo.active = data.demo.active === true;
          this.save.demo.percent = Math.max(0, Math.min(100, Number(data.demo.percent) || 0));
        }
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
        checked: this.save.checked,
        demo: this.save.demo,
        soundOn: this.soundOn
      }));
    } catch (e) {}
  },

  loadCombos() {
    fetch("data/combo.json")
      .then(response => response.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.combos) ? data.combos : []);
        this.combos = list.filter(item => item && item.id);
        this.comboMap = {};
        this.combos.forEach((combo, index) => {
          combo.index = index;
          this.comboMap[combo.id] = combo;
        });
      })
      .catch(() => {
        this.combos = [];
        this.comboMap = {};
      });
  },

  getCombo(idA, idB) {
    return this.comboMap[[idA, idB].sort().join("_")] || null;
  },

  markChecked(labId, comboId) {
    if (!this.save.checked[labId]) this.save.checked[labId] = {};
    this.save.checked[labId][comboId] = true;
    this.persist();
    this.refreshProgressUI();
  },

  dullGreen(percent) {
    const t = Math.max(0, Math.min(1, percent / GameConfig.finalThreshold));
    const from = [158, 166, 152];
    const to = [110, 200, 70];
    const c = from.map((v, i) => Math.round(v + (to[i] - v) * t));
    return "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")";
  },

  refreshProgressUI() {
    const percent = Progress.effectivePercent();
    const gold = percent >= 100;
    const lit = percent >= GameConfig.finalThreshold && !gold;

    document.querySelectorAll(".mailia-bar").forEach(bar => {
      const fill = bar.querySelector(".mailia-fill");
      const text = bar.querySelector(".mailia-percent");
      if (fill) {
        fill.style.width = percent + "%";
        fill.style.backgroundColor = (gold || lit) ? "" : this.dullGreen(percent);
      }
      if (text) text.textContent = Math.round(percent) + "%";
      bar.classList.toggle("is-gold", gold);
      bar.classList.toggle("is-lit", lit);
      bar.classList.toggle("is-demo", this.save.demo.active);
    });

    const starsEl = document.getElementById("levels-stars");
    if (starsEl) starsEl.textContent = Progress.totalStars() + " / " + Progress.maxStars();

    const finale = document.getElementById("btn-finale");
    if (finale) {
      finale.classList.toggle("is-disabled", !Progress.canSubmit());
      finale.classList.toggle("is-ready", lit);
      finale.classList.toggle("is-gold", gold);
    }

    Levels.render();
    if (typeof Lab !== "undefined" && Lab.refreshStars) Lab.refreshStars();
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

  setupDevInputs() {
    const code = document.getElementById("dev-code-input");
    if (code) {
      code.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyDevCode();
        }
      });
    }
    const range = document.getElementById("demo-range");
    if (range) {
      range.addEventListener("input", (e) => {
        this.setDemoPercent(e.target.value);
      });
    }
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
    ["talk", "win", "think"].forEach(name => list.push("assets/flori/flori_" + name + ".png"));
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
    }, 2200);
  },

  showLocked() {
    this.showToast("Песочница откроется позже");
  },

  openSettings() {
    this.syncSettingsUI();
    this.openModal("modal-settings");
  },

  syncSettingsUI() {
    this.updateSoundToggle();

    const codeRow = document.getElementById("dev-code-row");
    const panel = document.getElementById("dev-panel");
    if (codeRow) codeRow.classList.toggle("is-hidden", this.devUnlocked);
    if (panel) panel.classList.toggle("is-hidden", !this.devUnlocked);

    const toggle = document.getElementById("btn-demo-toggle");
    if (toggle) {
      toggle.textContent = this.save.demo.active ? "ВКЛ" : "ВЫКЛ";
      toggle.classList.toggle("is-off", !this.save.demo.active);
    }
    const range = document.getElementById("demo-range");
    if (range) range.value = this.save.demo.percent;
    const value = document.getElementById("demo-value");
    if (value) value.textContent = Math.round(this.save.demo.percent) + "%";
  },

  applyDevCode() {
    const input = document.getElementById("dev-code-input");
    if (!input) return;
    const code = input.value.trim();
    input.value = "";
    if (code === GameConfig.devCode) {
      this.devUnlocked = true;
      if (!this.save.demo.active) {
        this.save.demo.active = true;
        this.save.demo.percent = Math.round(Progress.realPercent());
      }
      this.persist();
      this.syncSettingsUI();
      this.refreshProgressUI();
      this.showToast("Демо-режим включён");
    } else {
      this.showToast("Неверный код");
    }
  },

  setDemoPercent(value) {
    this.save.demo.percent = Math.max(0, Math.min(100, Number(value) || 0));
    this.save.demo.active = true;
    this.persist();
    this.syncSettingsUI();
    this.refreshProgressUI();
  },

  toggleDemo() {
    this.save.demo.active = !this.save.demo.active;
    this.persist();
    this.syncSettingsUI();
    this.refreshProgressUI();
  },

  replayPrologue() {
    if (this.isBusy) return;
    this.closeModal("modal-settings");
    this.save.prologueDone = false;
    this.persist();
    this.goToTutorial();
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
    this.save = this.defaultSave();
    this.devUnlocked = false;
    this.playerName = "";
    this.currentTutorialStep = 0;
    this.maxVisitedStep = -1;
    const input = document.getElementById("player-name-input");
    if (input) input.value = "";
    this.persist();
    this.syncSettingsUI();
    this.refreshProgressUI();
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
      Levels.render();
      this.refreshProgressUI();
      this.showScreen("screen-levels");
    });
  },

  openLab(labId) {
    if (this.isBusy) return;
    this.fadeTransition(() => {
      this.showScreen("screen-lab");
      if (typeof Lab !== "undefined") Lab.enter(labId);
    });
  },

  onFinale() {
    if (this.isBusy) return;
    if (!Progress.canSubmit()) {
      this.showToast("Нужно восстановить Мэйлию хотя бы на " + GameConfig.finalThreshold + "%");
      return;
    }
    this.fadeTransition(() => {
      this.showStub("finale");
    });
  },

  goToTutorial() {
    this.currentTutorialStep = 0;
    this.maxVisitedStep = -1;
    this.playerName = this.save.playerName;
    const input = document.getElementById("player-name-input");
    if (input) input.value = this.save.playerName;

    history.pushState({screen: "tutorial"}, "");

    this.fadeTransition(() => {
      this.showScreen("screen-tutorial");
      this.startTutorialStep();
    });
  },

  getAddress() {
    return this.playerName ? "Исследователь " + this.playerName : "Исследователь";
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
        this.showScreen("screen-lab");
        if (typeof Lab !== "undefined") Lab.enter("home");
      });
    }, 600);
  }
};

App.updateLayout();

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
