/*
 * Каталог «Кавказская шерсть».
 *
 * Правило: указываются только известные характеристики. Неизвестное значение — null:
 * строка характеристики и фильтр по ней на сайте просто не показываются.
 * Фильтры каталога строятся автоматически: группа фильтра появляется, когда у товаров
 * категории есть хотя бы два разных значения (например, два номера пряжи).
 *
 * Сейчас заполнено только то, что подтверждено владельцем:
 *   сырьё — 100% шерсть дагестанского мериноса, Республика Дагестан; тонина 19–23 мкм;
 *   пряжа — бобины 1–2 кг, пасмы, мешки/коробки; натуральный белый, крашение под партию.
 * Добавьте номера пряжи (Nm), сложения, длину штапеля, минимальные партии — фильтры появятся сами.
 *
 * photo.stock = true — иллюстративное фото с фотостока: на карточке будет пометка «Иллюстрация».
 * Замените на реальное фото продукции: { src: 'assets/photos/имя.jpg', alt: '…', stock: false }.
 */
(function (root) {
  var CATEGORIES = {
    wool: { name: 'Мытая шерсть', plural: 'Мытая шерсть', lead: 'Мытая шерсть дагестанского мериноса — сырьё для прядения, трикотажа, текстиля и войлока.' },
    tops: { name: 'Топс', plural: 'Топс (гребенная лента)', lead: 'Гребенная лента: волокна расчёсаны и уложены параллельно — готова к прядению.' },
    yarn: { name: 'Пряжа', plural: 'Шерстяная пряжа', lead: 'Натуральная пряжа из собственной мытой шерсти, без синтетических примесей.' }
  };

  var ORIGIN = 'Республика Дагестан';
  var COMPOSITION = '100% шерсть дагестанского мериноса';

  var PRODUCTS = [
    {
      id: 'myitaya-sherst-merinosa',
      cat: 'wool',
      name: 'Мытая шерсть дагестанского мериноса',
      summary: 'Тонкорунная шерсть после промышленной мойки: чистый природный белый цвет, мягкое извитое волокно.',
      grade: 'Тонкорунная',
      composition: COMPOSITION,
      origin: ORIGIN,
      micron: '19–23 мкм',
      staple: null,          // длина штапеля, напр.: '6–8 см'
      color: 'Натуральный белый',
      format: 'Мешки',
      packaging: null,       // напр.: 'мешки по 25 кг'
      unit: 'кг',
      minOrder: null,        // напр.: 'от 50 кг'
      applications: ['прядение', 'трикотажная пряжа', 'премиальный текстиль', 'валяние и войлок'],
      variants: 'Тонину и объём партии подбираем под задачу — укажите требования в заявке.',
      photo: { src: 'assets/photos/semifine-washed.jpg', w: 800, h: 600, alt: 'Мытая белая шерсть крупным планом', stock: true }
    },
    {
      id: 'tops-merinosa',
      cat: 'tops',
      name: 'Топс из шерсти дагестанского мериноса',
      summary: 'Гребенная лента из мытой шерсти мериноса: волокна выровнены и уложены параллельно.',
      grade: 'Тонкорунная',
      composition: COMPOSITION,
      origin: ORIGIN,
      micron: '19–23 мкм',
      staple: null,          // средняя длина волокна в ленте
      color: 'Натуральный белый',
      format: 'Лента',
      packaging: null,
      unit: 'кг',
      minOrder: null,
      applications: ['гребенное прядение', 'валяние'],
      variants: 'Параметры ленты и объём партии согласуем под ваше оборудование.',
      photo: { src: 'assets/photos/semifine-combed.jpg', w: 800, h: 600, alt: 'Белая гребенная лента из шерсти', stock: true }
    },
    {
      id: 'pryazha-na-bobinah',
      cat: 'yarn',
      name: 'Пряжа на бобинах для машинной вязки',
      summary: 'Пряжа из мытой шерсти дагестанского мериноса, намотка на бобины для вязального оборудования.',
      grade: null,
      composition: COMPOSITION,
      origin: ORIGIN,
      micron: '19–23 мкм',
      nm: null,              // номер пряжи, напр.: 'Nm 32/2'
      ply: null,             // число сложений, напр.: '2'
      tex: null,
      meterage: null,        // напр.: '1600 м / 100 г'
      color: 'Натуральный белый; крашение под партию',
      format: 'Бобины',
      packaging: 'бобины 1–2 кг; оптом — мешки или коробки',
      unit: 'кг',
      minOrder: null,
      applications: ['трикотаж', 'носочное производство'],
      variants: 'Номер нити (Nm/Tex), число сложений и цвет согласуем под задачу.',
      photo: { src: 'https://images.unsplash.com/photo-1575052734309-6008d800b7dc?auto=format&fit=crop&w=800&h=600&q=75', w: 800, h: 600, alt: 'Бобины светлой пряжи', stock: true }
    },
    {
      id: 'kruchenaya-pryazha',
      cat: 'yarn',
      name: 'Крученая пряжа',
      summary: 'Пряжа из нескольких скрученных нитей — плотная и прочная, для ткачества и плотного трикотажа.',
      grade: null,
      composition: COMPOSITION,
      origin: ORIGIN,
      micron: '19–23 мкм',
      nm: null,
      ply: null,
      tex: null,
      meterage: null,
      color: 'Натуральный белый; крашение под партию',
      format: 'Бобины',
      packaging: 'бобины 1–2 кг; оптом — мешки или коробки',
      unit: 'кг',
      minOrder: null,
      applications: ['ткачество', 'плотный трикотаж', 'ковроткачество'],
      variants: 'Номер нити, число сложений и крутку согласуем под задачу.',
      photo: { src: 'https://images.unsplash.com/photo-1598871956222-26b66d6559fe?auto=format&fit=crop&w=800&h=600&q=75', w: 800, h: 600, alt: 'Мотки натуральной шерстяной пряжи', stock: true }
    },
    {
      id: 'pryazha-v-pasmah',
      cat: 'yarn',
      name: 'Пряжа в пасмах',
      summary: 'Пряжа в пасмах (мотках) — для ткачества, ковроткачества и ручных производств.',
      grade: null,
      composition: COMPOSITION,
      origin: ORIGIN,
      micron: '19–23 мкм',
      nm: null,
      ply: null,
      tex: null,
      meterage: null,
      color: 'Натуральный белый; крашение под партию',
      format: 'Пасмы',
      packaging: 'пасмы; оптом — мешки или коробки',
      unit: 'кг',
      minOrder: null,
      applications: ['ткачество', 'ковроткачество', 'ручное вязание', 'ремесленные цеха'],
      variants: 'Номер нити и вес пасмы согласуем под задачу.',
      photo: { src: 'https://images.unsplash.com/photo-1695898342114-bd8a65060b5c?auto=format&fit=crop&w=800&h=600&q=75', w: 800, h: 600, alt: 'Неокрашенные пасмы пряжи', stock: true }
    }
  ];

  var data = { CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SHOP_DATA = data;
})(this);
