/*
 * «Кавказская шерсть» — общий скрипт всех страниц.
 * Контакты и условия из config.js · шапка и мобильное меню · появление блоков ·
 * FAQ-аккордеон · окна · форма заявки (КП / образец).
 * Без библиотек. Открыть заявку из любого скрипта: window.KS.openRequest({ type, category, productId }).
 */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var C = CFG.contacts || {}, CO = CFG.company || {}, T = CFG.terms || {}, F = CFG.form || {};
  var DATA = window.SHOP_DATA || { PRODUCTS: [], CATEGORIES: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var has = function (v) { return v !== null && v !== undefined && String(v).trim() !== ''; };
  var motionOK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Контакты и реквизиты из конфигурации ----------
  var tg = has(C.telegram) ? C.telegram.replace(/^@/, '') : '';
  var CONTACT = {
    phone: has(C.phone) && { text: C.phone, href: 'tel:' + C.phone.replace(/[^\d+]/g, ''), label: 'Телефон' },
    email: has(C.email) && { text: C.email, href: 'mailto:' + C.email, label: 'Email' },
    whatsapp: has(C.whatsapp) && { text: 'WhatsApp', href: 'https://wa.me/' + C.whatsapp.replace(/\D/g, ''), label: 'WhatsApp', external: true },
    telegram: tg && { text: '@' + tg, href: 'https://t.me/' + tg, label: 'Telegram', external: true },
    workHours: has(C.workHours) && { text: C.workHours, label: 'Режим работы' }
  };
  function formReady() {
    return has(F.endpoint) && (F.endpoint.indexOf('web3forms') < 0 || has(F.accessKey));
  }

  function bindConfig() {
    $$('[data-contact]').forEach(function (el) {
      var c = CONTACT[el.dataset.contact];
      if (!c) { el.hidden = true; return; }
      el.textContent = c.text;
      if (el.tagName === 'A') {
        el.href = c.href;
        if (c.external) { el.target = '_blank'; el.rel = 'noopener'; }
      }
      el.hidden = false;
    });
    $$('[data-if]').forEach(function (el) { el.hidden = !CONTACT[el.dataset.if]; });
    $$('[data-if-any]').forEach(function (el) { el.hidden = !el.dataset.ifAny.split(' ').some(function (k) { return CONTACT[k]; }); });
    $$('[data-if-all]').forEach(function (el) { el.hidden = !el.dataset.ifAll.split(' ').every(function (k) { return CONTACT[k]; }); });
    $$('[data-company]').forEach(function (el) {
      var v = CO[el.dataset.company];
      if (has(v)) el.textContent = v;
      else if (el.dataset.fallback) el.textContent = el.dataset.fallback;
    });
    $$('[data-if-company]').forEach(function (el) { el.hidden = !has(CO[el.dataset.ifCompany]); });
    var formOn = formReady();
    $$('[data-if-form]').forEach(function (el) { el.hidden = !formOn; });
    $$('[data-if-no-form]').forEach(function (el) { el.hidden = formOn; });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    var req = $('[data-requisites-block]');
    if (req) req.hidden = !['legalName', 'inn', 'ogrn', 'legalAddress'].some(function (k) { return has(CO[k]); });

    // Карточки контактов на странице «Контакты»
    var cards = $('[data-contact-cards]');
    if (cards) {
      var items = ['phone', 'email', 'whatsapp', 'telegram'].filter(function (k) { return CONTACT[k]; });
      cards.innerHTML = items.map(function (k) {
        var c = CONTACT[k];
        return '<div class="contact-card"><dt>' + c.label + '</dt><dd><a href="' + esc(c.href) + '"' +
          (c.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(c.text) + '</a></dd></div>';
      }).join('');
      if (!items.length) {
        cards.outerHTML = '<p class="muted">Напишите нам через форму заявки — укажите email и телефон, и менеджер свяжется с вами.</p>';
      }
    }

    // Условия поставки
    var TERMS = [['minOrder', 'Объём партии'], ['samples', 'Образцы'], ['payment', 'Оплата'], ['delivery', 'Доставка'],
      ['geography', 'География'], ['packaging', 'Упаковка'], ['productionTime', 'Срок изготовления'], ['shipTime', 'Срок отгрузки'], ['documents', 'Документы']];
    $$('[data-terms]').forEach(function (dl) {
      var rows = TERMS.filter(function (t) { return has(T[t[0]]); });
      dl.innerHTML = rows.map(function (t) { return '<div class="term"><dt>' + t[1] + '</dt><dd>' + esc(T[t[0]]) + '</dd></div>'; }).join('');
      var sec = dl.closest('[data-terms-section]');
      if (sec) sec.hidden = !rows.length;
    });

    // Документы
    var docs = $('[data-docs]'), docsEmpty = $('[data-docs-empty]'), list = (CFG.documents || []).filter(function (d) { return has(d.title) && has(d.file); });
    if (docs) {
      docs.innerHTML = list.map(function (d) {
        return '<li class="doc"><svg aria-hidden="true"><use href="#i-doc"/></svg><div><b>' + esc(d.title) + '</b>' +
          '<small>' + [d.type, d.date, d.confirms].filter(has).map(esc).join(' · ') + '</small></div>' +
          '<a class="btn btn-outline btn-sm" href="' + esc(d.file) + '" target="_blank" rel="noopener">Открыть PDF<span class="sr-only">: ' + esc(d.title) + '</span></a></li>';
      }).join('');
      docs.hidden = !list.length;
      if (docsEmpty) docsEmpty.hidden = !!list.length;
    }

    // Реальные фото производства: заменяют значки этапов и собирают галерею
    var photos = CFG.productionPhotos || {}, keys = Object.keys(photos).filter(function (k) { return photos[k] && has(photos[k].src); });
    $$('[data-stage]').forEach(function (li) {
      var p = photos[li.dataset.stage];
      if (!p || !has(p.src)) return;
      var box = $('.stage-media', li), svg = $('svg', box);
      if (svg) svg.remove();
      box.insertAdjacentHTML('beforeend', '<img src="' + esc(p.src) + '" alt="' + esc(p.alt || '') + '" loading="lazy" decoding="async" width="800" height="450">');
    });
    var gallery = $('[data-production-gallery]');
    if (gallery && keys.length) {
      $('[data-gallery]', gallery).innerHTML = keys.map(function (k) {
        return '<figure class="cat-card" style="margin:0"><div class="media"><img src="' + esc(photos[k].src) + '" alt="' + esc(photos[k].alt || '') + '" loading="lazy" decoding="async" width="800" height="600"></div></figure>';
      }).join('');
      gallery.hidden = false;
    }

    // Подсказка владельцу сайта: что не заполнено в config.js
    var missing = [];
    if (!CONTACT.phone && !CONTACT.email) missing.push('contacts.phone / contacts.email');
    if (!formReady()) missing.push('form.accessKey (или свой form.endpoint)');
    if (!has(CO.legalName)) missing.push('company.legalName и реквизиты');
    if (missing.length && window.console) console.info('[Кавказская шерсть] Заполните в js/config.js: ' + missing.join(', '));
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- Блокировка прокрутки (меню, окна) ----------
  var locks = 0;
  function lockScroll(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.body.classList.toggle('scroll-lock', locks > 0);
  }

  // ---------- Шапка и мобильное меню ----------
  var header = $('.site-header'), nav = $('#site-nav'), toggle = $('.menu-toggle');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 4); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function menuOpen() { return nav && nav.classList.contains('is-open'); }
  function openMenu() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Закрыть меню');
    lockScroll(true);
    var first = $('a', nav);
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeMenu(focusToggle) {
    if (!menuOpen()) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    lockScroll(false);
    if (focusToggle) toggle.focus();
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { menuOpen() ? closeMenu(true) : openMenu(); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (!menuOpen()) return;
      if (e.key === 'Escape') { closeMenu(true); return; }
      if (e.key === 'Tab') {
        // Фокус не уходит из открытого меню: кнопка меню + ссылки
        var f = [toggle].concat($$('a:not([hidden])', nav)), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    var desk = window.matchMedia('(min-width: 1024px)');
    var onDesk = function (e) { if (e.matches) closeMenu(false); };
    if (desk.addEventListener) desk.addEventListener('change', onDesk); else desk.addListener(onDesk);
  }

  // ---------- Плавное появление блоков ----------
  function initReveal() {
    var els = $$('.reveal');
    if (!motionOK || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el, i) {
      var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  // ---------- FAQ-аккордеон: открыт один вопрос ----------
  function initAccordion() {
    $$('[data-accordion]').forEach(function (acc) {
      var triggers = $$('.acc-trigger', acc);
      function set(btn, open) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
      }
      triggers.forEach(function (btn, i) {
        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') !== 'true';
          triggers.forEach(function (b) { set(b, false); });
          set(btn, open);
        });
        // Стрелки вверх/вниз, Home/End — между вопросами
        btn.addEventListener('keydown', function (e) {
          var n = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: triggers.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault();
          triggers[(n + triggers.length) % triggers.length].focus();
        });
      });
    });
  }

  // ---------- Окна (<dialog>) ----------
  var lastFocus = null;
  function openDialog(d) {
    lastFocus = document.activeElement;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    lockScroll(true);
  }
  function closeDialog(d, done) {
    if (!d.open) return;
    var finish = function () {
      d.classList.remove('is-closing');
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      lockScroll(false);
      if (done) done();
      else if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    };
    if (!motionOK) return finish();
    d.classList.add('is-closing');
    setTimeout(finish, 200);
  }
  $$('dialog.dialog').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-close]')) closeDialog(d);
    });
  });

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3500);
  }

  // ---------- Заявка ----------
  var dlg = $('#request-dialog'), form = $('#request-form'), result = $('#request-result');
  var PRODUCTS = DATA.PRODUCTS || [], CATS = DATA.CATEGORIES || {};
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var TYPES = {
    kp: { eyebrow: 'Заявка', title: 'Получить коммерческое предложение', intro: 'Менеджер рассчитает стоимость под ваш объём и пришлёт КП и счёт на email. Оплата — по безналичному расчёту.' },
    sample: { eyebrow: 'Образец', title: 'Запросить образец', intro: 'Отправим образец, чтобы вы проверили сырьё или пряжу на своём оборудовании. Укажите позицию и город доставки в комментарии.' },
    both: { eyebrow: 'Заявка', title: 'КП и образец', intro: 'Пришлём КП и счёт на email и отправим образец для проверки. Укажите позицию, объём и город доставки.' }
  };
  var submitting = false;

  function field(id) { return document.getElementById(id); }
  function currentType() { var r = form.querySelector('input[name="type"]:checked'); return r ? r.value : 'kp'; }

  function fillProducts(keepId) {
    var cat = field('f-category').value, sel = field('f-product');
    var list = PRODUCTS.filter(function (p) { return !cat || p.cat === cat; });
    sel.innerHTML = '<option value="">' + (cat ? 'Любая позиция направления' : 'Не выбрана') + '</option>' +
      list.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('');
    sel.value = keepId && list.some(function (p) { return p.id === keepId; }) ? keepId : '';
    syncYarn();
  }
  function syncYarn() {
    var p = byId[field('f-product').value], yarn = field('f-category').value === 'yarn' || (p && p.cat === 'yarn');
    field('f-yarn').hidden = !yarn;
    if (p && p.cat === 'yarn' && p.format && !field('f-format').value) field('f-format').value = p.format;
  }
  function syncType() {
    var t = TYPES[currentType()];
    field('request-eyebrow').textContent = t.eyebrow;
    field('request-title').textContent = t.title;
    field('request-intro').textContent = t.intro;
    var volumeReq = currentType() !== 'sample';
    $('[data-volume-req]', form).hidden = !volumeReq;
    $('[data-volume-opt]', form).hidden = volumeReq;
    if (!volumeReq) setError('f-volume', '');
  }

  // Проверки полей: возвращают текст ошибки или ''
  var RULES = {
    'f-volume': function (v) {
      v = v.trim().replace(',', '.').replace(/\s/g, '');
      if (!v) return currentType() === 'sample' ? '' : 'Укажите объём партии — хотя бы примерно';
      if (!/^\d+(\.\d+)?$/.test(v)) return 'Укажите объём числом, например 500 или 1,5';
      var n = parseFloat(v);
      if (!(n > 0)) return 'Объём должен быть больше нуля';
      if (field('f-unit').value === 'т' && n > 100000) return 'Проверьте объём: больше 100 000 т';
      if (field('f-unit').value === 'кг' && n > 100000000) return 'Проверьте объём';
      return '';
    },
    'f-name': function (v) { return v.trim().length >= 2 ? '' : 'Укажите компанию или имя'; },
    'f-email': function (v) {
      v = v.trim();
      if (!v) return 'Укажите email — на него придут КП и счёт';
      return /^[^\s@]+@[^\s@]+\.[a-zа-яё]{2,}$/i.test(v) ? '' : 'Проверьте email: например, zakupki@company.ru';
    },
    'f-phone': function (v) {
      var d = v.replace(/\D/g, '');
      if (!d) return 'Укажите телефон для связи';
      if (/[^\d\s()+\-]/.test(v)) return 'В телефоне допустимы цифры, пробелы, скобки, «+» и «-»';
      return d.length >= 10 && d.length <= 15 ? '' : 'Проверьте номер: например, +7 900 123-45-67';
    },
    'f-consent': function () { return field('f-consent').checked ? '' : 'Нужно согласие на обработку данных'; }
  };
  function setError(id, msg) {
    var input = field(id), wrap = input.closest('.field'), err = field(id + '-error');
    if (wrap) wrap.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }
  function check(id) { return setError(id, RULES[id](field(id).value || '')); }

  function resetForm() {
    form.reset();
    form.hidden = false; result.hidden = true;
    result.classList.remove('is-manual');
    Object.keys(RULES).forEach(function (id) { setError(id, ''); });
    field('form-error').hidden = true;
    setLoading(false);
    submitting = false;
  }
  function setLoading(on) {
    var b = field('f-submit');
    b.disabled = on;
    b.classList.toggle('is-loading', on);
    b.setAttribute('aria-busy', on ? 'true' : 'false');
    $('.btn-label', b).textContent = on ? 'Отправляем…' : 'Отправить заявку';
  }

  function openRequest(opts) {
    if (!dlg) return;
    opts = opts || {};
    closeMenu(false);
    resetForm();
    var p = byId[opts.productId];
    var type = TYPES[opts.type] ? opts.type : 'kp';
    form.querySelector('input[name="type"][value="' + type + '"]').checked = true;
    field('f-category').value = p ? p.cat : (CATS[opts.category] ? opts.category : '');
    fillProducts(p ? p.id : '');
    syncType();
    openDialog(dlg);
    setTimeout(function () { (p ? field('f-volume') : field('f-category')).focus(); }, 50);
  }

  function collect() {
    var p = byId[field('f-product').value], cat = field('f-category').value || (p && p.cat) || '';
    var vol = field('f-volume').value.trim();
    var typeNames = { kp: 'Коммерческое предложение', sample: 'Образец', both: 'КП и образец' };
    return {
      type: typeNames[currentType()],
      category: cat && CATS[cat] ? CATS[cat].plural : 'Не указано',
      product: p ? p.name : 'Не выбрана',
      count: !field('f-yarn').hidden ? field('f-count').value.trim() : '',
      format: !field('f-yarn').hidden ? field('f-format').value : '',
      volume: vol ? vol.replace(',', '.') + ' ' + field('f-unit').value : '',
      name: field('f-name').value.trim(),
      email: field('f-email').value.trim(),
      phone: field('f-phone').value.trim(),
      comment: field('f-comment').value.trim()
    };
  }
  function requestText(d) {
    return [
      'Заявка с сайта «Кавказская шерсть»',
      'Запрос: ' + d.type,
      'Направление: ' + d.category,
      'Позиция: ' + d.product,
      d.count && 'Номер нити: ' + d.count,
      d.format && 'Формат: ' + d.format,
      d.volume && 'Объём партии: ' + d.volume,
      'Компания / имя: ' + d.name,
      'Email: ' + d.email,
      'Телефон: ' + d.phone,
      d.comment && 'Комментарий: ' + d.comment
    ].filter(Boolean).join('\n');
  }

  function showResult(kind, d) {
    var text = requestText(d), channels = field('result-channels'), copy = field('result-copy');
    result.classList.toggle('is-manual', kind !== 'sent');
    if (kind === 'sent') {
      field('result-title').textContent = 'Заявка отправлена';
      field('result-text').textContent = 'Менеджер ответит на ' + d.email + '. Если письма долго нет, проверьте папку «Спам».';
      channels.hidden = true; copy.hidden = true;
    } else {
      field('result-title').textContent = kind === 'error' ? 'Заявку не удалось отправить' : 'Заявка подготовлена, но ещё не отправлена';
      var links = [];
      var subj = encodeURIComponent('Заявка: ' + d.type + ' — ' + d.product);
      if (CONTACT.email) links.push('<a class="btn btn-primary" href="mailto:' + esc(C.email) + '?subject=' + subj + '&body=' + encodeURIComponent(text) + '">Отправить на ' + esc(C.email) + '</a>');
      if (CONTACT.whatsapp) links.push('<a class="btn btn-outline" href="' + CONTACT.whatsapp.href + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">Отправить в WhatsApp</a>');
      if (CONTACT.telegram) links.push('<a class="btn btn-outline" href="' + CONTACT.telegram.href + '" target="_blank" rel="noopener">Открыть Telegram ' + esc(CONTACT.telegram.text) + '</a>');
      if (CONTACT.phone) links.push('<a class="btn btn-outline" href="' + CONTACT.phone.href + '">Позвонить: ' + esc(C.phone) + '</a>');
      var why = kind === 'error'
        ? 'Сервис отправки заявок сейчас недоступен, поэтому заявка не ушла. Ваши данные сохранены.'
        : 'Автоматическая отправка заявок на сайте пока не подключена, поэтому мы не отправили её за вас.';
      field('result-text').textContent = why + (links.length ? ' Текст заявки уже подготовлен:' : ' Скопируйте текст заявки — он понадобится при обращении к нам.');
      channels.innerHTML = links.join('');
      channels.hidden = !links.length;
      field('result-request-text').value = text;
      copy.hidden = false;
    }
    form.hidden = true;
    result.hidden = false;
    result.focus();
  }

  function submitOnline(d) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    var payload = {
      subject: 'Заявка с сайта: ' + d.type + ' — ' + d.product,
      from_name: 'Сайт «Кавказская шерсть»',
      replyto: d.email,
      'Запрос': d.type, 'Направление': d.category, 'Позиция': d.product,
      'Номер нити': d.count || '—', 'Формат': d.format || '—', 'Объём партии': d.volume || '—',
      'Компания / имя': d.name, 'Email': d.email, 'Телефон': d.phone, 'Комментарий': d.comment || '—'
    };
    if (has(F.accessKey)) payload.access_key = F.accessKey;
    return fetch(F.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.success === false) throw new Error(j.message || ('ошибка ' + r.status));
      });
    }).finally(function () { clearTimeout(timer); });
  }

  if (dlg && form) {
    Object.keys(RULES).forEach(function (id) {
      var el = field(id);
      el.addEventListener('blur', function () { if (el.type === 'checkbox' || el.value) check(id); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(id); });
      el.addEventListener('change', function () { if (el.type === 'checkbox') check(id); });
    });
    field('f-unit').addEventListener('change', function () { if (field('f-volume').value) check('f-volume'); });
    // Российский номер из 11 цифр приводим к виду +7 900 123-45-67
    field('f-phone').addEventListener('blur', function () {
      var d = this.value.replace(/\D/g, '');
      if (d.length === 11 && /^[78]/.test(d)) this.value = '+7 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9);
    });
    field('f-category').addEventListener('change', function () { fillProducts(''); });
    field('f-product').addEventListener('change', function () {
      var p = byId[this.value];
      if (p && field('f-category').value !== p.cat) { field('f-category').value = p.cat; fillProducts(p.id); }
      syncYarn();
    });
    $$('input[name="type"]', form).forEach(function (r) { r.addEventListener('change', syncType); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;                        // защита от двойной отправки
      if (form.elements.website.value) return;       // ловушка для ботов
      var firstBad = null;
      Object.keys(RULES).forEach(function (id) { if (!check(id) && !firstBad) firstBad = field(id); });
      if (firstBad) { firstBad.focus(); return; }
      var d = collect();
      field('form-error').hidden = true;
      if (!formReady()) { showResult('manual', d); return; }
      submitting = true;
      setLoading(true);
      submitOnline(d).then(function () {
        showResult('sent', d);
        toast('Заявка отправлена');
      }).catch(function (err) {
        setLoading(false);
        submitting = false;
        var box = field('form-error');
        var offline = navigator.onLine === false, timeout = err && err.name === 'AbortError';
        box.innerHTML = '<b>Заявка не отправлена' + (timeout ? ': сервис не ответил вовремя' : offline ? ': нет подключения к интернету' : ': сервис отправки вернул ошибку') + '.</b>' +
          '<span>' + (offline ? 'Проверьте подключение и попробуйте ещё раз.' : 'Попробуйте ещё раз через минуту или отправьте заявку другим способом.') + '</span>' +
          '<button class="btn btn-outline btn-sm" type="button" id="send-manually" style="justify-self:start">Отправить другим способом</button>';
        box.hidden = false;
        field('send-manually').addEventListener('click', function () { showResult('error', collect()); });
      });
    });

    field('result-copy-btn').addEventListener('click', function () {
      var ta = field('result-request-text'), btn = this;
      var done = function () { btn.textContent = 'Скопировано'; setTimeout(function () { btn.textContent = 'Скопировать текст заявки'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); });
      } else { ta.select(); try { document.execCommand('copy'); done(); } catch (err) { /* текст выделен — можно скопировать вручную */ } }
    });
  }

  // Любая кнопка с data-request открывает заявку: data-request="kp|sample|both",
  // data-category="wool|tops|yarn", data-product="id"
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-request]');
    if (!b) return;
    e.preventDefault();
    openRequest({ type: b.dataset.request, category: b.dataset.category, productId: b.dataset.product });
  });

  window.KS = { openRequest: openRequest, openDialog: openDialog, closeDialog: closeDialog, esc: esc, has: has, motionOK: motionOK, toast: toast };

  bindConfig();
  initReveal();
  initAccordion();
})();
