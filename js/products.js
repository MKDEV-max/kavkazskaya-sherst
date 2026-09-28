// Ассортимент: три направления.
//   washed — мытая шерсть высшей очистки
//   tops   — чесаная шерсть (топс, лента)
//   yarn   — натуральная пряжа из собственного мытого сырья
// Цены не публикуются: стоимость рассчитывает менеджер под объём партии.
//
// Пряжа: номера (Nm), метраж и форматы — ПРИМЕРНЫЕ. Замените на свою линейку.
//   Nm 32/2 = две нити по Nm 32, скручены; Tex одной нити = 1000 / Nm.
//   Метраж на 100 г = Nm / сложение × 100.
// Фото пряжи — с Unsplash (бесплатная лицензия), грузятся по прямой ссылке.
//   Если фото не загрузилось, карточка показывает векторную иллюстрацию.
//   Свои фото: положите файл в assets/photos и укажите photo: 'assets/photos/имя.jpg'.
(function (root) {
  var GRADES = {
    fine:       { name: 'Тонкая',     q: 4 },
    semifine:   { name: 'Полутонкая', q: 3 },
    semicoarse: { name: 'Полугрубая', q: 2 },
    coarse:     { name: 'Грубая',     q: 1 }
  };
  var CATEGORIES = {
    washed: { name: 'Мытая шерсть',            short: 'Мытая шерсть' },
    yarn:   { name: 'Шерстяная пряжа',         short: 'Пряжа' },
    tops:   { name: 'Чесаная шерсть / Топс',   short: 'Топс' }
  };
  var YARN_TYPES = {
    cone:  'Бобинная для машинной вязки',
    plied: 'Крученая пряжа',
    hank:  'Пряжа в пасмах'
  };

  var PRODUCTS = [
    // --- Мытая шерсть
    { id: 'fine-washed',     cat: 'washed', grade: 'fine',       color: 'Белая',  breed: 'Ставропольская', micron: '20–23 мкм', use: 'пряжа, трикотаж, тонкие ткани' },
    { id: 'semifine-washed', cat: 'washed', grade: 'semifine',   color: 'Белая',  breed: 'Цигайская',      micron: '27–31 мкм', use: 'костюмные ткани, пряжа' },
    { id: 'semic-washed',    cat: 'washed', grade: 'semicoarse', color: 'Серая',  breed: 'Тушинская',      micron: 'смешанная', use: 'ковры, пряжа ручного прядения' },
    { id: 'coarse-washed',   cat: 'washed', grade: 'coarse',     color: 'Чёрная', breed: 'Карачаевская',   micron: 'смешанная', use: 'войлок, валенки, бурки' },

    // --- Пряжа
    { id: 'yarn-cone-32', cat: 'yarn', type: 'cone', grade: 'fine', title: 'Пряжа Nm 32/2 на бобинах', photo: '1575052734309-6008d800b7dc', weight: 'бобина 1,5 кг',
      nm: 'Nm 32/2', tex: '31 Tex × 2', meters: '1600 м / 100 г',
      pack: 'бобины 1–2 кг, коробки по 20–25 кг', colors: ['#EFE9DC', '#9A9F9B'], colorNames: 'суровый белый, серый',
      use: 'трикотаж, носочное производство' },
    { id: 'yarn-cone-20', cat: 'yarn', type: 'cone', grade: 'semifine', title: 'Пряжа Nm 20/2 на бобинах, меланж', photo: '1719859065270-e6f231f38dd8', weight: 'бобина 2 кг',
      nm: 'Nm 20/2', tex: '50 Tex × 2', meters: '1000 м / 100 г',
      pack: 'бобины 1–2 кг, коробки по 20–25 кг', colors: ['#EFE9DC', '#9A9F9B', '#4A3B32'], colorNames: 'суровый белый, серый, тёмно-коричневый',
      use: 'трикотаж, ткачество' },
    { id: 'yarn-plied-8', cat: 'yarn', type: 'plied', grade: 'semicoarse', title: 'Крученая пряжа Nm 8/3', photo: '1598871956222-26b66d6559fe', weight: 'бобина 2 кг',
      nm: 'Nm 8/3', tex: '125 Tex × 3', meters: '267 м / 100 г',
      pack: 'бобины 2 кг, мешки по 25 кг', colors: ['#9A9F9B', '#4A3B32'], colorNames: 'серый, тёмно-коричневый',
      use: 'ковроткачество, плотный трикотаж' },
    { id: 'yarn-hank-4', cat: 'yarn', type: 'hank', grade: 'semicoarse', title: 'Ковровая пряжа Nm 4/2 в пасмах', photo: '1695898342114-bd8a65060b5c', weight: 'пасма 0,5–1 кг',
      nm: 'Nm 4/2', tex: '250 Tex × 2', meters: '200 м / 100 г',
      pack: 'пасмы 0,5–1 кг, мешки по 25 кг', colors: ['#EFE9DC', '#9A9F9B', '#4A3B32'], colorNames: 'суровый белый, серый, тёмно-коричневый',
      use: 'ковроткачество, ремесленные цеха' },
    { id: 'yarn-hank-12', cat: 'yarn', type: 'hank', grade: 'fine', title: 'Пряжа Nm 12/2 в пасмах', photo: '1670764732085-ebedbd8d7e7c', weight: 'пасма 100 г или 0,5 кг',
      nm: 'Nm 12/2', tex: '83 Tex × 2', meters: '600 м / 100 г',
      pack: 'пасмы 100 г и 0,5 кг, коробки', colors: ['#EFE9DC', '#9A9F9B'], colorNames: 'суровый белый, серый',
      use: 'ручное вязание, ткачество, трикотажные бренды' },

    // --- Топс
    { id: 'fine-combed',     cat: 'tops', grade: 'fine',       color: 'Белая',  breed: 'Кавказская тонкорунная', micron: '21–23 мкм', use: 'прядение, мокрое валяние' },
    { id: 'semifine-combed', cat: 'tops', grade: 'semifine',   color: 'Белая',  breed: 'Цигайская',              micron: '27–31 мкм', use: 'пряжа, валяние' },
    { id: 'semic-combed',    cat: 'tops', grade: 'semicoarse', color: 'Серая',  breed: 'Тушинская',              micron: 'смешанная', use: 'войлок, валяние' },
    { id: 'coarse-combed',   cat: 'tops', grade: 'coarse',     color: 'Чёрная', breed: 'Андийская',              micron: 'смешанная', use: 'валяние, бурки, утеплитель' }
  ];

  // Ссылка на фото Unsplash с оптимизацией (формат, кадрирование, ширина)
  function unsplash(id, w) { return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + w + '&q=80'; }

  // «Тонкость» для сортировки: пряжа — по метражу, шерсть и топс — по сорту
  PRODUCTS.forEach(function (p) {
    p.fineness = p.cat === 'yarn' ? parseInt(p.meters, 10) / 400 : GRADES[p.grade].q;
    if (p.cat === 'yarn') {
      p.name = p.title; p.typeName = YARN_TYPES[p.type];
      if (p.photo && p.photo.indexOf('/') < 0) { p.img = unsplash(p.photo, 800); p.img400 = unsplash(p.photo, 400); }
      else if (p.photo) { p.img = p.img400 = p.photo; }
      return;
    }
    p.name = GRADES[p.grade].name + (p.cat === 'tops' ? ' шерсть, топс (лента)' : ' шерсть, мытая');
  });

  var data = { PRODUCTS: PRODUCTS, GRADES: GRADES, CATEGORIES: CATEGORIES, YARN_TYPES: YARN_TYPES };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SHOP_DATA = data;
})(this);
