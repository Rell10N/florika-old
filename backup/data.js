const GameConfig = {
  hypothesesPerLab: 28,
  starThresholds: [10, 20, 28],
  finalThreshold: 85,
  devCode: "Rell10N",
  labs: [
    { id: "home", title: "Домашняя лаборатория", available: true },
    { id: "yard", title: "Дворовая лаборатория", available: false },
    { id: "forest", title: "Лесная лаборатория", available: false },
    { id: "city", title: "Городская лаборатория", available: false },
    { id: "medical", title: "Медицинская лаборатория", available: false },
    { id: "space", title: "Космическая лаборатория", available: false }
  ],
  items: [
    {
      id: "apple", name: "Яблоко", group: "nature", color: "#e5484d",
      svg: '<path d="M32 20c-6-5-19-2-19 13 0 14 9 24 19 24s19-10 19-24c0-15-13-18-19-13z" fill="#e5484d" stroke="#a02226" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 20c0-6 2-10 6-13" stroke="#6b3f1d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 12c4-5 11-3 11-3s-1 8-8 9c-3 .4-4-2-3-6z" fill="#4caf50" stroke="#2f7a33" stroke-width="2"/><ellipse cx="21" cy="34" rx="3" ry="7" fill="#fff" opacity=".4"/>'
    },
    {
      id: "pear", name: "Груша", group: "nature", color: "#b5d334",
      svg: '<path d="M32 12c-5 0-8 5-8 10 0 5-9 9-9 19 0 9 7 14 17 14s17-5 17-14c0-10-9-14-9-19 0-5-3-10-8-10z" fill="#b5d334" stroke="#6b8a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 12c0-4 2-7 5-8" stroke="#6b3f1d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M35 9c4-4 10-2 10-2s-1 7-7 8c-2 .3-3-2-3-6z" fill="#4caf50" stroke="#2f7a33" stroke-width="2"/><ellipse cx="25" cy="42" rx="3" ry="7" fill="#fff" opacity=".35"/>'
    },
    {
      id: "dog", name: "Собака", group: "nature", color: "#c98b4f",
      svg: '<ellipse cx="32" cy="36" rx="17" ry="16" fill="#fff4e0" stroke="#7a4a22" stroke-width="2"/><path d="M17 20c-7 1-9 13-5 22 5-1 9-7 9-14z" fill="#b8733a" stroke="#7a4a22" stroke-width="2" stroke-linejoin="round"/><path d="M47 20c7 1 9 13 5 22-5-1-9-7-9-14z" fill="#b8733a" stroke="#7a4a22" stroke-width="2" stroke-linejoin="round"/><circle cx="25" cy="33" r="2.6" fill="#2b1a0c"/><circle cx="39" cy="33" r="2.6" fill="#2b1a0c"/><ellipse cx="32" cy="41" rx="5" ry="3.6" fill="#2b1a0c"/><path d="M32 44v3c-3 3-6 1-7-1M32 47c3 3 6 1 7-1" stroke="#2b1a0c" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M29 48c0 5 6 5 6 0z" fill="#f2788a"/>'
    },
    {
      id: "cat", name: "Кот", group: "nature", color: "#8c95a8",
      svg: '<path d="M14 30V10l12 10z" fill="#8c95a8" stroke="#4d5567" stroke-width="2" stroke-linejoin="round"/><path d="M50 30V10L38 20z" fill="#8c95a8" stroke="#4d5567" stroke-width="2" stroke-linejoin="round"/><ellipse cx="32" cy="38" rx="19" ry="16" fill="#8c95a8" stroke="#4d5567" stroke-width="2"/><ellipse cx="25" cy="36" rx="2.6" ry="3.4" fill="#1d2330"/><ellipse cx="39" cy="36" rx="2.6" ry="3.4" fill="#1d2330"/><path d="M30 42h4l-2 3z" fill="#f2788a"/><path d="M32 45c-2 3-5 3-6 1M32 45c2 3 5 3 6 1" stroke="#1d2330" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M10 38h9M10 43l9-2M54 38h-9M54 43l-9-2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'
    },
    {
      id: "clock", name: "Часы", group: "device", color: "#4a7bd6",
      svg: '<circle cx="32" cy="32" r="24" fill="#fff" stroke="#2f5db3" stroke-width="5"/><path d="M32 15v17l10 6" stroke="#1d2c4d" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="32" r="3" fill="#1d2c4d"/><path d="M32 10v4M32 50v4M10 32h4M50 32h4" stroke="#2f5db3" stroke-width="3" stroke-linecap="round"/>'
    },
    {
      id: "flashlight", name: "Фонарик", group: "device", color: "#f4c542",
      svg: '<g transform="rotate(-35 32 32)"><rect x="6" y="26" width="30" height="12" rx="4" fill="#4a5568" stroke="#2d3748" stroke-width="2"/><path d="M36 23h8l5-4v26l-5-4h-8z" fill="#718096" stroke="#2d3748" stroke-width="2" stroke-linejoin="round"/><ellipse cx="49" cy="32" rx="3.5" ry="11" fill="#ffd54a" stroke="#c99a00" stroke-width="2"/><rect x="14" y="29" width="6" height="6" rx="2" fill="#f2c94c"/></g>'
    },
    {
      id: "fan", name: "Вентилятор", group: "device", color: "#5bc0de",
      svg: '<g transform="translate(32 28)"><ellipse cx="0" cy="-12" rx="7" ry="12" fill="#4aa8d8" stroke="#24709c" stroke-width="2"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="#4aa8d8" stroke="#24709c" stroke-width="2" transform="rotate(120)"/><ellipse cx="0" cy="-12" rx="7" ry="12" fill="#4aa8d8" stroke="#24709c" stroke-width="2" transform="rotate(240)"/><circle r="4.5" fill="#fff" stroke="#24709c" stroke-width="2"/></g><path d="M32 33v14M22 52h20" stroke="#24709c" stroke-width="4" stroke-linecap="round"/>'
    },
    {
      id: "camera", name: "Камера", group: "device", color: "#7b6cc4",
      svg: '<path d="M22 16h20l3 6h9a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4h9z" fill="#4a5568" stroke="#2d3748" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="37" r="12" fill="#e2e8f0" stroke="#2d3748" stroke-width="2.5"/><circle cx="32" cy="37" r="7.5" fill="#2b6cb0"/><circle cx="29.5" cy="34.5" r="2.4" fill="#fff" opacity=".8"/><rect x="46" y="27" width="5" height="4" rx="1.5" fill="#f2c94c"/>'
    }
  ]
};

const GameData = {
  prologue: [
    {
      sprite: "assets/flori/flori_panic.png",
      text: "Ой-ой-ой! Беда, беда! В лабораторию ударила молния, и всё пошло наперекосяк! Сработал аварийный протокол, все срочно эвакуируются!"
    },
    {
      sprite: "assets/flori/flori_glitch.png",
      text: "Наша Мэйлия получила сильный сбой! Теперь она путает правду с выдумками, а проверка её выводов заблокирована. Что же делать, что же делать..."
    },
    {
      sprite: "assets/flori/flori_hello.png",
      text: "Ой! Подожди-ка... А кто это здесь? У тебя горит активная учебная сессия! Значит, ты из учебной программы нашей лаборатории!"
    },
    {
      sprite: "assets/flori/flori_win.png",
      text: "Ура-ура! Какая удача! Я нашёл себе помощника, и как раз из учебной программы! Теперь у нас точно всё получится!"
    },
    {
      sprite: "assets/flori/flori_think.png",
      text: "Давай знакомиться! Я Флори, а тебя зовут... зовут... э-э-э... Ой! А я ведь совсем не знаю твоего имени!"
    },
    {
      type: "input",
      sprite: "assets/flori/flori_talk.png",
      text: "А как тебя зовут, Исследователь?"
    },
    {
      type: "reaction",
      named: {
        sprite: "assets/flori/flori_win.png",
        text: "{who}! Звучит просто великолепно! Очень приятно познакомиться!"
      },
      anonymous: {
        sprite: "assets/flori/flori_think.png",
        text: "Ого, имя вводить не хочешь? Ничего страшного! Тогда буду звать тебя просто Исследователь. Звучит солидно!"
      }
    },
    {
      sprite: "assets/flori/flori_talk.png",
      text: "Слушай внимательно, {who}. Мэйлия по-прежнему придумывает гипотезы, но из-за аварии не может сама проверить, правда это или нет. А роботам трогать защиту строго запрещено."
    },
    {
      sprite: "assets/flori/flori_guide.png",
      text: "Поэтому нужен настоящий человек со здравым смыслом! Ты будешь проверять идеи Мэйлии: возможно такое или нет, и почему. А я буду рядом, подскажу и расскажу много интересного!"
    },
    {
      sprite: "assets/flori/flori_guide.png",
      text: "Скорее в безопасную часть лаборатории, к проверочному терминалу! Держись за меня крепче, {who}, полетели!"
    }
  ],
  stubs: {
    finale: {
      title: "Данные сданы",
      text: "Мэйлия получает доступ к проверенной базе знаний. Сюжетный финал скоро появится!",
      sprite: "assets/flori/flori_win.png"
    },
    farewell: {
      title: "До встречи!",
      text: "Спасибо за игру! Эту вкладку можно закрыть. Флори будет ждать тебя в лаборатории.",
      sprite: "assets/flori/flori_hello.png"
    }
  }
};
