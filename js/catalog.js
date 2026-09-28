/*
 * Каталог: фильтры, карточки, окно товара, сравнение характеристик.
 * Фильтры строятся из данных js/products.js: группа появляется, только если у товаров
 * выбранной категории есть хотя бы два разных значения. Состояние хранится в адресе
 * (catalog.html?cat=yarn&format=Бобины), поэтому ссылкой на подборку можно поделиться.
 */
(function () {
  'use strict';
  var D = window.SHOP_DATA || { PRODUCTS: [], CATEGORIES: {} }, KS = window.KS;
  var PRODUCTS = D.PRODUCTS, CATS = D.CATEGORIES;
  var esc = KS.esc, has = KS.has;
  var $ = function (id) { return document.getElementById(id); };
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  // Какие характеристики фильтруются в каждой категории
  var FILTERS = {
    wool: [['grade', 'Сорт'], ['micron', 'Тонина'], ['color', 'Цвет']],
    tops: [['grade', 'Сорт'], ['micron', 'Тонина'], ['staple', 'Длина волокна'], ['color', 'Цвет']],
    yarn: [['nm', 'Номер нити (Nm)'], ['ply', 'Сложения'], ['format', 'Формат'], ['color', 'Цвет']]
  };
  // Характеристики для карточки товара (в порядке показа)
  var SPECS = [
    ['composition', 'Состав'], ['origin', 'Происхождение'], ['grade', 'Сорт'], ['micron', 'Тонина'],
    ['staple', 'Длина волокна'], ['nm', 'Номер нити'], ['ply', 'Сложения'], ['tex', 'Линейная плотность'],
    ['meterage', 'Метраж'], ['color', 'Цвет'], ['format', 'Формат'], ['packaging', 'Упаковка'],
    ['unit', 'Единица'], ['minOrder', 'Минимальная партия']
  ];
  var CARD_SPECS = ['composition', 'micron', 'nm', 'color', 'format', 'packaging', 'minOrder'];

  var state = { cat: 'all', f: {} };
  var animate = false;

  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }
  function inCat(cat) { return PRODUCTS.filter(function (p) { return cat === 'all' || p.cat === cat; }); }
  function valuesOf(list, key) {
    var seen = [];
    list.forEach(function (p) { if (has(p[key]) && seen.indexOf(p[key]) < 0) seen.push(p[key]); });
    return seen;
  }
  function activeGroups() {
    if (state.cat === 'all') return [];
    var list = inCat(state.cat);
    return (FILTERS[state.cat] || []).filter(function (g) { return valuesOf(list, g[0]).length >= 2; });
  }
  function matches(p) {
    if (state.cat !== 'all' && p.cat !== state.cat) return false;
    return Object.keys(state.f).every(function (k) { return p[k] === state.f[k]; });
  }

  // ---------- Адрес страницы ↔ состояние ----------
  function readUrl() {
    var q = new URLSearchParams(location.search);
    state.cat = CATS[q.get('cat')] ? q.get('cat') : 'all';
    state.f = {};
    (FILTERS[state.cat] || []).forEach(function (g) { if (q.get(g[0])) state.f[g[0]] = q.get(g[0]); });
    return q.get('product');
  }
  function writeUrl(productId) {
    var q = new URLSearchParams();
    if (state.cat !== 'all') q.set('cat', state.cat);
    Object.keys(state.f).forEach(function (k) { q.set(k, state.f[k]); });
    if (productId) q.set('product', productId);
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  // ---------- Фильтры ----------
  function renderFilters() {
    var cats = ['all'].concat(Object.keys(CATS));
    $('filter-category').innerHTML = cats.map(function (c) {
      var n = inCat(c).length, name = c === 'all' ? 'Все позиции' : CATS[c].plural;
      return '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="' + (state.cat === c) + '">' +
        esc(name) + '<span class="chip-count" aria-label="' + n + ' ' + plural(n, 'позиция', 'позиции', 'позиций') + '">' + n + '</span></button>';
    }).join('');

    var list = inCat(state.cat);
    $('filter-extra').innerHTML = activeGroups().map(function (g) {
      var vals = valuesOf(list, g[0]);
      return '<fieldset class="filter-group"><legend>' + g[1] + '</legend><div class="chips">' +
        '<button class="chip" type="button" data-key="' + g[0] + '" data-val="" aria-pressed="' + !state.f[g[0]] + '">Все</button>' +
        vals.map(function (v) {
          return '<button class="chip" type="button" data-key="' + g[0] + '" data-val="' + esc(v) + '" aria-pressed="' + (state.f[g[0]] === v) + '">' + esc(v) + '</button>';
        }).join('') + '</div></fieldset>';
    }).join('');
  }

  // ---------- Карточки ----------
  function card(p, i) {
    var c = CATS[p.cat];
    var specs = CARD_SPECS.filter(function (k) { return has(p[k]); }).map(function (k) {
      var label = SPECS.filter(function (s) { return s[0] === k; })[0][1];
      return '<dt>' + label + '</dt><dd>' + esc(p[k]) + '</dd>';
    }).join('');
    return '<article class="product-card' + (animate ? ' is-entering' : '') + '" style="--i:' + i + '">' +
      '<div class="product-media"><img src="' + esc(p.photo.src) + '" width="' + p.photo.w + '" height="' + p.photo.h + '" alt="' + esc(p.photo.alt) + '" loading="lazy" decoding="async">' +
        '<span class="badge badge-sand">' + esc(c.name) + '</span>' +
        (p.photo.stock ? '<span class="stock-note">Иллюстрация</span>' : '') + '</div>' +
      '<div class="product-body">' +
        '<h3><button type="button" data-open="' + p.id + '">' + esc(p.name) + '</button></h3>' +
        '<p class="product-summary">' + esc(p.summary) + '</p>' +
        '<dl class="specs">' + specs + '</dl>' +
        '<div></div>' +
        '<div class="product-actions">' +
          '<button class="btn btn-primary btn-sm" type="button" data-request="kp" data-product="' + p.id + '">Получить КП</button>' +
          '<button class="btn btn-outline btn-sm" type="button" data-request="sample" data-product="' + p.id + '">Запросить образец</button>' +
          '<button class="reset-btn details" type="button" data-open="' + p.id + '">Все характеристики<span class="sr-only">: ' + esc(p.name) + '</span></button>' +
        '</div>' +
      '</div></article>';
  }
  function renderGrid() {
    var list = PRODUCTS.filter(matches), grid = $('product-grid');
    var n = list.length;
    $('results-count').innerHTML = 'Найдено: <b>' + n + '</b> ' + plural(n, 'позиция', 'позиции', 'позиций');
    $('filters-reset').hidden = state.cat === 'all' && !Object.keys(state.f).length;
    grid.innerHTML = n ? list.map(card).join('') :
      '<div class="empty-state"><p><b>По выбранным фильтрам ничего не найдено.</b></p><p class="muted">Сбросьте фильтры или опишите нужную позицию в заявке — подберём вариант.</p>' +
      '<div class="section-foot" style="margin:0"><button class="btn btn-outline" type="button" data-reset>Сбросить фильтры</button><button class="btn btn-primary" type="button" data-request="kp">Получить КП</button></div></div>';
  }
  function update(opts) {
    animate = !!(opts && opts.animate) && KS.motionOK;
    renderFilters(); renderGrid(); writeUrl();
    animate = false;
  }
  function reset() { state.cat = 'all'; state.f = {}; update({ animate: true }); }

  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    if (b.dataset.cat) { state.cat = b.dataset.cat; state.f = {}; }
    else if (b.dataset.key) { if (b.dataset.val) state.f[b.dataset.key] = b.dataset.val; else delete state.f[b.dataset.key]; }
    update({ animate: true });
    // после перерисовки возвращаем фокус на ту же кнопку
    var sel = b.dataset.cat ? '[data-cat="' + b.dataset.cat + '"]' : '[data-key="' + b.dataset.key + '"][data-val="' + (b.dataset.val || '') + '"]';
    var again = document.querySelector('#filters ' + sel);
    if (again) again.focus();
  });
  $('filters-reset').addEventListener('click', reset);
  $('product-grid').addEventListener('click', function (e) {
    if (e.target.closest('[data-reset]')) reset();
    var o = e.target.closest('[data-open]');
    if (o) openProduct(o.dataset.open);
  });

  // ---------- Окно товара ----------
  var pd = $('product-dialog'), current = null;
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    current = p;
    $('pd-cat').textContent = CATS[p.cat].plural;
    $('pd-title').textContent = p.name;
    $('pd-summary').textContent = p.summary;
    $('pd-media').innerHTML = '<img src="' + esc(p.photo.src) + '" width="' + p.photo.w + '" height="' + p.photo.h + '" alt="' + esc(p.photo.alt) + '" decoding="async">' +
      (p.photo.stock ? '<span class="stock-note">Иллюстрация</span>' : '');
    $('pd-specs').innerHTML = SPECS.filter(function (s) { return has(p[s[0]]); })
      .map(function (s) { return '<dt>' + s[1] + '</dt><dd>' + esc(p[s[0]]) + '</dd>'; }).join('');
    $('pd-apps').innerHTML = (p.applications || []).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
    var samples = (window.SITE_CONFIG && window.SITE_CONFIG.terms && window.SITE_CONFIG.terms.samples) || '';
    $('pd-variants').textContent = [p.variants, samples ? samples + '.' : '', 'Нужные документы по партии укажите в заявке.'].filter(has).join(' ');
    KS.openDialog(pd);
    writeUrl(p.id);
  }
  function requestFrom(type) {
    var id = current && current.id;
    KS.closeDialog(pd, function () { writeUrl(); KS.openRequest({ type: type, productId: id }); });
  }
  $('pd-kp').addEventListener('click', function () { requestFrom('kp'); });
  $('pd-sample').addEventListener('click', function () { requestFrom('sample'); });
  pd.addEventListener('close', function () { writeUrl(); });

  // ---------- Сравнение характеристик ----------
  function renderCompare() {
    var cols = [['cat', 'Категория'], ['composition', 'Состав'], ['micron', 'Тонина'], ['staple', 'Длина волокна'], ['nm', 'Номер нити'],
      ['color', 'Цвет'], ['format', 'Формат'], ['packaging', 'Упаковка'], ['minOrder', 'Мин. партия'], ['applications', 'Применение']];
    var val = function (p, k) { return k === 'cat' ? CATS[p.cat].name : k === 'applications' ? (p.applications || []).join(', ') : p[k]; };
    cols = cols.filter(function (c) { return PRODUCTS.some(function (p) { return has(val(p, c[0])); }); });
    var table = '<table class="compare-table"><caption class="sr-only">Характеристики всех позиций каталога</caption><thead><tr><th scope="col">Позиция</th>' +
      cols.map(function (c) { return '<th scope="col">' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      PRODUCTS.map(function (p) {
        return '<tr><th scope="row">' + esc(p.name) + '</th>' + cols.map(function (c) { var v = val(p, c[0]); return '<td>' + (has(v) ? esc(v) : '<span class="muted">по запросу</span>') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    var cards = '<div class="compare-cards">' + PRODUCTS.map(function (p) {
      return '<article><h3>' + esc(p.name) + '</h3><dl class="specs">' + cols.map(function (c) {
        var v = val(p, c[0]);
        return has(v) ? '<dt>' + c[1] + '</dt><dd>' + esc(v) + '</dd>' : '';
      }).join('') + '</dl></article>';
    }).join('') + '</div>';
    $('compare').innerHTML = table + cards;
  }

  var startProduct = readUrl();
  update();
  renderCompare();
  if (startProduct && byId[startProduct]) openProduct(startProduct);
})();
