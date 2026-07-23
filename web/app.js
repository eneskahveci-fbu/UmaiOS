// UmaiOS — AI Shell çekirdeği (derleme gerektirmez, saf ES module)
// Sağlayıcı-bağımsız asistan mimarisi. Varsayılan: yer tutucu (echo).
// Gerçek LLM için AssistantProvider'ı bir backend proxy'ye bağlayın.

// ---------- Assistant Core (sağlayıcı soyutlaması) ----------

/** @typedef {{role:'user'|'assistant'|'system', content:string}} Message */

/** Tüm sağlayıcıların uyması gereken arayüz. */
class AssistantProvider {
  /** @param {Message[]} _history @returns {Promise<string>} */
  async reply(_history) { throw new Error('not implemented'); }
}

/** İnternet/anahtar olmadan çalışan yer tutucu. */
class EchoProvider extends AssistantProvider {
  async reply(history) {
    const last = history[history.length - 1]?.content ?? '';
    await new Promise((r) => setTimeout(r, 250));
    return (
      `Şu an yer tutucu moddayım (gerçek model bağlı değil).\n` +
      `Mesajını aldım: "${last}"\n\n` +
      `Gerçek yanıtlar için bir backend proxy bağlayın (bkz. docs/ROADMAP.md, Faz 1).`
    );
  }
}

/**
 * Anthropic Claude API'ye BİR BACKEND PROXY üzerinden konuşan sağlayıcı.
 * Anahtar asla istemcide tutulmaz; proxy /api/chat endpoint'ini sağlar.
 */
class ClaudeProxyProvider extends AssistantProvider {
  constructor(endpoint) { super(); this.endpoint = endpoint; }
  async reply(history) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-8', messages: history }),
    });
    if (!res.ok) throw new Error(`Proxy hatası: ${res.status}`);
    const data = await res.json();
    return data.reply ?? '(boş yanıt)';
  }
}

/** Ayarlara göre aktif sağlayıcıyı seçer. */
function makeProvider() {
  const endpoint = localStorage.getItem('umai.proxyEndpoint');
  return endpoint ? new ClaudeProxyProvider(endpoint) : new EchoProvider();
}

// ---------- App Registry (kabuğa takılan mini uygulamalar) ----------

const APPS = [
  { id: 'assistant', emoji: '💬', name: 'Asistan', action: () => focusInput() },
  { id: 'notes',     emoji: '📝', name: 'Notlar',  action: () => quickPrompt('Bana kısa bir not tutma şablonu ver.') },
  { id: 'weather',   emoji: '🌤️', name: 'Hava',    action: () => quickPrompt('Bugün ne giymeliyim? Hava durumuna göre öner.') },
  { id: 'timer',     emoji: '⏱️', name: 'Zaman',   action: () => quickPrompt('5 dakikalık bir odaklanma zamanlayıcısı kur.') },
  { id: 'translate', emoji: '🌐', name: 'Çeviri',  action: () => quickPrompt('Şunu İngilizceye çevir: ') },
  { id: 'calc',      emoji: '🔢', name: 'Hesap',   action: () => quickPrompt('Hesapla: ') },
  { id: 'settings',  emoji: '⚙️', name: 'Ayarlar', action: () => openSettings() },
  { id: 'info',      emoji: 'ℹ️', name: 'Hakkında', action: () => showAbout() },
];

// ---------- UI state ----------

/** @type {Message[]} */
const history = [];
let provider = makeProvider();

const $ = (sel) => document.querySelector(sel);
const messagesEl = $('#messages');
const inputEl = $('#input');
const statusEl = $('#statusbar');

function focusInput() { inputEl.focus(); }
function quickPrompt(text) { inputEl.value = text; inputEl.focus(); }

function addMessage(role, content) {
  const el = document.createElement('div');
  el.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
  if (role !== 'user') {
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = 'Umai';
    el.appendChild(who);
  }
  el.appendChild(document.createTextNode(content));
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

async function send(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  addMessage('user', trimmed);
  history.push({ role: 'user', content: trimmed });
  inputEl.value = '';

  const pending = addMessage('assistant', '…');
  try {
    const reply = await provider.reply(history);
    pending.lastChild.textContent = reply;
    history.push({ role: 'assistant', content: reply });
  } catch (err) {
    pending.lastChild.textContent = `Hata: ${err.message}`;
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function openSettings() {
  const current = localStorage.getItem('umai.proxyEndpoint') || '';
  const val = prompt(
    'AI backend proxy endpoint URL\'si (boş = yer tutucu mod):\n' +
    'Örn: https://api.ornek.com/api/chat',
    current
  );
  if (val === null) return;
  if (val.trim()) localStorage.setItem('umai.proxyEndpoint', val.trim());
  else localStorage.removeItem('umai.proxyEndpoint');
  provider = makeProvider();
  updateStatus();
}

function showAbout() {
  addMessage('assistant',
    'UmaiOS AI Shell — iPhone, Android ve desktop üstünde çalışan tek kod tabanlı ' +
    'yapay zekâ kabuğu. Bu bir prototiptir; mimari için docs/ARCHITECTURE.md.');
}

function updateStatus() {
  const proxied = !!localStorage.getItem('umai.proxyEndpoint');
  statusEl.textContent = proxied
    ? 'Bağlı: backend proxy · Claude API'
    : 'Yer tutucu asistan · Ayarlar\'dan sağlayıcı bağla';
}

function renderApps() {
  const grid = $('#apps');
  for (const app of APPS) {
    const tile = document.createElement('button');
    tile.className = 'app-tile';
    tile.innerHTML = `<span class="emoji">${app.emoji}</span><span class="name">${app.name}</span>`;
    tile.addEventListener('click', app.action);
    grid.appendChild(tile);
  }
}

function initClock() {
  const el = $('#clock');
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 1000 * 15);
}

function initTheme() {
  const saved = localStorage.getItem('umai.theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('umai.theme', cur);
  });
}

// ---------- bootstrap ----------

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  send(inputEl.value);
});

renderApps();
initClock();
initTheme();
updateStatus();
addMessage('assistant', 'Merhaba! Ben Umai. Aşağıdan yazabilir ya da yukarıdaki uygulamalara dokunabilirsin.');

// PWA: service worker kaydı (çevrimdışı + kurulabilir)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sessizce geç */ });
  });
}
