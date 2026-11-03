const Lab = {
  labId: "home",
  selected: [],
  combo: null,
  verdictChoice: null,
  optionIndex: -1,
  pending: null,
  busy: false,
  hintUsed: false,
  fusionTimeout: null,
  linkTimeout: null,

  shapes: {
    round: {
      d: "M41 18V40C20 44 14 62 16 78C18 98 34 109 50 109C66 109 82 98 84 78C86 62 80 44 59 40V18Z",
      neck: [41, 59], ax: 50, ay: 76, scale: 0.62, level: 64,
      glint: "M24 64C22 72 24 82 30 90"
    },
    tri: {
      d: "M42 18V46L16 100C13 107 18 109 24 109H76C82 109 87 107 84 100L58 46V18Z",
      neck: [42, 58], ax: 50, ay: 88, scale: 0.5, level: 76,
      glint: "M36 58L26 88"
    },
    jar: {
      d: "M36 22V38C18 40 12 50 12 66V92C12 104 20 109 30 109H70C80 109 88 104 88 92V66C88 50 82 40 64 38V22Z",
      neck: [36, 64], ax: 50, ay: 78, scale: 0.7, level: 66,
      glint: "M21 60C19 68 19 78 21 86"
    },
    tall: {
      d: "M42 16V36C26 40 22 56 22 72C22 96 34 109 50 109C66 109 78 96 78 72C78 56 74 40 58 36V16Z",
      neck: [42, 58], ax: 50, ay: 76, scale: 0.6, level: 60,
      glint: "M31 58C28 66 28 78 31 88"
    }
  },

  icons: {
    win: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    partial: '<path d="M12 6.5v7M12 17.5v.5"/>',
    fail: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
    yes: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    no: '<path d="M6 6l12 12M18 6L6 18"/>'
  },

  init() {
    this.buildShelf();
    this.updateSelection();
  },

  getItem(id) {
    return GameConfig.items.find(item => item.id === id);
  },

  flaskSvg(item) {
    const shape = this.shapes[item.shape] || this.shapes.round;
    const clipId = "fc-" + item.id;
    const level = shape.level;
    const neckWidth = shape.neck[1] - shape.neck[0];
    const corkX = shape.neck[0] - 2;
    const corkWidth = neckWidth + 4;
    const half = 32 * shape.scale;
    const disc = half + 3;
    const wave = "M-4 " + level + "Q8 " + (level - 5) + " 20 " + level + "T44 " + level + "T68 " + level + "T92 " + level + "T116 " + level + "V120H-4Z";
    const wave2 = "M-4 " + (level + 4) + "Q10 " + (level - 1) + " 24 " + (level + 4) + "T50 " + (level + 4) + "T76 " + (level + 4) + "T104 " + (level + 4) + "V120H-4Z";

    return '<svg class="flask-svg" viewBox="0 0 100 112" aria-hidden="true">' +
      '<defs><clipPath id="' + clipId + '"><path d="' + shape.d + '"/></clipPath></defs>' +
      '<path d="' + shape.d + '" fill="#e3f5ff"/>' +
      '<g clip-path="url(#' + clipId + ')">' +
      '<path d="' + wave2 + '" fill="' + item.color + '" opacity="0.45"/>' +
      '<path d="' + wave + '" fill="' + item.color + '" opacity="0.8"/>' +
      '<circle cx="' + (shape.ax - 20) + '" cy="' + (level + 18) + '" r="2.6" fill="#ffffff" opacity="0.6"/>' +
      '<circle cx="' + (shape.ax + 18) + '" cy="' + (level + 10) + '" r="1.8" fill="#ffffff" opacity="0.6"/>' +
      '<circle cx="' + shape.ax + '" cy="' + shape.ay + '" r="' + disc + '" fill="#ffffff" opacity="0.94"/>' +
      '<g transform="translate(' + (shape.ax - half) + ' ' + (shape.ay - half) + ') scale(' + shape.scale + ')">' + item.svg + '</g>' +
      '</g>' +
      '<path d="' + shape.glint + '" stroke="#ffffff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="0.85"/>' +
      '<path d="' + shape.d + '" fill="none" stroke="#1f3d63" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<rect x="' + (corkX - 1) + '" y="14" width="' + (corkWidth + 2) + '" height="6" rx="3" fill="#bfe7fb" stroke="#1f3d63" stroke-width="2.4"/>' +
      '<rect x="' + corkX + '" y="4" width="' + corkWidth + '" height="14" rx="4" fill="#e8a24a" stroke="#1f3d63" stroke-width="2.6"/>' +
      '<path d="M' + (corkX + 4) + ' 9H' + (corkX + corkWidth - 4) + '" stroke="#fff1cf" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
      '</svg>';
  },

  buildShelf() {
    const grid = document.getElementById("flask-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const half = Math.ceil(GameConfig.items.length / 2);
    [GameConfig.items.slice(0, half), GameConfig.items.slice(half)].forEach(list => {
      const row = document.createElement("div");
      row.className = "shelf-row";
      list.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "flask";
        btn.dataset.id = item.id;
        btn.dataset.sfx = "none";
        btn.setAttribute("aria-label", item.name);
        btn.innerHTML = '<span class="flask-shadow"></span>' +
          '<span class="flask-lift">' + this.flaskSvg(item) + '</span>' +
          '<span class="flask-name">' + item.name + '</span>';
        btn.addEventListener("click", () => this.onFlaskTap(item.id));
        row.appendChild(btn);
      });
      grid.appendChild(row);
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
      App.playSfx("flask_drop");
    } else {
      if (this.selected.length >= 2) this.selected.shift();
      this.selected.push(id);
      App.playSfx("flask_pick");
      if (this.selected.length === 2) App.playSfx("link", { delay: 0.1 });
    }
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
    this.linkTimeout = setTimeout(() => this.drawLink(), 240);
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
        x: r.left - areaRect.left + r.width / 2,
        y: r.top - areaRect.top + r.height * 0.62
      };
    });
    if (!points[0] || !points[1]) return;

    const coords = 'x1="' + points[0].x + '" y1="' + points[0].y + '" x2="' + points[1].x + '" y2="' + points[1].y + '"';
    layer.innerHTML = '<line class="link-glow" ' + coords + '/><line class="link-core" ' + coords + '/>';
  },

  toggleHint() {
    const bubble = document.getElementById("hint-bubble");
    const btn = document.getElementById("btn-hint");
    if (!bubble || !this.combo) return;
    if (bubble.classList.contains("is-open")) {
      this.hideHint();
      App.playSfx("button");
      return;
    }
    bubble.textContent = this.combo.hint ? this.combo.hint : "Для этой пары подсказки пока нет.";
    bubble.classList.add("is-open");
    if (btn) btn.classList.add("is-active");
    App.playSfx("hint");
    if (!this.hintUsed) {
      this.hintUsed = true;
      App.recordHint(this.labId);
    }
    setTimeout(() => {
      bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  },

  hideHint() {
    const bubble = document.getElementById("hint-bubble");
    const btn = document.getElementById("btn-hint");
    if (bubble) bubble.classList.remove("is-open");
    if (btn) btn.classList.remove("is-active");
  },

  createHypothesis() {
    if (this.busy || this.combo) return;
    if (this.selected.length < 2) {
      App.playSfx("locked");
      App.showToast("Выбери две колбы");
      return;
    }
    const idA = this.selected[0];
    const idB = this.selected[1];
    const combo = App.getCombo(idA, idB);
    if (!combo) {
      App.playSfx("locked");
      App.showToast("Для этой пары гипотеза ещё готовится");
      return;
    }
    this.busy = true;
    this.hideHint();
    App.playSfx("create", { jitter: false });
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

  comboItems(combo) {
    return String(combo.id || "").split("_").map(id => this.getItem(id)).filter(Boolean);
  },

  pairMarkup(combo) {
    return this.comboItems(combo).map(item => {
      return '<div class="pair-item"><svg viewBox="0 0 64 64" aria-hidden="true">' + item.svg + '</svg></div>';
    }).join('<span class="pair-plus">+</span>');
  },

  openTablet(combo) {
    this.combo = combo;
    this.verdictChoice = null;
    this.optionIndex = -1;
    this.pending = null;
    this.hintUsed = false;
    this.hideHint();

    const tablet = document.getElementById("tablet");
    tablet.dataset.state = "active";

    document.getElementById("hyp-title").textContent = combo.title || "";
    document.getElementById("hyp-text").textContent = combo.hypothesis || "";

    const icon = document.getElementById("hyp-icon");
    let pair = icon.querySelector(".hyp-pair");
    if (!pair) {
      pair = document.createElement("div");
      pair.className = "hyp-pair";
      icon.insertBefore(pair, icon.firstChild);
    }
    pair.innerHTML = this.pairMarkup(combo);
    pair.style.visibility = "";

    const img = document.getElementById("hyp-img");
    img.style.display = "";
    img.onload = () => {
      pair.style.visibility = "hidden";
    };
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
    App.playSfx("tablet_open", { jitter: false });
  },

  closeTablet() {
    this.combo = null;
    this.verdictChoice = null;
    this.optionIndex = -1;
    this.pending = null;
    this.hintUsed = false;
    this.hideHint();
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
      btn.dataset.sfx = "none";

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
    App.playSfx("verdict", { rate: value ? 1.12 : 0.88 });
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
    App.playSfx("option", { rate: 0.94 + index * 0.05 });
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
      App.playSfx("locked");
      App.showToast("Сначала выбери вердикт");
      return;
    }
    if (this.optionIndex < 0) {
      App.playSfx("locked");
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
    const starsBefore = Progress.labStars(this.labId);
    App.recordAttempt(this.labId, this.combo.id, { solved });
    const starGain = Progress.labStars(this.labId) > starsBefore;

    this.pending = { solved, verdictOk, optionOk, starGain, alreadyChecked };

    const reaction = this.findReaction(option, this.optionIndex) || {};
    let text = reaction.text;
    if (!text) {
      if (solved) text = "Отлично! Ты верно определил и объяснил.";
      else if (verdictOk) text = "Вердикт верный, но объяснение стоит ещё обдумать.";
      else if (optionOk) text = "Рассуждал ты хорошо, но вердикт подвёл.";
      else text = "Давай ещё раз присмотримся к этой идее позже.";
    }
    const tone = solved ? "win" : (verdictOk || optionOk ? "partial" : "fail");
    const emotion = reaction.emotion || { win: "win", partial: "talk", fail: "think" }[tone];

    this.showFeedback(text, emotion, tone);
  },

  svgIcon(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  },

  markMarkup(label, ok) {
    return '<span class="mark' + (ok ? '' : ' bad') + '">' + this.svgIcon(ok ? this.icons.yes : this.icons.no) + label + '</span>';
  },

  showFeedback(text, emotion, tone) {
    const pending = this.pending;
    const titles = { win: "Проверено!", partial: "Почти получилось!", fail: "Давай разберёмся" };

    document.getElementById("feedback-img").src = "assets/flori/flori_" + emotion + ".png";
    document.getElementById("feedback-card").dataset.tone = tone;
    document.getElementById("feedback-icon").innerHTML = this.svgIcon(this.icons[tone]);
    document.getElementById("feedback-title").textContent = titles[tone];
    document.getElementById("feedback-marks").innerHTML =
      this.markMarkup(pending.verdictOk ? "Вердикт верный" : "Вердикт неверный", pending.verdictOk) +
      this.markMarkup(pending.optionOk ? "Объяснение верное" : "Объяснение неверное", pending.optionOk);
    document.getElementById("feedback-text").textContent = text;

    const tags = document.getElementById("feedback-tags");
    tags.innerHTML = "";
    if (pending.solved) {
      const tag = document.createElement("span");
      tag.className = "feedback-tag";
      tag.textContent = pending.alreadyChecked ? "Уже засчитано ранее" : "Комбинация проверена";
      tags.appendChild(tag);
      if (pending.starGain) {
        const star = document.createElement("span");
        star.className = "feedback-tag star";
        star.textContent = "Новая звезда";
        tags.appendChild(star);
      }
    }

    const hasFact = !!(this.combo.fact && (this.combo.fact.text || this.combo.fact.title));
    document.getElementById("btn-fact").classList.toggle("is-hidden", !hasFact);

    App.openModal("modal-feedback");
    App.playSfx({ win: "win", partial: "partial", fail: "fail" }[tone], { jitter: false });
  },

  hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return String(url);
    }
  },

  openFact() {
    const fact = this.combo && this.combo.fact;
    if (!fact) return;
    document.getElementById("fact-title").textContent = fact.title || "";
    document.getElementById("fact-text").textContent = fact.text || "";
    document.getElementById("fact-pair").innerHTML = this.pairMarkup(this.combo);

    const img = document.getElementById("fact-img");
    if (fact.image) {
      img.style.display = "";
      img.src = fact.image;
    } else {
      img.style.display = "none";
    }

    const wrap = document.getElementById("fact-sources-wrap");
    const sources = document.getElementById("fact-sources");
    sources.innerHTML = "";
    wrap.open = false;
    const list = Array.isArray(fact.sources) ? fact.sources : (fact.sources ? [fact.sources] : []);
    wrap.classList.toggle("is-hidden", list.length === 0);
    list.forEach(source => {
      const url = typeof source === "string" ? source : source.url;
      const title = typeof source === "string" ? this.hostOf(source) : (source.title || this.hostOf(source.url));
      if (url && /^https?:/i.test(url)) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = title;
        sources.appendChild(link);
      } else {
        const span = document.createElement("span");
        span.textContent = title;
        sources.appendChild(span);
      }
    });

    document.getElementById("modal-feedback").classList.add("is-under");
    App.openModal("modal-fact");
    App.playSfx("fact_open", { jitter: false });
  },

  closeFact() {
    App.closeModal("modal-fact");
    document.getElementById("modal-feedback").classList.remove("is-under");
  },

  resetRound() {
    this.selected = [];
    this.hideHint();
    this.closeTablet();
    this.updateSelection();
  },

  nextAfterFeedback() {
    document.getElementById("modal-feedback").classList.remove("is-under");
    App.closeModal("modal-feedback");
    App.closeModal("modal-fact");
    const result = this.pending;
    this.pending = null;
    this.resetRound();
    if (result && result.starGain) {
      setTimeout(() => this.showStars(), 380);
    }
  },

  tileMarkup(value, label) {
    return '<div class="stat-tile"><span class="stat-value">' + value + '</span><span class="stat-label">' + label + '</span></div>';
  },

  showStars() {
    const info = Stats.summary(this.labId);
    const names = ["", "Первая звезда!", "Вторая звезда!", "Три звезды!"];
    const star = '<svg class="big-star%s" viewBox="0 0 24 24" aria-hidden="true"%s><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

    let hero = "";
    for (let i = 0; i < GameConfig.starThresholds.length; i++) {
      const earned = i < info.stars;
      const fresh = i === info.stars - 1;
      hero += star.replace("%s", earned ? (fresh ? " earned is-new" : " earned") : "")
        .replace("%s", fresh ? ' style="--star-delay:0.7s"' : "");
    }
    document.getElementById("stars-hero").innerHTML = hero;
    document.getElementById("stars-title").textContent = names[info.stars] || "Новая звезда!";
    document.getElementById("stars-sub").textContent = info.toNext > 0
      ? "Проверено " + info.verified + " из " + info.total + ". До следующей звезды осталось " + info.toNext + "."
      : "Все " + info.total + " комбинаций лаборатории проверены!";
    document.getElementById("stars-stats").innerHTML =
      this.tileMarkup(info.verified + " из " + info.total, "комбинаций проверено") +
      this.tileMarkup(info.firstTry, "с первой попытки") +
      this.tileMarkup(info.bestStreak, "лучшая серия подряд") +
      this.tileMarkup(info.hints, "подсказок использовано");

    App.openModal("modal-stars");
    App.playSfx("fanfare", { jitter: false });
    App.playSfx("star", { delay: 0.7, jitter: false });
  },

  closeStars() {
    App.closeModal("modal-stars");
  },

  leaveFromStars() {
    App.closeModal("modal-stars");
    App.goToLevels();
  },

  cheerText(info) {
    if (info.verified >= info.total) return "Невероятно! Ты проверил всю лабораторию до последней комбинации!";
    if (info.verified === 0 && info.redo === 0) return "Здесь пока тихо. Создай первую гипотезу, и я всё запишу!";
    let text = "Огоо, уже проверено " + info.verified + " из " + info.total + "!";
    if (info.toNext > 0) text += " До следующей звезды осталось " + info.toNext + ".";
    return text;
  },

  openStats() {
    const info = Stats.summary(this.labId);
    document.getElementById("stats-cheer").textContent = this.cheerText(info);

    const share = value => (info.total ? (value / info.total) * 100 : 0) + "%";
    document.getElementById("stats-meter").innerHTML =
      '<span class="seg-ok" style="width:' + share(info.verified) + '"></span>' +
      '<span class="seg-redo" style="width:' + share(info.redo) + '"></span>' +
      '<span class="seg-new" style="width:' + share(info.fresh) + '"></span>';

    const legend = (cls, value, label) => '<div class="legend-item ' + cls + '"><span class="legend-value">' + value + '</span><span class="legend-label">' + label + '</span></div>';
    document.getElementById("stats-legend").innerHTML =
      legend("ok", info.verified, "проверено полностью") +
      legend("redo", info.redo, "нужно проверить ещё раз") +
      legend("new", info.fresh, "ещё не открыто");

    document.getElementById("stats-extra").innerHTML =
      this.tileMarkup(info.stars + " из " + GameConfig.starThresholds.length, "звёзд получено") +
      this.tileMarkup(info.attempts, "ответов всего") +
      this.tileMarkup(info.firstTry, "верно с первой попытки") +
      this.tileMarkup(info.bestStreak, "лучшая серия подряд") +
      this.tileMarkup(info.accuracy + "%", "ответов были верными") +
      this.tileMarkup(info.hints, "подсказок использовано");

    App.openModal("modal-stats");
  },

  closeStats() {
    App.closeModal("modal-stats");
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
