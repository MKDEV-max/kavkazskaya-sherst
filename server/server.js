// Сервер магазина «Кавказская шерсть»: отдаёт сайт и принимает оплату через ЮKassa.
// Запуск: node server/server.js   (нужен Node.js 18 или новее, внешних пакетов нет)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
loadEnv(path.join(ROOT, '.env'));

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET = process.env.YOOKASSA_SECRET_KEY;
// Ставка НДС для чека: 1 — без НДС (УСН, патент), 2 — 0%, 4 — 20%, 11 — 5% ...
const VAT_CODE = Number(process.env.VAT_CODE) || 1;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

const { PRODUCTS } = require('../js/products.js');
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const DELIVERY = { cdek: 'СДЭК до пункта выдачи', tk: 'Транспортная компания', pickup: 'Самовывоз' };

const DATA_DIR = path.join(ROOT, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

if (!SHOP_ID || !SECRET) console.warn('⚠ Не заданы YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env — оплата работать не будет.');

// ---------- заказы ----------
function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch { return {}; }
}
function saveOrder(order) {
  const all = readOrders();
  all[order.id] = order;
  fs.writeFileSync(ORDERS_FILE + '.tmp', JSON.stringify(all, null, 2));
  fs.renameSync(ORDERS_FILE + '.tmp', ORDERS_FILE);
}
function newOrderId() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  return `${ymd}-${crypto.randomInt(1000, 9999)}`;
}

// Проверяем заказ и считаем сумму только по серверному каталогу
function buildOrder(body) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 50) throw new Error('Корзина пуста');
  const lines = items.map(it => {
    const p = byId[it.id];
    const kg = Number(it.kg);
    if (!p) throw new Error('Товар не найден, обновите страницу');
    if (!(kg >= p.min) || kg > 5000 || Math.abs(kg / p.step - Math.round(kg / p.step)) > 1e-9) {
      throw new Error(`Неверное количество для «${p.name}»: от ${p.min} кг, шаг ${p.step} кг`);
    }
    return { id: p.id, name: p.name, breed: p.breed, kg, price: p.price, sum: p.price * kg };
  });
  const c = body.customer || {};
  const name = String(c.name || '').trim().slice(0, 120);
  const phone = String(c.phone || '').replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7');
  const email = String(c.email || '').trim().slice(0, 120);
  if (!name) throw new Error('Укажите имя');
  if (phone.length < 10 || phone.length > 15) throw new Error('Проверьте телефон');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Проверьте адрес почты');
  const d = body.delivery || {};
  const method = DELIVERY[d.method] ? d.method : 'cdek';
  const city = String(d.city || '').trim().slice(0, 120);
  const address = String(d.address || '').trim().slice(0, 300);
  if (method !== 'pickup' && (!city || !address)) throw new Error('Укажите город и адрес доставки');
  return {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: 'new',
    lines,
    total: lines.reduce((s, l) => s + l.sum, 0),
    customer: { name, phone, email },
    delivery: { method, city, address },
    comment: String(body.comment || '').trim().slice(0, 1000)
  };
}

// ---------- ЮKassa ----------
async function yk(method, url, body, idemKey) {
  const headers = {
    Authorization: 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64'),
    'Content-Type': 'application/json'
  };
  if (idemKey) headers['Idempotence-Key'] = idemKey;
  const r = await fetch('https://api.yookassa.ru/v3' + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`ЮKassa ${r.status}: ${j.description || j.code || 'ошибка'}`);
  return j;
}

async function createPayment(order) {
  const money = n => ({ value: n.toFixed(2), currency: 'RUB' });
  const customer = order.customer.email ? { email: order.customer.email } : { phone: order.customer.phone };
  return yk('POST', '/payments', {
    amount: money(order.total),
    capture: true,
    confirmation: { type: 'redirect', return_url: `${PUBLIC_URL}/#oplata` },
    description: `Заказ ${order.id}`.slice(0, 128),
    metadata: { orderId: order.id },
    receipt: {
      customer,
      items: order.lines.map(l => ({
        description: `${l.name} (${l.breed})`.slice(0, 128),
        quantity: l.kg.toFixed(3),
        amount: money(l.price),
        vat_code: VAT_CODE,
        payment_subject: 'commodity',
        payment_mode: 'full_payment'
      }))
    }
  }, order.id);
}

const STATUS = { succeeded: 'paid', canceled: 'canceled', pending: 'pending', waiting_for_capture: 'pending' };

async function syncStatus(order) {
  if (!order.paymentId || order.status === 'paid' || order.status === 'canceled') return order;
  const pay = await yk('GET', '/payments/' + order.paymentId);
  const status = STATUS[pay.status] || 'pending';
  if (status !== order.status) {
    order.status = status;
    if (status === 'paid') order.paidAt = new Date().toISOString();
    saveOrder(order);
    if (status === 'paid') notify(order);
  }
  return order;
}

// ---------- уведомление в Telegram ----------
function notify(order) {
  if (!TG_TOKEN || !TG_CHAT) return;
  const lines = order.lines.map(l => `• ${l.name}, ${l.breed} — ${l.kg} кг × ${l.price} ₽ = ${l.sum} ₽`).join('\n');
  const d = order.delivery;
  const text = [
    `✅ Оплачен заказ ${order.id} на ${order.total.toLocaleString('ru-RU')} ₽`,
    lines,
    `Покупатель: ${order.customer.name}, +${order.customer.phone}${order.customer.email ? ', ' + order.customer.email : ''}`,
    `Доставка: ${DELIVERY[d.method]}${d.method !== 'pickup' ? `, ${d.city}, ${d.address}` : ''}`,
    order.comment ? `Комментарий: ${order.comment}` : ''
  ].filter(Boolean).join('\n');
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text })
  }).catch(e => console.error('Telegram:', e.message));
}

// ---------- HTTP ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};
const BLOCKED = /^\/(server|data|node_modules|\.git|\.env)(\/|$)|^\/(package(-lock)?\.json|README\.md)$/i;
const HEAD = '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n';

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 100_000) { reject(new Error('Слишком большой запрос')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('Неверный формат запроса')); } });
    req.on('error', reject);
  });
}

function serveStatic(req, res, urlPath) {
  if (urlPath === '/js/config.js') {
    return send(res, 200, "window.SHOP_CONFIG = { mode: 'live', api: '/api/orders' };\n", MIME['.js']);
  }
  if (urlPath === '/') urlPath = '/index.html';
  if (BLOCKED.test(urlPath)) return send(res, 404, 'Not found', MIME['.txt']);
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT + path.sep)) return send(res, 404, 'Not found', MIME['.txt']);
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found', MIME['.txt']);
    const ext = path.extname(file).toLowerCase();
    // HTML-файлы проекта написаны без <!doctype>/<head> — добавляем их здесь
    if (ext === '.html' && !/^\s*<!doctype/i.test(buf.toString('utf8', 0, 30))) buf = Buffer.concat([Buffer.from(HEAD), buf]);
    send(res, 200, buf, MIME[ext] || 'application/octet-stream');
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  try {
    // Создать заказ и платёж
    if (req.method === 'POST' && p === '/api/orders') {
      if (!SHOP_ID || !SECRET) return send(res, 503, { error: 'Оплата временно недоступна' });
      let order;
      try { order = buildOrder(await readBody(req)); } catch (e) { return send(res, 400, { error: e.message }); }
      saveOrder(order);
      const pay = await createPayment(order);
      order.paymentId = pay.id; order.status = 'pending';
      saveOrder(order);
      return send(res, 200, { orderId: order.id, confirmation_url: pay.confirmation.confirmation_url });
    }
    // Статус заказа (после возврата с оплаты)
    const m = p.match(/^\/api\/orders\/([\w-]{1,40})$/);
    if (req.method === 'GET' && m) {
      const order = readOrders()[m[1]];
      if (!order) return send(res, 404, { error: 'Заказ не найден' });
      await syncStatus(order);
      return send(res, 200, { status: order.status });
    }
    // Уведомления ЮKassa. Статус перепроверяем запросом в ЮKassa, телу не доверяем.
    if (req.method === 'POST' && p === '/api/yookassa/webhook') {
      const body = await readBody(req);
      const orderId = body && body.object && body.object.metadata && body.object.metadata.orderId;
      const order = orderId && readOrders()[orderId];
      if (order && order.paymentId === body.object.id) await syncStatus(order);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, p);
    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Не удалось создать платёж' });
  }
});

server.listen(PORT, () => console.log(`Магазин запущен: ${PUBLIC_URL}  (порт ${PORT})`));

// ---------- .env без внешних пакетов ----------
function loadEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
