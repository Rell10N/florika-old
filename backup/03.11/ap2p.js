const App = {
  playerName: "Исследователь",
  currentTutorialStep: 0,
  maxVisitedStep: -1,
  isTyping: false,
  typewriterTimeout: null,
  currentFullText: "",

  audioCtx: null,
  voiceBuffer: null,
  preloadedImages: [],
  bgmTracks: [],
  isMusicStarted: false,
  bgmVolume: 0.03,

  tutorialSteps: [
    {
      sprite: "assets/flori/flori_glitch.png",
      scale: 1,
      getText: () => "Беда! Ночью в лабораторию ударила гроза. Наша главная система Мэйлия обрабатывала важные данные и получила сильный сбой! Теперь она путает реальность с выдумками."
    },
    {
      sprite: "assets/flori/flori_hello.png",
      scale: 1,
      getText: (name) => `О, привет, ${name}, ты вовремя! Система включила аварийную защиту: роботам строго запрещено лезть в систему. Только настоящий человек со здравым смыслом может спасти Мэйлию.`
    },
    {
      sprite: "assets/flori/flori_panic.png",
      scale: 1,
      getText: () => "Если мы не исправим её логику, память Мэйлии заблокируется навсегда, а лабораторию закроют. Нам нужно проверить все её выводы и отделить логичное от нелогичного."
    },
    {
      sprite: "assets/flori/flori_guide.png",
      scale: 1,
      getText: () => "Я буду летать рядом, помогать подсказками и объяснять. Пойдём в лабораторию, я покажу, как всё устроено."
    }
  ],

  init() {
    this.preloadSprites();
    this.loadVoiceAudio();
    this.setupInteractionUnlock();
    
    window.addEventListener('popstate', (e) => {
      const tutorialActive = document.getElementById("screen-tutorial").classList.contains("active");
      if (tutorialActive) {
        this.handleDialoguePrev();
      }
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

  preloadSprites() {
    this.tutorialSteps.forEach(step => {
      const img = new Image();
      img.src = step.sprite;
      this.preloadedImages.push(img);
    });
  },

  loadVoiceAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    fetch("assets/audio/voice.mp3")
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioCtx.decodeAudioData(arrayBuffer))
      .then(decodedBuffer => {
        this.voiceBuffer = decodedBuffer;
      })
      .catch(() => {});
  },

  playVoiceBeep() {
    if (!this.audioCtx || !this.voiceBuffer) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

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

  fadeTransition(actionCallback) {
    const overlay = document.getElementById("fade-overlay");
    if (!overlay) {
      actionCallback();
      return;
    }
    overlay.classList.add("visible");
    setTimeout(() => {
      actionCallback();
      setTimeout(() => {
        overlay.classList.remove("visible");
      }, 50);
    }, 350);
  },

 goToTutorial() {
    const input = document.getElementById("player-name-input");
    if (input && input.value.trim().length > 0) {
      this.playerName = input.value.trim();
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    if (!this.isMusicStarted) {
      this.startMusic();
    }

    history.pushState({screen: 'tutorial'}, '');

    this.fadeTransition(() => {
      document.getElementById("screen-menu").classList.remove("active");
      document.getElementById("screen-tutorial").classList.add("active");
      this.currentTutorialStep = 0;
      this.startTutorialStep();
    });
  },

  startTutorialStep() {
    const step = this.tutorialSteps[this.currentTutorialStep];
    const imgEl = document.getElementById("tutorial-flori-img");
    const stageEl = document.querySelector(".tutorial-stage");
    const btnEl = document.getElementById("btn-tutorial-next");
    const btnPrevEl = document.getElementById("btn-tutorial-prev");

    if (imgEl) {
      imgEl.src = step.sprite;
    }

    if (stageEl) {
      stageEl.style.transform = `scale(${step.scale})`;
    }

    if (btnPrevEl) {
      btnPrevEl.innerText = this.currentTutorialStep === 0 ? "В МЕНЮ" : "НАЗАД";
    }

    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        dot.classList.toggle("active", i === this.currentTutorialStep);
      }
    }

    if (btnEl) {
      btnEl.innerText = this.currentTutorialStep === 3 ? "В ЛАБОРАТОРИЮ!" : "ДАЛЬШЕ";
    }

    this.currentFullText = step.getText(this.playerName);

    if (this.currentTutorialStep > this.maxVisitedStep) {
      this.maxVisitedStep = this.currentTutorialStep;
      this.typewriterEffect(this.currentFullText);
    } else {
      this.skipTypewriter();
    }
  },

  typewriterEffect(fullText) {
    const textEl = document.getElementById("dialogue-text");
    if (!textEl) return;

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    textEl.textContent = "";
    this.isTyping = true;
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= fullText.length) {
        textEl.textContent = fullText.slice(0, charIndex);
        if (charIndex > 0 && fullText[charIndex - 1] !== " ") {
          this.playVoiceBeep();
        }
        charIndex++;
        this.typewriterTimeout = setTimeout(typeChar, 35);
      } else {
        this.isTyping = false;
      }
    };

    typeChar();
  },

  skipTypewriter() {
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
    const textEl = document.getElementById("dialogue-text");
    if (textEl) {
      textEl.textContent = this.currentFullText;
    }
    this.isTyping = false;
  },

  handleDialogueClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (this.isTyping) {
      this.skipTypewriter();
    } else {
      if (this.currentTutorialStep < 3) {
        this.currentTutorialStep++;
        this.startTutorialStep();
      } else {
        this.goToLab();
      }
    }
  },

  handleDialoguePrev(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
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
      this.fadeTransition(() => {
        document.getElementById("screen-tutorial").classList.remove("active");
        document.getElementById("screen-menu").classList.add("active");
      });
    }
  },


  goToLab() {
    this.fadeTransition(() => {
      alert(`Сюжетный пролог завершён! ${this.playerName} готов войти в лабораторию.`);
    });
  }
};

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});