<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Messenger</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1c2733;
      display: flex;
      height: 100vh;
      overflow: hidden;
      color: #fff;
    }

    /* ───── SIDEBAR ───── */
    .sidebar {
      width: 320px;
      background: #17212b;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #0d1117;
      flex-shrink: 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #17212b;
      border-bottom: 1px solid #0d1117;
    }

    .sidebar-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    .menu-btn {
      width: 36px; height: 36px;
      border: none; background: none;
      cursor: pointer;
      display: flex; flex-direction: column;
      justify-content: center; gap: 5px;
      padding: 4px;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .menu-btn:hover { background: #2b3e50; }
    .menu-btn span {
      display: block; width: 20px; height: 2px;
      background: #8898a5; border-radius: 2px;
    }

    .search-bar {
      padding: 8px 12px;
      background: #17212b;
    }
    .search-bar input {
      width: 100%;
      background: #242f3d;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    .search-bar input::placeholder { color: #5d7485; }

    .chat-list {
      flex: 1;
      overflow-y: auto;
    }
    .chat-list::-webkit-scrollbar { width: 4px; }
    .chat-list::-webkit-scrollbar-thumb { background: #2b3e50; border-radius: 2px; }

    .chat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .chat-item:hover { background: #1f2d3a; }
    .chat-item.active { background: #2b5278; }

    .avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700;
      flex-shrink: 0;
      color: #fff;
    }

    .chat-info { flex: 1; min-width: 0; }
    .chat-name {
      font-size: 15px; font-weight: 500;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .chat-preview {
      font-size: 13px; color: #7d9db5;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-top: 2px;
    }
    .chat-meta {
      display: flex; flex-direction: column;
      align-items: flex-end; gap: 4px; flex-shrink: 0;
    }
    .chat-time { font-size: 12px; color: #5d7485; }
    .badge {
      background: #5288c1;
      color: #fff; font-size: 11px; font-weight: 600;
      border-radius: 10px; padding: 1px 6px;
      min-width: 18px; text-align: center;
    }

    /* ───── MAIN AREA ───── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1c2733;
      min-width: 0;
    }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #5d7485;
      gap: 12px;
    }
    .empty-state svg { opacity: 0.3; }
    .empty-state p { font-size: 15px; }

    /* Chat window */
    .chat-window {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: #17212b;
      border-bottom: 1px solid #0d1117;
    }
    .chat-header .avatar { width: 40px; height: 40px; font-size: 15px; }
    .chat-header-info { flex: 1; }
    .chat-header-info .name { font-size: 15px; font-weight: 600; }
    .chat-header-info .status { font-size: 13px; color: #5d7485; }
    .chat-header-info .status.online { color: #5288c1; }

    .header-actions { display: flex; gap: 4px; }
    .icon-btn {
      width: 36px; height: 36px;
      border: none; background: none;
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
      color: #8898a5;
    }
    .icon-btn:hover { background: #2b3e50; }

    /* Messages */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: #2b3e50; border-radius: 2px; }

    .date-divider {
      text-align: center;
      color: #5d7485;
      font-size: 12px;
      margin: 10px 0;
      position: relative;
    }
    .date-divider span {
      background: #1c2733;
      padding: 0 10px;
    }
    .date-divider::before {
      content: '';
      position: absolute;
      top: 50%; left: 0; right: 0;
      height: 1px;
      background: #2b3e50;
      z-index: -1;
    }

    .msg-row {
      display: flex;
      margin: 1px 0;
    }
    .msg-row.out { justify-content: flex-end; }
    .msg-row.in  { justify-content: flex-start; }

    .bubble {
      max-width: 65%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.45;
      position: relative;
      word-break: break-word;
    }
    .msg-row.out .bubble {
      background: #2b5278;
      border-bottom-right-radius: 4px;
      color: #fff;
    }
    .msg-row.in .bubble {
      background: #182533;
      border-bottom-left-radius: 4px;
      color: #fff;
    }

    .msg-row.out + .msg-row.out .bubble { border-top-right-radius: 4px; }
    .msg-row.in  + .msg-row.in  .bubble { border-top-left-radius: 4px; }

    .bubble .meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
    }
    .bubble .time { font-size: 11px; color: #7d9db5; }
    .bubble .check {
      font-size: 13px;
      color: #5288c1;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #182533;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    .dot {
      width: 6px; height: 6px;
      background: #5d7485;
      border-radius: 50%;
      animation: bounce 1.2s infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Input */
    .input-area {
      padding: 10px 16px;
      background: #17212b;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      border-top: 1px solid #0d1117;
    }

    .attach-btn {
      width: 40px; height: 40px;
      border: none; background: none;
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #5d7485;
      transition: background 0.2s, color 0.2s;
      flex-shrink: 0;
    }
    .attach-btn:hover { background: #2b3e50; color: #8898a5; }

    .msg-input-wrap {
      flex: 1;
      background: #242f3d;
      border-radius: 20px;
      display: flex;
      align-items: flex-end;
      padding: 6px 12px;
      gap: 8px;
    }

    #msgInput {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #fff;
      font-size: 15px;
      resize: none;
      max-height: 120px;
      line-height: 1.4;
      font-family: inherit;
    }
    #msgInput::placeholder { color: #5d7485; }

    .emoji-btn {
      background: none; border: none;
      font-size: 20px; cursor: pointer;
      padding: 2px; opacity: 0.6;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .emoji-btn:hover { opacity: 1; }

    .send-btn {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: none;
      background: #5288c1;
      color: #fff;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.1s;
      flex-shrink: 0;
    }
    .send-btn:hover { background: #4a7ab0; }
    .send-btn:active { transform: scale(0.93); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2b3e50; border-radius: 2px; }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-header">
    <button class="menu-btn" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <h2>Telegram</h2>
  </div>

  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="Поиск" autocomplete="off"/>
  </div>

  <div class="chat-list" id="chatList"></div>
</aside>

<!-- MAIN -->
<main class="main" id="main">
  <div class="empty-state" id="emptyState">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#5d7485" stroke-width="1.2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <p>Выберите чат, чтобы начать общение</p>
  </div>
</main>

<script>
// ─── DATA ───────────────────────────────────────────────────────────────
const COLORS = ['#c03d2f','#e8ab03','#299f61','#168acd','#8b5cf6','#e94560','#2196f3'];
const color = name => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = name => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const now = () => new Date().toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'});
const today = () => new Date().toLocaleDateString('ru', {day:'numeric',month:'long'});

const BOT_REPLIES = [
  'Понял, принял 👍',
  'Интересно, расскажи подробнее!',
  'Окей!',
  'Хм, надо подумать...',
  'Согласен полностью 🔥',
  'Ага, щас отвечу',
  'Да, конечно!',
  'Что именно имеешь в виду?',
  '😄 Это точно!',
  'Ладно, разберёмся!'
];

const contacts = [
  { id:1, name:'Алексей Смирнов',   status:'online',  last:'Привет! Как дела?',    time:'10:42', unread:3 },
  { id:2, name:'Мария Иванова',     status:'онлайн',  last:'Скинь файл пожалуйста', time:'10:31', unread:0 },
  { id:3, name:'Команда проекта',   status:'12 участников', last:'Дедлайн завтра!', time:'вчера', unread:7 },
  { id:4, name:'Дмитрий Козлов',    status:'был вчера', last:'Ок, договорились',   time:'вчера', unread:0 },
  { id:5, name:'Анна Белова',       status:'онлайн',  last:'Спасибо!',             time:'пн',    unread:0 },
];

// seed messages per chat
const chatHistory = {
  1: [
    { dir:'in',  text:'Привет! Как дела?',           time:'10:40' },
    { dir:'out', text:'Отлично, спасибо! Работаю над новым проектом 🔥', time:'10:41' },
    { dir:'in',  text:'Звучит интересно, расскажи!',  time:'10:42' },
  ],
  2: [
    { dir:'in',  text:'Привет, можешь скинуть файл?', time:'10:28' },
    { dir:'out', text:'Сейчас найду',                 time:'10:29' },
    { dir:'in',  text:'Скинь файл пожалуйста',        time:'10:31' },
  ],
  3: [
    { dir:'in',  text:'Дедлайн завтра! Все готовы?',  time:'вчера' },
    { dir:'out', text:'Да, почти закончил',            time:'вчера' },
  ],
  4: [
    { dir:'out', text:'Встречаемся в 18:00?',          time:'вчера' },
    { dir:'in',  text:'Ок, договорились',              time:'вчера' },
  ],
  5: [
    { dir:'out', text:'Всё прошло хорошо!',            time:'пн' },
    { dir:'in',  text:'Спасибо!',                      time:'пн' },
  ],
};

let activeId = null;

// ─── SIDEBAR ─────────────────────────────────────────────────────────────
function renderChatList(filter='') {
  const list = document.getElementById('chatList');
  list.innerHTML = '';
  contacts
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(c => {
      const el = document.createElement('div');
      el.className = 'chat-item' + (c.id === activeId ? ' active' : '');
      el.dataset.id = c.id;
      el.innerHTML = `
        <div class="avatar" style="background:${color(c.name)}">${initials(c.name)}</div>
        <div class="chat-info">
          <div class="chat-name">${c.name}</div>
          <div class="chat-preview">${c.last}</div>
        </div>
        <div class="chat-meta">
          <span class="chat-time">${c.time}</span>
          ${c.unread ? `<span class="badge">${c.unread}</span>` : ''}
        </div>`;
      el.addEventListener('click', () => openChat(c.id));
      list.appendChild(el);
    });
}

document.getElementById('searchInput').addEventListener('input', e => {
  renderChatList(e.target.value);
});

// ─── OPEN CHAT ────────────────────────────────────────────────────────────
function openChat(id) {
  activeId = id;
  const contact = contacts.find(c => c.id === id);
  contact.unread = 0;
  renderChatList(document.getElementById('searchInput').value);

  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="chat-window">
      <div class="chat-header">
        <div class="avatar" style="background:${color(contact.name)}">${initials(contact.name)}</div>
        <div class="chat-header-info">
          <div class="name">${contact.name}</div>
          <div class="status ${contact.status==='online'||contact.status==='онлайн' ? 'online' : ''}">${contact.status}</div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" title="Поиск">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button class="icon-btn" title="Позвонить">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button class="icon-btn" title="Меню">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="messages" id="messages">
        <div class="date-divider"><span>${today()}</span></div>
      </div>

      <div class="input-area">
        <button class="attach-btn" title="Прикрепить файл">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <div class="msg-input-wrap">
          <textarea id="msgInput" rows="1" placeholder="Сообщение..."></textarea>
          <button class="emoji-btn">😊</button>
        </div>
        <button class="send-btn" id="sendBtn" title="Отправить">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
      </div>
    </div>`;

  // render history
  const msgs = chatHistory[id] || [];
  msgs.forEach(m => appendBubble(m.dir, m.text, m.time));
  scrollToBottom();
  setupInput();
}

// ─── MESSAGES ────────────────────────────────────────────────────────────
function appendBubble(dir, text, time) {
  const area = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = `msg-row ${dir}`;
  row.innerHTML = `
    <div class="bubble">
      ${escapeHtml(text)}
      <div class="meta">
        <span class="time">${time}</span>
        ${dir==='out' ? '<span class="check">✓✓</span>' : ''}
      </div>
    </div>`;
  area.appendChild(row);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function scrollToBottom() {
  const area = document.getElementById('messages');
  if (area) area.scrollTop = area.scrollHeight;
}

// ─── INPUT LOGIC ──────────────────────────────────────────────────────────
function setupInput() {
  const input  = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');

  // auto-grow textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);
  input.focus();
}

function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text) return;

  const t = now();

  // append to history
  if (!chatHistory[activeId]) chatHistory[activeId] = [];
  chatHistory[activeId].push({ dir:'out', text, time: t });

  appendBubble('out', text, t);
  scrollToBottom();

  // update sidebar preview
  const contact = contacts.find(c => c.id === activeId);
  contact.last = text;
  contact.time = t;
  renderChatList(document.getElementById('searchInput').value);

  input.value = '';
  input.style.height = 'auto';
  input.focus();

  // simulate reply
  simulateReply();
}

function simulateReply() {
  const area = document.getElementById('messages');

  // typing indicator
  const typingRow = document.createElement('div');
  typingRow.className = 'msg-row in';
  typingRow.id = 'typing';
  typingRow.innerHTML = `<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  area.appendChild(typingRow);
  scrollToBottom();

  const delay = 1200 + Math.random() * 1000;
  setTimeout(() => {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();

    const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
    const t = now();

    if (!chatHistory[activeId]) chatHistory[activeId] = [];
    chatHistory[activeId].push({ dir:'in', text: reply, time: t });

    appendBubble('in', reply, t);
    scrollToBottom();

    const contact = contacts.find(c => c.id === activeId);
    contact.last = reply;
    contact.time = t;
    renderChatList(document.getElementById('searchInput').value);
  }, delay);
}

// ─── INIT ─────────────────────────────────────────────────────────────────
renderChatList();
</script>
</body>
</html>

