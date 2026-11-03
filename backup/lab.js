const Lab = {
  labId: "home",
  selected: [],
  combo: null,
  verdictChoice: null,
  optionIndex: -1,
  pending: null,
  busy: false,
  fusionTimeout: null,
  linkTimeout: null,

  init() {
    this.buildShelf();
    this.updateSelection();
  },

  getItem(id) {
    return GameConfig.items.find(item => item.id === id);
  },

  flaskSvg(item) {
    const clipId = "fc-" + item.id;
    const body = "M40 22L40 44C14 54 8 80 16 96C24 110 76 110 84 96C92 80 86 54 60 44L60 22Z";
    return '<svg class="flask-svg" viewBox="0 0 100 124" aria-hidden="true">' +
      '<ellipse cx="50" cy="118" rx="36" ry="5" fill="rgba(0,0,0,0.12)"/>' +
      '<defs><clipPath id="' + clipId + '"><path d="' + body + '"/></clipPath></defs>' +
      '<rect x="0" y="76" width="100" height="50" fill="' + item.color + '" opacity="0.6" clip-path="url(#' + clipId + ')"/>' +
      '<path d="' + body + '" fill="rgba(210,238,255,0.38)" stroke="#6fb3d9" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M26 66C22 74 22 84 26 92" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>' +
      '<rect x="36" y="9" width="28" height="15" rx="4" fill="#c9985a" stroke="#8f6a36" stroke-width="2.5"/>' +
      '<g transform="translate(28 56) scale(0.69)">' + item.svg + '</g>' +
      '</svg>';
  },

  buildShelf() {
    const grid = document.getElementById("flask-grid");
    if (!grid) return;
    grid.innerHTML = "";
    GameConfig.items.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flask";
      btn.dataset.id = item.id;
      btn.setAttribute("aria-label", item.name);
      btn.innerHTML = this.flaskSvg(item) + '<span class="flask-name">' + item.name + '</span>';
      btn.addEventListener("click", () => this.onFlaskTap(item.id));
      grid.appendChild(btn);
    });
  },

  enter(labId) {
    this.labId = labId || "home";
    this.selected = [];
    this.busy = false;
    this.hideHint();
    this.closeTablet();
    this.updateSelection();
    this.refreshStars();
  },

  onLayoutChange() {
    const screen = document.getElementById("screen-lab");
    if (screen && screen.classList.contains("active")) {
      requestAnimationFrame(() => this.drawLink());
    }
  },

  refreshStars() {
    const earned = Progress.labStars(this.labId);
    document.querySelectorAll("#screen-lab .lab-star").forEach((star, i) => {
      star.classList.toggle("earned", i < earned);
    });
    const count = document.getElementById("lab-count");
    if (count) count.textContent = Progress.labChecked(this.labId) + " / " + GameConfig.hypothesesPerLab;
  },

  onFlaskTap(id) {
    if (this.busy || this.combo) return;
    const index = this.selected.indexOf(id);
    if (index >= 0) {
      this.selected.splice(index, 1);
    } else {
      if (this.selected.length >= 2) this.selected.shift();
      this.selected.push(id);
    }
    this.hideHint();
    this.updateSelection();
  },

  updateSelection() {
    document.querySelectorAll(".flask").forEach(flask => {
      flask.classList.toggle("is-selected", this.selected.includes(flask.dataset.id));
    });
    const btn = document.getElementById("btn-create");
    if (btn) btn.classList.toggle("is-disabled", this.selected.length < 2);
    this.drawLink();
    if (this.linkTimeout) clearTimeout(this.linkTimeout);
    this.linkTimeout = setTimeout(() => this.drawLink(), 200);
  },

  drawLink() {
    const layer = document.getElementById("link-layer");
    const area = document.getElementById("shelf-area");
    if (!layer || !area) return;
    layer.innerHTML = "";
    if (this.selected.length < 2) return;

    const areaRect = area.getBoundingClientRect();
    const points = this.selected.map(id => {
      const svg = document.querySelector('.flask[data-id="' + id + '"] .flask-svg');
      if (!svg) return null;
      const r = svg.getBoundingClientRect();
      return {
        x: r.left - areaRect.left + area.scrollLeft + r.width / 2,
        y: r.top - areaRect.top + area.scrollTop + r.height * 0.62
      };
    });
    if (!points[0] || !points[1]) return;

    const coords = 'x1="' + points[0].x + '" y1="' + points[0].y + '" x2="' + points[1].x + '" y2="' + points[1].y + '"';
    layer.innerHTML = '<line class="link-glow" ' + coords + '/><line class="link-core" ' + coords + '/>';
  },

  toggleHint() {
    const bubble = document.getElementById("hint-bubble");
    if (!bubble) return;
    if (bubble.classList.contains("is-open")) {
      this.hideHint();
      return;
    }
    if (this.selected.length < 2) {
      App.showToast("Выбери две колбы, и я подскажу");
      return;
    }
    const combo = App.getCombo(this.selected[0], this.selected[1]);
    bubble.textContent = combo && combo.hint ? combo.hint : "Для этой пары подсказки пока нет.";
    bubble.classList.add("is-open");
  },

  hideHint() {
    const bubble = document.getElementById("hint-bubble");
    if (bubble) bubble.classList.remove("is-open");
  },

  createHypothesis() {
    if (this.busy || this.combo) return;
    if (this.selected.length < 2) {
      App.showToast("Выбери две колбы");
      return;
    }
    const idA = this.selected[0];
    const idB = this.selected[1];
    const combo = App.getCombo(idA, idB);
    if (!combo) {
      App.showToast("Для этой пары гипотеза ещё готовится");
      return;
    }
    this.busy = true;
    this.hideHint();
    this.playFusion(idA, idB, () => {
      this.busy = false;
      this.openTablet(combo);
    });
  },

  playFusion(idA, idB, done) {
    const fusion = document.getElementById("fusion");
    const itemA = this.getItem(idA);
    const itemB = this.getItem(idB);
    if (!fusion || !itemA || !itemB) {
      done();
      return;
    }
    document.getElementById("fusion-left").innerHTML = this.flaskSvg(itemA);
    document.getElementById("fusion-right").innerHTML = this.flaskSvg(itemB);
    const orb = document.getElementById("fusion-orb");
    orb.style.setProperty("--ca", itemA.color);
    orb.style.setProperty("--cb", itemB.color);

    fusion.classList.remove("run");
    void fusion.offsetWidth;
    fusion.classList.add("run");

    if (this.fusionTimeout) clearTimeout(this.fusionTimeout);
    this.fusionTimeout = setTimeout(() => {
      fusion.classList.remove("run");
      done();
    }, 1900);
  },

  setView(view) {
    const body = document.getElementById("lab-body");
    if (body) body.dataset.view = view;
  },

  iconPath(combo) {
    const icon = combo.icon;
    if (icon) {
      return /[\/.]/.test(icon) ? icon : "assets/ico/" + icon + ".png";
    }
    return "assets/ico/ico" + ((combo.index || 0) + 1) + ".png";
  },

  openTablet(combo) {
    this.combo = combo;
    this.verdictChoice = null;
    this.optionIndex = -1;
    this.pending = null;

    const tablet = document.getElementById("tablet");
    tablet.dataset.state = "active";

    document.getElementById("hyp-title").textContent = combo.title || "";
    document.getElementById("hyp-text").textContent = combo.hypothesis || "";

    const img = document.getElementById("hyp-img");
    img.style.display = "";
    img.src = this.iconPath(combo);

    const checked = App.save.checked[this.labId];
    document.getElementById("chip-done").classList.toggle("is-hidden", !(checked && checked[combo.id]));

    const yes = document.getElementById("btn-yes");
    const no = document.getElementById("btn-no");
    [yes, no].forEach(btn => btn.classList.remove("is-chosen", "is-dimmed"));

    document.getElementById("explain").classList.remove("is-open");
    this.buildOptions();
    this.setCheckEnabled(false);

    this.setView("tablet");
    tablet.scrollTop = 0;
  },

  closeTablet() {
    this.combo = null;
    this.verdictChoice = null;
    this.optionIndex = -1;
    this.pending = null;
    const tablet = document.getElementById("tablet");
    if (tablet) tablet.dataset.state = "idle";
    const explain = document.getElementById("explain");
    if (explain) explain.classList.remove("is-open");
    this.setView("shelf");
  },

  buildOptions() {
    const grid = document.getElementById("options-grid");
    grid.innerHTML = "";
    const letters = ["А", "Б", "В", "Г"];
    const options = Array.isArray(this.combo.options) ? this.combo.options.slice(0, 4) : [];
    options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card";

      const badge = document.createElement("span");
      badge.className = "option-badge";
      badge.textContent = letters[i];

      const label = document.createElement("span");
      label.textContent = option.text || "";

      btn.appendChild(badge);
      btn.appendChild(label);
      btn.addEventListener("click", () => this.chooseOption(i));
      grid.appendChild(btn);
    });
  },

  setCheckEnabled(enabled) {
    const btn = document.getElementById("btn-check");
    if (btn) btn.classList.toggle("is-disabled", !enabled);
  },

  chooseVerdict(value) {
    if (!this.combo || this.verdictChoice !== null) return;
    this.verdictChoice = value;
    const yes = document.getElementById("btn-yes");
    const no = document.getElementById("btn-no");
    yes.classList.toggle("is-chosen", value === true);
    yes.classList.toggle("is-dimmed", value !== true);
    no.classList.toggle("is-chosen", value === false);
    no.classList.toggle("is-dimmed", value !== false);

    const explain = document.getElementById("explain");
    explain.classList.add("is-open");
    setTimeout(() => {
      explain.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
  },

  chooseOption(index) {
    if (!this.combo || this.pending) return;
    this.optionIndex = index;
    document.querySelectorAll("#options-grid .option-card").forEach((card, i) => {
      card.classList.toggle("is-selected", i === index);
    });
    this.setCheckEnabled(true);
  },

  findReaction(option, index) {
    const reactions = this.combo.reactions || {};
    const ids = [option.id, ["A", "B", "C", "D"][index], ["А", "Б", "В", "Г"][index]].filter(id => id !== undefined);
    for (let i = 0; i < ids.length; i++) {
      const key = this.verdictChoice + "_" + ids[i];
      if (reactions[key] !== undefined) {
        const value = reactions[key];
        return typeof value === "string" ? { text: value } : value;
      }
    }
    return null;
  },

  checkAnswer() {
    if (!this.combo || this.pending) return;
    if (this.verdictChoice === null) {
      App.showToast("Сначала выбери вердикт");
      return;
    }
    if (this.optionIndex < 0) {
      App.showToast("Выбери объяснение");
      return;
    }

    const options = this.combo.options || [];
    const option = options[this.optionIndex] || {};
    const verdictOk = this.combo.verdict === this.verdictChoice;
    const optionOk = option.correct === true;
    const solved = verdictOk && optionOk;

    const checked = App.save.checked[this.labId];
    const alreadyChecked = !!(checked && checked[this.combo.id]);
    const countAfter = Progress.labChecked(this.labId) + (solved && !alreadyChecked ? 1 : 0);
    const starsAfter = GameConfig.starThresholds.filter(limit => countAfter >= limit).length;
    const starGain = starsAfter > Progress.labStars(this.labId);

    this.pending = { solved, verdictOk, optionOk, starGain, alreadyChecked };

    const reaction = this.findReaction(option, this.optionIndex) || {};
    let text = reaction.text;
    if (!text) {
      if (solved) text = "Отлично! Ты верно определил и объяснил.";
      else if (verdictOk) text = "Вердикт верный, но объяснение стоит ещё обдумать.";
      else if (optionOk) text = "Рассуждал ты хорошо, но вердикт подвёл.";
      else text = "Давай ещё раз присмотримся к этой идее позже.";
    }
    let emotion = reaction.emotion;
    if (!emotion) {
      emotion = solved ? "win" : (verdictOk || optionOk ? "talk" : "think");
    }

    this.showFeedback(text, emotion);
  },

  showFeedback(text, emotion) {
    const img = document.getElementById("feedback-img");
    img.src = "assets/flori/flori_" + emotion + ".png";
    document.getElementById("feedback-text").textContent = text;

    const tags = document.getElementById("feedback-tags");
    tags.innerHTML = "";
    if (this.pending.solved) {
      const tag = document.createElement("span");
      tag.className = "feedback-tag";
      tag.textContent = this.pending.alreadyChecked ? "Уже засчитано ранее" : "Комбинация проверена!";
      tags.appendChild(tag);
      if (this.pending.starGain) {
        const star = document.createElement("span");
        star.className = "feedback-tag star";
        star.textContent = "Новая звезда!";
        tags.appendChild(star);
      }
    }

    const hasFact = !!(this.combo.fact && (this.combo.fact.text || this.combo.fact.title));
    document.getElementById("btn-fact").classList.toggle("is-hidden", !hasFact);

    App.openModal("modal-feedback");
  },

  openFact() {
    const fact = this.combo && this.combo.fact;
    if (!fact) return;
    document.getElementById("fact-title").textContent = fact.title || "";
    document.getElementById("fact-text").textContent = fact.text || "";

    const img = document.getElementById("fact-img");
    if (fact.image) {
      img.style.display = "";
      img.src = fact.image;
    } else {
      img.style.display = "none";
    }

    const sources = document.getElementById("fact-sources");
    sources.innerHTML = "";
    const list = Array.isArray(fact.sources) ? fact.sources : (fact.sources ? [fact.sources] : []);
    if (list.length) {
      sources.appendChild(document.createTextNode("Источники: "));
      list.forEach((source, i) => {
        const title = typeof source === "string" ? source : (source.title || source.url || "");
        const url = typeof source === "string" ? source : source.url;
        if (url && /^https?:/i.test(url)) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = title;
          sources.appendChild(link);
        } else {
          sources.appendChild(document.createTextNode(title));
        }
        if (i < list.length - 1) sources.appendChild(document.createTextNode("; "));
      });
    }

    App.openModal("modal-fact");
  },

  closeFact() {
    App.closeModal("modal-fact");
  },

  nextAfterFeedback() {
    App.closeModal("modal-feedback");
    App.closeModal("modal-fact");
    const result = this.pending;
    const combo = this.combo;
    this.pending = null;

    if (result && result.solved && combo) {
      App.markChecked(this.labId, combo.id);
      if (result.starGain) App.showToast("Получена новая звезда!");
    }

    this.selected = [];
    this.hideHint();
    this.closeTablet();
    this.updateSelection();
  },

  onBack() {
    if (this.busy) return;
    if (this.combo && document.body.dataset.split !== "on") {
      this.closeTablet();
      this.updateSelection();
      return;
    }
    App.goToLevels();
  }
};
