// Сайт: разделы, каталог (мытая шерсть, пряжа, топс) и заявка на КП (B2B, без онлайн-оплаты)
(function () {
  var D = window.SHOP_DATA, CFG = window.SHOP_CONFIG || {};
  var PRODUCTS = D.PRODUCTS, GRADES = D.GRADES, CATS = D.CATEGORIES, YARN_TYPES = D.YARN_TYPES;
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return [].slice.call(document.querySelectorAll(sel)); };
  var filters = { cat: 'all', sub: 'all', sort: 'default' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function meter(q) {
    var s = '';
    for (var i = 1; i <= 4; i++) s += '<i' + (i <= q ? ' class="on"' : '') + '></i>';
    return '<span class="meter" role="img" aria-label="Качество ' + q + ' из 4">' + s + '</span>';
  }
  // ---------- иллюстрации пряжи (SVG) ----------
  // Бобина, пасма или клубок в натуральных цветах. До трёх предметов в ряд — по числу цветов.
  var artId = 0;
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.max(0, Math.min(255, Math.round(c * k))); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  var DRAW = {
    cone: function (c, id) {
      return '<defs><pattern id="w' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">' +
        '<rect width="7" height="7" fill="' + c + '"/><path d="M0 3.5h7" stroke="' + shade(c, .82) + '" stroke-width="1.6"/></pattern>' +
        '<linearGradient id="g' + id + '" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>' +
        '<ellipse cx="120" cy="156" rx="60" ry="8" fill="#000" opacity=".12"/>' +
        '<path d="M97 38 L143 38 L170 148 Q120 160 70 148 Z" fill="url(#w' + id + ')"/>' +
        '<path d="M97 38 L143 38 L170 148 Q120 160 70 148 Z" fill="url(#g' + id + ')"/>' +
        '<ellipse cx="120" cy="38" rx="23" ry="5" fill="' + shade(c, .92) + '"/>' +
        '<rect x="112" y="18" width="16" height="22" rx="2" fill="#C8B597"/><ellipse cx="120" cy="18" rx="8" ry="2.6" fill="#8E7B5E"/>';
    },
    hank: function (c) {
      var s = '<ellipse cx="120" cy="150" rx="78" ry="7" fill="#000" opacity=".1"/>';
      s += '<path d="M44 92 C44 64 64 60 72 70 M196 92 C196 64 176 60 168 70" fill="none" stroke="' + shade(c, .78) + '" stroke-width="12" stroke-linecap="round"/>';
      for (var k = 0; k < 8; k++) {
        var x = 58 + k * 18;
        s += '<ellipse cx="' + x + '" cy="96" rx="12" ry="34" transform="rotate(32 ' + x + ' 96)" fill="' + c + '" stroke="' + shade(c, .72) + '" stroke-width="1.5"/>' +
             '<path d="M' + (x - 8) + ' 78 Q' + x + ' 96 ' + (x + 6) + ' 118" fill="none" stroke="' + shade(c, .8) + '" stroke-width="1.2"/>';
      }
      return s;
    },
    plied: function (c, id) {
      var s = '<defs><clipPath id="b' + id + '"><circle cx="120" cy="92" r="54"/></clipPath>' +
        '<radialGradient id="r' + id + '" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient></defs>' +
        '<ellipse cx="120" cy="152" rx="52" ry="7" fill="#000" opacity=".12"/>' +
        '<circle cx="120" cy="92" r="54" fill="' + c + '"/><g clip-path="url(#b' + id + ')" fill="none" stroke="' + shade(c, .75) + '" stroke-width="2.2">';
      [[-35, 44], [-35, 30], [-35, 16], [40, 48], [40, 34], [40, 20], [0, 58]].forEach(function (a) {
        s += '<ellipse cx="120" cy="92" rx="' + a[1] + '" ry="62" transform="rotate(' + a[0] + ' 120 92)"/>';
      });
      return s + '</g><circle cx="120" cy="92" r="54" fill="url(#r' + id + ')"/>' +
        '<path d="M166 118 C186 130 196 146 214 150" fill="none" stroke="' + shade(c, .85) + '" stroke-width="3" stroke-linecap="round"/>';
    }
  };
  function yarnArt(type, colors) {
    var list = colors.slice(0, 3), n = list.length, s = n === 1 ? 1 : n === 2 ? .8 : .66;
    var gap = n === 1 ? 0 : n === 2 ? 58 : 62, out = '';
    list.forEach(function (c, i) {
      var id = ++artId, dx = (i - (n - 1) / 2) * gap, dy = (n > 1 && i % 2 === 1) ? 8 : 0;
      out += '<g transform="translate(' + (120 + dx) + ' ' + (92 + dy) + ') scale(' + s + ') translate(-120 -92)">' + DRAW[type](c, id) + '</g>';
    });
    return '<svg viewBox="0 0 240 180" aria-hidden="true" focusable="false">' + out + '</svg>';
  }
  function hydrateArt(root) {
    [].forEach.call(root.querySelectorAll('.yarn-art[data-art]'), function (el) {
      if (el.firstChild) return;
      el.innerHTML = yarnArt(el.dataset.art, el.dataset.colors.split(','));
    });
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  // ---------- анимации ----------
  var motionOK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var REVEAL = '.perks-grid > div, .head-row, .gtile, .ind, .quality li, .faq details, .split-img, .split-text, .section-head, .steps li, .cta-box, .gl-row, .breed-col, .info-block, .ccard, .requisites, .filters';
  var io = motionOK && 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.remove('pre');
      io.unobserve(el);
      // после появления возвращаем элементу его собственные переходы (наведение и т.п.)
      setTimeout(function () { el.classList.remove('rv'); el.style.removeProperty('--d'); }, 1200);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  // Прячем только то, что ниже первого экрана: всё видимое сразу остаётся на месте
  function reveal(root) {
    if (!io) return;
    var vh = window.innerHeight;
    [].forEach.call(root.querySelectorAll(REVEAL), function (el) {
      if (el.dataset.rv) return;
      el.dataset.rv = '1';
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      var i = [].indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', (i % 4) * 90 + 'ms');
      el.classList.add('rv', 'pre');
      io.observe(el);
    });
  }

  function progress() {
    var bar = $('route-bar');
    bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
  }

  // Волна от точки нажатия на кнопке
  document.addEventListener('pointerdown', function (e) {
    if (!motionOK) return;
    var b = e.target.closest('.btn, .chip');
    if (!b || b.disabled) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
    var w = document.createElement('span');
    w.className = 'ripple';
    w.style.width = w.style.height = s + 'px';
    w.style.left = (e.clientX - r.left - s / 2) + 'px';
    w.style.top = (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(w);
    setTimeout(function () { w.remove(); }, 700);
  });

  // Шапка при прокрутке, полоса прочитанного и кнопка «наверх»
  var topEl = document.querySelector('.top'), readBar = $('read-bar'), upBtn = $('to-top'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    topEl.classList.toggle('scrolled', y > 8);
    readBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    upBtn.classList.toggle('show', y > 700);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  upBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' }); });

  // Ссылка на раздел, который уже открыт, плавно возвращает наверх
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash && window.scrollY > 0) {
      e.preventDefault(); closeMenu();
      window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' });
    }
  });

  // Фото проявляются, когда загрузятся
  function fadeImages(root) {
    if (!motionOK) return;
    [].forEach.call(root.querySelectorAll('img'), function (img) {
      if (img.complete || img.dataset.fade) return;
      img.dataset.fade = '1';
      img.classList.add('img-wait');
      var done = function () { img.classList.remove('img-wait'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  // ---------- разделы сайта ----------
  var PAGES = ['glavnaya', 'o-nas', 'katalog', 'dostavka', 'kontakty'];
  var first = true, routeToken = 0;
  function route() {
    var page = location.hash.replace('#', '');
    if (PAGES.indexOf(page) < 0) page = 'glavnaya';
    var curEl = document.querySelector('[data-page]:not([hidden])'), target = $('p-' + page);
    var token = ++routeToken;
    closeMenu();
    // Плавный переход: текущий раздел гаснет, прокрутка уходит наверх, затем появляется новый
    if (motionOK && !first && curEl && curEl !== target) {
      progress();
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
      curEl.classList.add('page-out');
      setTimeout(function () {
        curEl.classList.remove('page-out');
        if (token === routeToken) swap(page);
      }, 260);
    } else {
      swap(page);
    }
  }
  function swap(page) {
    var shown;
    all('[data-page]').forEach(function (el) {
      var on = el.dataset.page === page;
      if (on && el.hidden) shown = el;
      el.hidden = !on;
    });
    all('#nav a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
    var cur = $('p-' + page);
    if (shown && motionOK && !first) {
      cur.classList.remove('page-in'); void cur.offsetWidth; cur.classList.add('page-in');
    }
    first = false;
    reveal(cur);
    fadeImages(cur);
    onScroll();
  }
  window.addEventListener('hashchange', route);

  // ---------- мобильное меню ----------
  var desktopMQ = window.matchMedia('(min-width: 1024px)');
  function lockScroll(on) {
    document.body.classList.toggle('scroll-lock', on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
  }
  function menuOpen() { return $('nav').classList.contains('open'); }
  function openMenu() {
    $('nav').classList.add('open'); $('nav-scrim').classList.add('open');
    $('menu-btn').setAttribute('aria-expanded', 'true');
    lockScroll(true);
    setTimeout(function () { $('nav-close').focus(); }, 50);
  }
  function closeMenu(returnFocus) {
    if (!menuOpen()) return;
    $('nav').classList.remove('open'); $('nav-scrim').classList.remove('open');
    $('menu-btn').setAttribute('aria-expanded', 'false');
    if (!modal.open) lockScroll(false);
    if (returnFocus) $('menu-btn').focus();
  }
  $('menu-btn').addEventListener('click', function () { menuOpen() ? closeMenu(true) : openMenu(); });
  $('nav-close').addEventListener('click', function () { closeMenu(true); });
  $('nav-scrim').addEventListener('click', function () { closeMenu(true); });
  document.addEventListener('keydown', function (e) {
    if (!menuOpen()) return;
    if (e.key === 'Escape') return closeMenu(true);
    if (e.key === 'Tab') {
      var f = $('nav').querySelectorAll('button, a[href]'), firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });
  desktopMQ.addEventListener('change', function (e) { if (e.matches) closeMenu(false); });

  // Плитки направлений на главной открывают каталог на нужной вкладке
  all('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function () { setCat(a.dataset.catLink); });
  });

  // ---------- каталог ----------
  // Вкладки = направления. Под ними — уточняющий фильтр: сорт для шерсти и топса, вид для пряжи.
  var SUBS = {
    washed: { key: 'grade', label: 'Сорт', opts: [['fine', 'Тонкая'], ['semifine', 'Полутонкая'], ['semicoarse', 'Полугрубая'], ['coarse', 'Грубая']] },
    tops:   { key: 'grade', label: 'Сорт', opts: [['fine', 'Тонкая'], ['semifine', 'Полутонкая'], ['semicoarse', 'Полугрубая'], ['coarse', 'Грубая']] },
    yarn:   { key: 'type',  label: 'Вид',  opts: [['cone', 'Бобинная'], ['plied', 'Крученая'], ['hank', 'В пасмах']] }
  };
  var animateGrid = false;
  all('#tabs .tab').forEach(function (b) {
    var c = b.dataset.cat, n = c === 'all' ? PRODUCTS.length : PRODUCTS.filter(function (p) { return p.cat === c; }).length;
    b.querySelector('.tab-n').textContent = n;
  });
  var HINTS = {
    all: 'Выберите направление, чтобы отфильтровать по сорту сырья или типу намотки.',
    washed: 'Уточните сорт: от тонкой шерсти до 25 мкм до прочной грубой.',
    tops: 'Уточните сорт гребенной ленты под вашу задачу: прядение или валяние.',
    yarn: 'Уточните тип намотки: бобины для машинной вязки, крученая нить или пасмы.'
  };
  function setCat(cat) {
    filters.cat = cat; filters.sub = 'all';
    all('#tabs .tab').forEach(function (b) {
      var on = b.dataset.cat === cat;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      // активная вкладка всегда видна в горизонтальной ленте на телефоне
      if (on && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motionOK ? 'smooth' : 'auto' });
    });
    renderSubs();
    refresh();
  }
  function renderSubs() {
    var box = $('subfilters'), s = SUBS[filters.cat];
    box.hidden = !s;
    if (!s) { box.innerHTML = ''; return; }
    box.innerHTML = '<span class="subchips-label">' + s.label + ':</span>' +
      '<button class="chip" type="button" data-sub="all" aria-pressed="' + (filters.sub === 'all') + '">Все</button>' +
      s.opts.map(function (o) { return '<button class="chip" type="button" data-sub="' + o[0] + '" aria-pressed="' + (filters.sub === o[0]) + '">' + o[1] + '</button>'; }).join('');
  }
  // Склонение: 1 позиция, 2 позиции, 5 позиций
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  }
  function refresh() {
    animateGrid = true; var n = renderGrid(); animateGrid = false;
    $('status-hint').textContent = HINTS[filters.cat];
    $('found').innerHTML = filters.cat === 'yarn'
      ? 'Показано: <b>' + n + '</b> ' + plural(n, 'вид', 'вида', 'видов') + ' пряжи'
      : 'Найдено: <b>' + n + '</b> ' + plural(n, 'позиция', 'позиции', 'позиций');
    $('reset').hidden = filters.cat === 'all' && filters.sub === 'all' && filters.sort === 'default';
  }
  function matches(p) {
    if (filters.cat !== 'all' && p.cat !== filters.cat) return false;
    if (filters.sub === 'all') return true;
    return (SUBS[filters.cat].key === 'type' ? p.type : p.grade) === filters.sub;
  }
  function woolCard(p, i) {
    var g = GRADES[p.grade], tops = p.cat === 'tops';
    return '<article class="card' + (animateGrid ? ' enter' : '') + '" style="--i:' + i + '">' +
      '<div class="photo"><img src="assets/photos/' + p.id + '.jpg" alt="' + esc(p.name) + '" loading="lazy">' +
        '<span class="seal">100% мытая</span>' +
        '<span class="tag">' + (tops ? 'Топс · лента' : 'Мытая шерсть') + ' · ' + esc(p.color.toLowerCase()) + '</span></div>' +
      '<div class="card-body">' +
        '<div class="card-top"><span class="pill">' + g.name + '</span>' + meter(g.q) + '</div>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p class="breed">' + esc(p.breed) + ' порода · <span class="mono">' + esc(p.micron) + '</span></p>' +
        '<p class="use">' + esc(p.use) + '</p>' +
        '<div class="buy"><p class="price-note">Цена — под объём партии</p>' +
          '<button class="btn add" type="button" data-request="' + p.id + '">Рассчитать партию</button></div>' +
      '</div></article>';
  }
  function yarnCard(p, i) {
    var dots = p.colors.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');
    return '<article class="card card-yarn' + (animateGrid ? ' enter' : '') + '" style="--i:' + i + '">' +
      '<div class="photo' + (p.img ? '' : ' yarn-art') + '">' +
        (p.img
          ? '<img src="' + p.img + '" srcset="' + p.img400 + ' 400w, ' + p.img + ' 800w" sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"' +
            ' alt="' + esc(p.name + ', ' + p.colorNames) + '" loading="lazy" decoding="async" data-art="' + p.type + '" data-colors="' + p.colors.join(',') + '">'
          : yarnArt(p.type, p.colors)) +
        '<span class="seal seal-yarn">Без синтетики</span>' +
        '<span class="tag">' + esc(p.typeName) + '</span></div>' +
      '<div class="card-body">' +
        '<div class="card-top"><span class="pill pill-yarn">Пряжа</span><span class="nm mono">' + esc(p.nm) + '</span></div>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<dl class="specs">' +
          '<dt>Состав</dt><dd>100% кавказская мытая шерсть</dd>' +
          '<dt>Плотность</dt><dd class="mono">' + esc(p.nm) + ' · ' + esc(p.tex) + '</dd>' +
          '<dt>Метраж</dt><dd class="mono">' + esc(p.meters) + '</dd>' +
          '<dt>Вес</dt><dd>' + esc(p.weight) + '</dd>' +
          '<dt>Поставка</dt><dd>' + esc(p.pack) + '</dd>' +
          '<dt>Цвета</dt><dd><span class="dots">' + dots + '</span>' + esc(p.colorNames) + '; крашение под партию</dd>' +
          '<dt>Назначение</dt><dd>' + esc(p.use) + '</dd>' +
        '</dl>' +
        '<div class="buy"><button class="btn add" type="button" data-request="' + p.id + '">Запросить образцы и КП</button></div>' +
      '</div></article>';
  }
  function renderGrid() {
    var list = PRODUCTS.filter(matches);
    if (filters.sort !== 'default') {
      var dir = filters.sort === 'fine' ? -1 : 1;
      list = list.slice().sort(function (a, b) { return dir * (a.fineness - b.fineness); });
    }
    var grid = $('grid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty"><p>По этим фильтрам ничего нет.</p><button class="btn ghost" type="button" data-reset>Сбросить фильтр</button></div>';
      return 0;
    }
    grid.innerHTML = list.map(function (p, i) { return p.cat === 'yarn' ? yarnCard(p, i) : woolCard(p, i); }).join('');
    fadeImages(grid);
    photoFallback(grid);
    return list.length;
  }
  // Если фото пряжи не загрузилось (нет сети, блокировка), показываем векторную иллюстрацию
  function photoFallback(root) {
    [].forEach.call(root.querySelectorAll('img[data-art]'), function (img) {
      var swap = function () {
        var box = img.parentNode;
        box.classList.add('yarn-art');
        img.outerHTML = yarnArt(img.dataset.art, img.dataset.colors.split(','));
      };
      if (img.complete && !img.naturalWidth && img.src) swap();
      else img.addEventListener('error', swap, { once: true });
    });
  }

  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab');
    if (b) setCat(b.dataset.cat);
  });
  // Стрелки влево/вправо переключают вкладки, как положено для role="tablist"
  $('tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var tabs = all('#tabs .tab'), i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus(); setCat(next.dataset.cat);
  });
  $('subfilters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sub]');
    if (!b) return;
    filters.sub = b.dataset.sub;
    all('#subfilters [data-sub]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    refresh();
  });
  $('sort').addEventListener('change', function () { filters.sort = this.value; refresh(); });
  function resetAll() { filters.sort = 'default'; $('sort').value = 'default'; setCat('all'); }
  $('reset').addEventListener('click', resetAll);
  $('grid').addEventListener('click', function (e) {
    if (e.target.closest('[data-reset]')) resetAll();
  });

  // ---------- заявка на расчёт партии ----------
  var modal = $('request'), form = $('request-form'), doneBox = $('req-done');
  var sel = $('r-product');
  function currentCat() { var r = form.querySelector('input[name="cat"]:checked'); return r ? r.value : 'washed'; }
  function optLabel(p) { return p.cat === 'yarn' ? p.name + ' — ' + p.typeName.toLowerCase() : p.name + ' — ' + p.breed + ', ' + p.color.toLowerCase(); }
  // В списке позиций — только выбранное направление; для пряжи показываем поля номера нити и формата
  function syncCat(keepProduct) {
    var cat = currentCat(), keep = keepProduct && byId[keepProduct] && byId[keepProduct].cat === cat ? keepProduct : '';
    sel.innerHTML = '<option value="">Несколько позиций / нужна консультация</option>' +
      PRODUCTS.filter(function (p) { return p.cat === cat; })
        .map(function (p) { return '<option value="' + p.id + '">' + esc(optLabel(p)) + '</option>'; }).join('');
    sel.value = keep;
    var yarn = cat === 'yarn';
    $('yarn-fields').hidden = !yarn;
    if (!yarn) { $('r-count').closest('.field').classList.remove('bad'); $('e-count').textContent = ''; }
    fillCount();
  }
  // Номер нити подставляется из выбранной позиции пряжи — клиенту остаётся поправить при необходимости
  function fillCount() {
    var p = byId[sel.value];
    if (p && p.cat === 'yarn') { $('r-count').value = p.nm; $('r-pack').value = p.type === 'hank' ? 'Пасмы' : 'Бобины'; }
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'cat') syncCat(sel.value);
    if (e.target === sel) fillCount();
  });

  var lastTrigger = null;
  function openRequest(productId, trigger, cat) {
    closeMenu(false);
    lastTrigger = trigger || null;
    resetRequest();
    var p = byId[productId], c = p ? p.cat : (CATS[cat] ? cat : 'washed');
    form.querySelector('input[name="cat"][value="' + c + '"]').checked = true;
    syncCat(p ? p.id : '');
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    lockScroll(true);
    setTimeout(function () { $('r-volume').focus(); }, 60);
  }
  function closeRequest() {
    if (!modal.open) return;
    var finish = function () {
      modal.classList.remove('closing');
      if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
      lockScroll(false);
      if (lastTrigger) lastTrigger.focus();
    };
    if (!motionOK) return finish();
    modal.classList.add('closing');
    setTimeout(finish, 220);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-request]');
    if (b) { e.preventDefault(); openRequest(b.dataset.request, b, b.dataset.requestCat); return; }
    if (e.target.closest('[data-close-modal]')) closeRequest();
  });
  // Клик по затемнению вокруг окна закрывает его
  modal.addEventListener('click', function (e) { if (e.target === modal) closeRequest(); });
  // Esc: закрываем с анимацией вместо мгновенного закрытия браузером
  modal.addEventListener('cancel', function (e) { e.preventDefault(); closeRequest(); });

  function resetRequest() {
    form.reset();
    form.hidden = false; doneBox.hidden = true;
    modal.classList.remove('is-done');
    all('#request-form .bad').forEach(function (el) { el.classList.remove('bad'); });
    all('#request-form .err').forEach(function (el) { el.textContent = ''; });
    $('r-msg').textContent = '';
    setLoading(false);
  }

  // Проверка полей. Каждое правило возвращает текст ошибки или пустую строку.
  var RULES = {
    'r-volume': function () {
      var v = parseFloat(String($('r-volume').value).replace(',', '.'));
      if (!(v > 0)) return 'Укажите объём партии';
      if ($('r-unit').value === 'кг' && v < 1) return 'Минимальная партия — 1 кг';
      if (v > 100000) return 'Проверьте объём';
      return '';
    },
    'r-name': function () { return $('r-name').value.trim().length >= 2 ? '' : 'Укажите имя или название компании'; },
    'r-email': function () {
      var v = $('r-email').value.trim();
      if (!v) return 'Укажите email — на него придут КП и счёт';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Проверьте адрес: например, zakupki@company.ru';
    },
    'r-phone': function () {
      var d = $('r-phone').value.replace(/\D/g, '');
      return d.length >= 10 && d.length <= 15 ? '' : 'Укажите телефон, например +7 900 123-45-67';
    },
    'r-agree': function () { return $('r-agree').checked ? '' : 'Нужно согласие на обработку данных'; },
    // Номер нити обязателен только для пряжи
    'r-count': function () {
      if (currentCat() !== 'yarn') return '';
      var v = $('r-count').value.trim();
      if (!v) return 'Укажите номер нити: например, Nm 32/2 или 62 Tex';
      return /\d/.test(v) ? '' : 'Номер нити должен содержать число: Nm 32/2, 62 Tex';
    }
  };
  function check(id) {
    var msg = RULES[id](), input = $(id), box = input.closest('.field');
    box.classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $('e-' + id.slice(2)).textContent = msg;
    return !msg;
  }
  // Ошибку показываем после ухода с поля, а убираем сразу, как только значение стало верным
  Object.keys(RULES).forEach(function (id) {
    var el = $(id);
    el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') check(id); });
    el.addEventListener('input', function () { if (el.closest('.field').classList.contains('bad')) check(id); });
    el.addEventListener('change', function () { if (el.type === 'checkbox' || el.closest('.field').classList.contains('bad')) check(id); });
  });
  $('r-unit').addEventListener('change', function () { if ($('r-volume').value) check('r-volume'); });
  // Российский номер из 11 цифр приводим к виду +7 900 123-45-67
  $('r-phone').addEventListener('blur', function () {
    var d = this.value.replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
      this.value = '+7 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9, 11);
    }
  });

  function setLoading(on) {
    var b = $('r-submit');
    b.disabled = on; b.classList.toggle('loading', on); b.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function collect() {
    var p = byId[sel.value], cat = currentCat(), yarn = cat === 'yarn';
    var vol = String($('r-volume').value).replace(',', '.') + ' ' + $('r-unit').value;
    return {
      category: CATS[cat].name,
      product: p ? optLabel(p) : 'Несколько позиций / консультация',
      count: yarn ? $('r-count').value.trim() : '',
      pack: yarn ? $('r-pack').value : '',
      samples: yarn && $('r-samples').checked ? 'Да' : '',
      volume: vol,
      name: $('r-name').value.trim(),
      email: $('r-email').value.trim(),
      phone: $('r-phone').value.trim(),
      comment: $('r-comment').value.trim()
    };
  }
  function letter(d) {
    return 'Направление: ' + d.category + '\nПозиция: ' + d.product +
      (d.count ? '\nНомер нити: ' + d.count + '\nФормат: ' + d.pack : '') + (d.samples ? '\nНужны образцы: да' : '') +
      '\nОбъём партии: ' + d.volume + '\nИмя / компания: ' + d.name +
      '\nEmail: ' + d.email + '\nТелефон: ' + d.phone + (d.comment ? '\nКомментарий / реквизиты: ' + d.comment : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, firstBad = null;
    Object.keys(RULES).forEach(function (id) { if (!check(id)) { ok = false; firstBad = firstBad || $(id); } });
    if (!ok) {
      firstBad.focus();
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return;
    }
    // Бот отметил скрытую ловушку — делаем вид, что всё отправлено
    if (form.botcheck.checked) return showDone(collect(), 'sent');

    var d = collect();
    $('r-msg').textContent = '';

    // Онлайн-отправка не подключена: готовим письмо, заявка не теряется
    if (!CFG.formKey) return showDone(d, 'mail');

    setLoading(true);
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(CFG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({
        access_key: CFG.formKey,
        subject: 'Заявка на КП (' + d.category + '): ' + d.product + ', ' + d.volume + (d.samples ? ', нужны образцы' : ''),
        from_name: 'Сайт «Кавказская шерсть»',
        replyto: d.email,
        'Направление': d.category,
        'Позиция': d.product,
        'Номер нити': d.count || '—',
        'Формат поставки': d.pack || '—',
        'Нужны образцы': d.samples || 'нет',
        'Объём партии': d.volume,
        'Имя / компания': d.name,
        'Email': d.email,
        'Телефон': d.phone,
        'Комментарий / реквизиты': d.comment || '—'
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || res.j.success === false) throw new Error(res.j.message || 'сервис не принял заявку');
        showDone(d, 'sent');
      })
      .catch(function (err) {
        setLoading(false);
        $('r-msg').textContent = 'Не удалось отправить заявку (' + (err.name === 'AbortError' ? 'нет ответа' : err.message) +
          '). Попробуйте ещё раз или напишите нам на ' + CFG.salesEmail + '.';
      })
      .then(function () { clearTimeout(timer); });
  });

  function showDone(d, mode) {
    setLoading(false);
    var mail = $('done-mail');
    if (mode === 'sent') {
      $('done-title').textContent = 'Заявка отправлена';
      $('done-text').textContent = 'Спасибо! Менеджер рассчитает стоимость и пришлёт коммерческое предложение, спецификации и счёт на ' + d.email + (d.samples ? '. Об отправке образцов договоримся по телефону.' : '.');
      mail.hidden = true;
    } else {
      $('done-title').textContent = 'Заявка готова';
      $('done-text').textContent = 'Отправьте её письмом на ' + CFG.salesEmail + ': кнопка ниже откроет почту с уже заполненной заявкой. КП, спецификации и счёт придут на ' + d.email + '.';
      mail.href = 'mailto:' + CFG.salesEmail + '?subject=' + encodeURIComponent('Заявка на КП (' + d.category + '): ' + d.product + ', ' + d.volume) +
        '&body=' + encodeURIComponent(letter(d));
      mail.hidden = false;
    }
    form.hidden = true;
    doneBox.hidden = false;
    modal.classList.add('is-done');
    doneBox.focus();
    if (mode === 'sent') toast('Заявка отправлена');
  }

  hydrateArt(document);
  photoFallback(document);
  renderSubs();
  refresh();
  route();
})();
