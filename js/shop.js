// Магазин: разделы сайта, каталог, корзина, оформление и оплата
(function () {
  var D = window.SHOP_DATA, CFG = window.SHOP_CONFIG || { mode: 'demo' };
  var PRODUCTS = D.PRODUCTS, GRADES = D.GRADES;
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return [].slice.call(document.querySelectorAll(sel)); };
  var filters = { grade: 'all', state: 'all', color: 'all' };
  var cart = load();

  // ---------- утилиты ----------
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem('ksh-cart') || '{}'), out = {};
      Object.keys(v || {}).forEach(function (id) { if (byId[id]) out[id] = norm(byId[id], v[id]); });
      return out;
    } catch (e) { return {}; }
  }
  function save() { try { localStorage.setItem('ksh-cart', JSON.stringify(cart)); } catch (e) {} }
  function norm(p, q) {
    q = parseFloat(q);
    if (!(q > 0)) q = p.min;
    q = Math.round(q / p.step) * p.step;
    return Math.max(p.min, Math.min(q, 5000));
  }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ids() { return Object.keys(cart); }
  function total() { return ids().reduce(function (s, id) { return s + byId[id].price * cart[id]; }, 0); }
  function meter(q) {
    var s = '';
    for (var i = 1; i <= 4; i++) s += '<i' + (i <= q ? ' class="on"' : '') + '></i>';
    return '<span class="meter" role="img" aria-label="Качество ' + q + ' из 4">' + s + '</span>';
  }
  function stepper(prefix, p, val) {
    return '<div class="stepper">' +
      '<button type="button" data-dec="' + p.id + '" aria-label="Меньше">−</button>' +
      '<input id="' + prefix + p.id + '" type="number" inputmode="decimal" min="' + p.min + '" step="' + p.step + '" value="' + val + '" data-qty="' + p.id + '" aria-label="Количество, кг">' +
      '<span>кг</span>' +
      '<button type="button" data-inc="' + p.id + '" aria-label="Больше">+</button></div>';
  }
  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- анимации ----------
  var motionOK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var REVEAL = '.perks-grid > div, .head-row, .gtile, .split-img, .split-text, .section-head, .steps li, .cta-box, .gl-row, .breed-col, .info-block, .ccard, .requisites, .filters';
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

  function flyToCart(img) {
    var btn = document.querySelector('.cart-btn');
    if (!motionOK || !img || !btn.animate) return bump();
    var a = img.getBoundingClientRect(), b = btn.getBoundingClientRect();
    var fly = document.createElement('img');
    fly.src = img.src; fly.alt = ''; fly.className = 'flyer';
    fly.style.left = (a.left + a.width / 2 - 32) + 'px';
    fly.style.top = (a.top + a.height / 2 - 32) + 'px';
    document.body.appendChild(fly);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var anim = fly.animate([
      { transform: 'translate(0,0) scale(.6)', opacity: 0 },
      { transform: 'translate(0,-20px) scale(1.1)', opacity: 1, offset: .2 },
      { transform: 'translate(' + dx * .55 + 'px,' + (dy * .45 - 90) + 'px) scale(.8)', opacity: 1, offset: .6 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.25)', opacity: .4 }
    ], { duration: 850, easing: 'cubic-bezier(.45,0,.3,1)' });
    anim.onfinish = function () { fly.remove(); bump(); };
  }
  function bump() {
    var c = document.querySelector('.cart-btn');
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }

  // ---------- разделы сайта ----------
  var PAGES = ['glavnaya', 'o-nas', 'katalog', 'dostavka', 'kontakty', 'oformlenie', 'gotovo'];
  var first = true;
  function route() {
    var page = location.hash.replace('#', '');
    if (page === 'oplata') return handlePaymentReturn();
    if (PAGES.indexOf(page) < 0) page = 'glavnaya';
    if (page === 'oformlenie' && !ids().length) page = 'katalog';
    var shown;
    all('[data-page]').forEach(function (el) {
      var on = el.dataset.page === page;
      if (on && el.hidden) shown = el;
      el.hidden = !on;
    });
    all('#nav a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    closeMenu();
    window.scrollTo(0, 0);
    if (page === 'oformlenie') renderSummary();
    var cur = $('p-' + page);
    if (shown && motionOK && !first) {
      cur.classList.remove('page-in'); void cur.offsetWidth; cur.classList.add('page-in');
    }
    first = false;
    reveal(cur);
  }
  window.addEventListener('hashchange', route);

  function closeMenu() { $('nav').classList.remove('open'); $('menu-btn').setAttribute('aria-expanded', 'false'); }
  $('menu-btn').addEventListener('click', function () {
    var open = $('nav').classList.toggle('open');
    this.setAttribute('aria-expanded', open);
  });

  // Плитки сортов на главной открывают каталог с нужным фильтром
  all('[data-grade-link]').forEach(function (a) {
    a.addEventListener('click', function () { setFilter('grade', a.dataset.gradeLink); });
  });
  Object.keys(GRADES).forEach(function (g) {
    var min = Math.min.apply(null, PRODUCTS.filter(function (p) { return p.grade === g; }).map(function (p) { return p.price; }));
    all('[data-minprice="' + g + '"]').forEach(function (el) { el.textContent = 'от ' + rub(min) + ' за кг'; });
  });

  // ---------- каталог ----------
  var animateGrid = false;
  function setFilter(key, val) {
    filters[key] = val;
    all('[data-f="' + key + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.v === val); });
    animateGrid = true; renderGrid(); animateGrid = false;
  }
  function renderGrid() {
    var list = PRODUCTS.filter(function (p) {
      return (filters.grade === 'all' || p.grade === filters.grade) &&
             (filters.state === 'all' || p.state === filters.state) &&
             (filters.color === 'all' || p.color === filters.color);
    });
    $('found').textContent = 'Товаров: ' + list.length;
    var grid = $('grid');
    if (!list.length) {
      grid.innerHTML = '<div class="empty"><p>По этим фильтрам ничего нет.</p><button class="btn ghost" type="button" data-reset>Сбросить фильтры</button></div>';
      return;
    }
    grid.innerHTML = list.map(function (p, i) {
      var g = GRADES[p.grade], inCart = cart[p.id];
      return '<article class="card' + (animateGrid ? ' enter' : '') + '" style="--i:' + i + '" data-card="' + p.id + '">' +
        '<div class="photo"><img src="assets/photos/' + p.id + '.jpg" alt="' + esc(p.name) + '" loading="lazy">' +
          '<span class="tag">' + esc(p.state) + ' · ' + esc(p.color.toLowerCase()) + '</span></div>' +
        '<div class="card-body">' +
          '<div class="card-top"><span class="pill">' + g.name + '</span>' + meter(g.q) + '</div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p class="breed">' + esc(p.breed) + ' порода · <span class="mono">' + esc(p.micron) + '</span></p>' +
          '<p class="use">' + esc(p.use) + '</p>' +
          '<div class="buy">' +
            '<div class="price"><b>' + rub(p.price) + '</b> / кг' + (p.min > 1 ? '<small>от ' + p.min + ' кг</small>' : '') + '</div>' +
            stepper('q-', p, p.min) +
            '<button class="btn add" type="button" data-add="' + p.id + '">В корзину</button>' +
            '<p class="incart"' + (inCart ? '' : ' hidden') + '>В корзине: <b>' + (inCart || 0) + ' кг</b></p>' +
          '</div>' +
        '</div></article>';
    }).join('');
  }

  function stepInput(input, dir) {
    var p = byId[input.dataset.qty];
    input.value = norm(p, (parseFloat(input.value) || p.min) + dir * p.step);
  }

  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]');
    if (b) setFilter(b.dataset.f, b.dataset.v);
  });

  $('grid').addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-reset]')) { ['grade', 'state', 'color'].forEach(function (k) { setFilter(k, 'all'); }); return; }
    if ((t = e.target.closest('[data-dec]'))) return stepInput($('q-' + t.dataset.dec), -1);
    if ((t = e.target.closest('[data-inc]'))) return stepInput($('q-' + t.dataset.inc), 1);
    if ((t = e.target.closest('[data-add]'))) {
      var p = byId[t.dataset.add], input = $('q-' + p.id);
      var q = norm(p, input.value);
      input.value = q;
      cart[p.id] = norm(p, (cart[p.id] || 0) + q);
      save(); renderCart(); refreshCard(p.id);
      flyToCart(t.closest('.card').querySelector('.photo img'));
      t.classList.add('done'); t.textContent = 'Добавлено ✓';
      setTimeout(function () { t.classList.remove('done'); t.textContent = 'В корзину'; }, 1400);
      toast('Добавлено в корзину: ' + p.name + ', ' + q + ' кг');
    }
  });
  $('grid').addEventListener('change', function (e) {
    var id = e.target.dataset.qty;
    if (id) e.target.value = norm(byId[id], e.target.value);
  });
  function refreshCard(id) {
    var card = document.querySelector('[data-card="' + id + '"]');
    if (!card) return;
    var note = card.querySelector('.incart');
    note.hidden = !cart[id];
    if (cart[id]) note.innerHTML = 'В корзине: <b>' + cart[id] + ' кг</b>';
  }

  // ---------- корзина ----------
  function renderCart() {
    var list = ids(), sum = total();
    all('[data-cart-count]').forEach(function (el) { el.textContent = list.length; el.dataset.n = list.length; });
    all('[data-cart-sum]').forEach(function (el) { el.textContent = rub(sum); });
    var box = $('cart-items');
    if (!list.length) {
      box.innerHTML = '<p class="cart-empty">Корзина пуста. Выберите шерсть в <a href="#katalog" data-close-cart>каталоге</a>.</p>';
    } else {
      box.innerHTML = list.map(function (id) {
        var p = byId[id];
        return '<div class="line"><img src="assets/photos/' + id + '.jpg" alt="" loading="lazy">' +
          '<div class="line-info"><b>' + esc(p.name) + '</b><span>' + esc(p.breed) + ' · ' + rub(p.price) + '/кг</span></div>' +
          '<button class="rm" type="button" data-rm="' + id + '" aria-label="Удалить">×</button>' +
          stepper('c-', p, cart[id]) +
          '<div class="line-sum">' + rub(p.price * cart[id]) + '</div></div>';
      }).join('');
    }
    $('to-checkout').disabled = !list.length;
    renderSummary();
  }

  function openCart() { $('cart').hidden = false; $('scrim').hidden = false; document.body.classList.add('lock'); $('cart-close').focus(); }
  function closeCart() {
    var c = $('cart'), s = $('scrim');
    if (c.hidden) return;
    document.body.classList.remove('lock');
    if (!motionOK) { c.hidden = true; s.hidden = true; return; }
    c.classList.add('closing'); s.classList.add('closing');
    setTimeout(function () { c.hidden = true; s.hidden = true; c.classList.remove('closing'); s.classList.remove('closing'); }, 280);
  }
  all('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  $('cart-close').addEventListener('click', closeCart);
  $('scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('cart').hidden) closeCart(); });

  $('cart-items').addEventListener('click', function (e) {
    var t, id, p;
    if (e.target.closest('[data-close-cart]')) return closeCart();
    if ((t = e.target.closest('[data-rm]'))) { id = t.dataset.rm; delete cart[id]; }
    else if ((t = e.target.closest('[data-dec]'))) { id = t.dataset.dec; p = byId[id]; if (cart[id] - p.step >= p.min) cart[id] = norm(p, cart[id] - p.step); }
    else if ((t = e.target.closest('[data-inc]'))) { id = t.dataset.inc; cart[id] = norm(byId[id], cart[id] + byId[id].step); }
    else return;
    save(); renderCart(); refreshCard(id);
  });
  $('cart-items').addEventListener('change', function (e) {
    var id = e.target.dataset.qty;
    if (!id) return;
    cart[id] = norm(byId[id], e.target.value);
    save(); renderCart(); refreshCard(id);
  });
  $('to-checkout').addEventListener('click', function () { closeCart(); location.hash = 'oformlenie'; });

  // ---------- оформление ----------
  function delivery() { var r = document.querySelector('input[name="delivery"]:checked'); return r ? r.value : 'cdek'; }
  function renderSummary() {
    var list = ids(), sum = total(), d = delivery();
    $('sum-items').innerHTML = list.map(function (id) {
      var p = byId[id];
      return '<li><span>' + esc(p.name) + ' <small>' + cart[id] + ' кг × ' + rub(p.price) + '</small></span><b>' + rub(p.price * cart[id]) + '</b></li>';
    }).join('') || '<li><span class="muted">Корзина пуста</span></li>';
    $('sum-goods').textContent = rub(sum);
    $('sum-delivery').textContent = d === 'pickup' ? 'бесплатно' : 'при получении';
    $('sum-total').textContent = rub(sum);
    $('pay-btn').textContent = 'Оплатить ' + rub(sum);
    $('pay-btn').disabled = !list.length;
  }
  $('checkout-form').addEventListener('change', function (e) {
    if (e.target.name === 'delivery') {
      $('addr-fields').hidden = delivery() === 'pickup';
      renderSummary();
    }
  });

  function setErr(id, msg) {
    var box = $(id).closest('.field');
    box.classList.toggle('bad', !!msg);
    box.querySelector('.err').textContent = msg || '';
    return !msg;
  }

  $('checkout-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('f-name').value.trim(), phone = $('f-phone').value.replace(/[^\d+]/g, ''), email = $('f-email').value.trim();
    var d = delivery(), city = $('f-city').value.trim(), addr = $('f-addr').value.trim();
    var ok = true;
    ok = setErr('f-name', name ? '' : 'Укажите имя') && ok;
    ok = setErr('f-phone', phone.replace(/\D/g, '').length >= 10 ? '' : 'Укажите телефон, например +7 900 123-45-67') && ok;
    ok = setErr('f-email', !email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? '' : 'Проверьте адрес почты') && ok;
    ok = setErr('f-city', d === 'pickup' || city ? '' : 'Укажите город') && ok;
    ok = setErr('f-addr', d === 'pickup' || addr ? '' : 'Укажите адрес или пункт выдачи') && ok;
    ok = setErr('f-agree', $('f-agree').checked ? '' : 'Нужно согласие, чтобы оформить заказ') && ok;
    if (!ok) { var bad = document.querySelector('.bad input, .bad textarea'); if (bad) bad.focus(); return; }

    var order = {
      items: ids().map(function (id) { return { id: id, kg: cart[id] }; }),
      customer: { name: name, phone: phone, email: email },
      delivery: { method: d, city: city, address: addr },
      comment: $('f-comment').value.trim()
    };
    var btn = $('pay-btn'), msg = $('pay-msg');
    msg.textContent = '';

    if (CFG.mode !== 'live') return finish('Д-' + String(Date.now()).slice(-6), true);

    btn.disabled = true; btn.textContent = 'Переходим к оплате…';
    fetch(CFG.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.confirmation_url) throw new Error(res.j && res.j.error || 'Не удалось создать платёж');
        try { localStorage.setItem('ksh-last-order', res.j.orderId); } catch (e) {}
        window.location.href = res.j.confirmation_url;
      })
      .catch(function (err) {
        msg.textContent = err.message + '. Попробуйте ещё раз или позвоните нам.';
        renderSummary();
      });
  });

  function finish(orderId, demo) {
    $('done-title').textContent = demo ? 'Заказ оформлен' : 'Заказ оплачен';
    $('done-id').textContent = orderId;
    $('done-text').textContent = demo
      ? 'Это демо-режим: оплата не подключена, деньги не списаны. После запуска сервера здесь откроется страница оплаты ЮKassa.'
      : 'Спасибо! Оплата получена. Мы позвоним, чтобы согласовать отправку.';
    cart = {}; save(); renderCart(); renderGrid();
    location.hash = 'gotovo';
  }

  // Возврат со страницы оплаты ЮKassa: проверяем, прошла ли оплата
  function handlePaymentReturn() {
    var last = '';
    try { last = localStorage.getItem('ksh-last-order') || ''; } catch (e) {}
    if (CFG.mode !== 'live' || !last) { location.hash = 'glavnaya'; return; }
    fetch(CFG.api + '/' + encodeURIComponent(last))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.status === 'paid') return finish(last, false);
        location.hash = 'oformlenie';
        $('pay-msg').textContent = j.status === 'pending'
          ? 'Оплата ещё обрабатывается. Обновите страницу через минуту.'
          : 'Оплата не прошла или была отменена. Корзина сохранена, попробуйте ещё раз.';
      })
      .catch(function () { location.hash = 'oformlenie'; $('pay-msg').textContent = 'Не удалось проверить оплату. Позвоните нам, мы уточним статус заказа.'; });
  }

  renderGrid();
  renderCart();
  route();
})();
