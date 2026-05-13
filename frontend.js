// ─── WebSocket Connection ───────────────────────────────────────────────
let ws = null;
let currentUsername = null;
let reconnectInterval = null;
let onlineUsers = [];

function connectWebSocket() {
  ws = new WebSocket('ws://localhost:8765');
  
  ws.onopen = () => {
    console.log('✅ Connected to server');
    const urlParams = new URLSearchParams(window.location.search);
    currentUsername = urlParams.get('user') || prompt('Enter your name:') || 'User';

    // Очищаем себя из контактов после получения имени
    contacts = contacts.filter(c => c.name !== currentUsername);
    if (chatHistory[currentUsername]) {
      delete chatHistory[currentUsername];
    }
    saveContactsToLocal();
    saveChatHistoryToLocal();
    renderChatList();

    ws.send(JSON.stringify({
      type: 'register',
      username: currentUsername
    }));
    
    ws.send(JSON.stringify({ type: 'get_contacts' }));
    ws.send(JSON.stringify({ type: 'get_online_users' }));
    
    setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'get_online_users' }));
      }
    }, 5000);
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  };
  
  ws.onclose = () => {
    console.log('❌ Connection closed');
    setTimeout(connectWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// ─── DATA ───────────────────────────────────────────────────────────────
const COLORS = ['#c03d2f','#e8ab03','#299f61','#168acd','#8b5cf6','#e94560','#2196f3'];
const color = name => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = name => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const now = () => new Date().toLocaleTimeString('en', {hour:'2-digit',minute:'2-digit'});
const today = () => new Date().toLocaleDateString('en', {day:'numeric',month:'long'});

let contacts = [];
let chatHistory = {};
let activeContact = null;

// ─── Theme Management ────────────────────────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeSwitch();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeSwitch();
}

function updateThemeSwitch() {
  const themeSwitch = document.getElementById('themeSwitch');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (themeSwitch) {
    if (currentTheme === 'dark') {
      themeSwitch.classList.add('active');
    } else {
      themeSwitch.classList.remove('active');
    }
  }
}

// ─── Local Storage Management ────────────────────────────────────────────
function saveContactsToLocal() {
  localStorage.setItem('contacts', JSON.stringify(contacts));
}

function saveChatHistoryToLocal() {
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadFromLocal() {
  const savedContacts = localStorage.getItem('contacts');
  const savedHistory = localStorage.getItem('chatHistory');

  if (savedContacts) {
    contacts = JSON.parse(savedContacts);
    // Удаляем себя из контактов если есть
    contacts = contacts.filter(c => c.name !== currentUsername);
  }
  if (savedHistory) {
    chatHistory = JSON.parse(savedHistory);
    // Удаляем историю с самим собой если есть
    if (currentUsername && chatHistory[currentUsername]) {
      delete chatHistory[currentUsername];
    }
  }
}

function clearAllLocalData() {
  if (confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
    localStorage.removeItem('contacts');
    localStorage.removeItem('chatHistory');
    contacts = [];
    chatHistory = {};
    activeContact = null;
    renderChatList();
    document.getElementById('main').innerHTML = `
      <div class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>All chats cleared. Click "+ New Chat" to start messaging</p>
      </div>`;
    hideSettingsModal();
  }
}

function deleteChat(username) {
  if (confirm(`Delete chat with ${username}?`)) {
    contacts = contacts.filter(c => c.name !== username);
    delete chatHistory[username];
    saveContactsToLocal();
    saveChatHistoryToLocal();
    renderChatList();

    if (activeContact === username) {
      activeContact = null;
      document.getElementById('main').innerHTML = `
        <div class="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>Click "+ New Chat" to start messaging</p>
        </div>`;
    }
  }
}

function clearChatHistory(username) {
  if (confirm(`Clear all messages with ${username}? This cannot be undone.`)) {
    delete chatHistory[username];
    saveChatHistoryToLocal();

    const contact = contacts.find(c => c.name === username);
    if (contact) {
      contact.last = '';
      contact.time = '';
      saveContactsToLocal();
    }

    if (activeContact === username) {
      renderMessages();
    }
    renderChatList();
  }
}

// ─── Handle Server Messages ─────────────────────────────────────────────
function handleServerMessage(data) {
  console.log('Received:', data);
  
  switch(data.type) {
    case 'registered':
      console.log('Registered as:', data.username);
      break;
      
    case 'message':
      const sender = data.from;

      // Игнорируем сообщения от самого себя (не должно происходить, но на всякий случай)
      if (sender === currentUsername) {
        break;
      }

      if (!chatHistory[sender]) chatHistory[sender] = [];
      chatHistory[sender].push({
        dir: 'in',
        text: data.text,
        time: data.timestamp
      });

      let contact = contacts.find(c => c.name === sender);
      if (!contact) {
        contact = {
          name: sender,
          status: 'online',
          last: data.text,
          time: data.timestamp,
          unread: 0
        };
        contacts.push(contact);
      } else {
        contact.last = data.text;
        contact.time = data.timestamp;
        if (activeContact !== sender) {
          contact.unread = (contact.unread || 0) + 1;
        }
      }

      saveContactsToLocal();
      saveChatHistoryToLocal();
      renderChatList();

      if (activeContact === sender) {
        appendBubble('in', data.text, data.timestamp);
        scrollToBottom();
      }
      break;
      
    case 'message_sent':
      console.log('Message delivered');
      break;
      
    case 'user_status':
      const user = contacts.find(c => c.name === data.username);
      if (user) {
        user.status = data.status;
        renderChatList();
        
        if (activeContact === data.username) {
          updateChatHeader();
        }
      }
      
      if (data.status === 'online') {
        if (!onlineUsers.includes(data.username)) {
          onlineUsers.push(data.username);
        }
      } else {
        onlineUsers = onlineUsers.filter(u => u !== data.username);
      }
      break;
      
    case 'contacts':
      data.contacts.forEach(c => {
        let contact = contacts.find(ct => ct.name === c.username);
        if (!contact) {
          contacts.push({
            name: c.username,
            status: c.status,
            last: c.last_message,
            time: c.last_time,
            unread: c.unread
          });
        }
      });
      saveContactsToLocal();
      renderChatList();
      break;
      
    case 'history':
      chatHistory[data.contact] = data.messages;
      saveChatHistoryToLocal();
      if (activeContact === data.contact) {
        renderMessages();
      }
      break;
      
    case 'online_users':
      onlineUsers = data.users.filter(u => u !== currentUsername);
      data.users.forEach(username => {
        let contact = contacts.find(c => c.name === username);
        if (contact) {
          contact.status = 'online';
        }
      });
      renderChatList();
      break;
      
    case 'typing':
      if (activeContact === data.from) {
        showTypingIndicator();
      }
      break;
  }
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────
function renderChatList(filter='') {
  const list = document.getElementById('chatList');
  list.innerHTML = '';

  // Фильтруем текущего пользователя и применяем поисковый фильтр
  const filtered = contacts
    .filter(c => c.name !== currentUsername) // Исключаем себя
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-list">No contacts<br><small>Click "+ New Chat"</small></div>';
    return;
  }

  filtered.forEach(c => {
    const el = document.createElement('div');
    el.className = 'chat-item' + (c.name === activeContact ? ' active' : '');
    el.innerHTML = `
      <div class="avatar" style="background:${color(c.name)}">${initials(c.name)}</div>
      <div class="chat-info">
        <div class="chat-name">${c.name}</div>
        <div class="chat-preview">${c.last || ''}</div>
      </div>
      <div class="chat-meta">
        <span class="chat-time">${c.time || ''}</span>
        ${c.unread ? `<span class="badge">${c.unread}</span>` : ''}
      </div>
      <button class="delete-chat-btn" onclick="deleteChat('${c.name}'); event.stopPropagation();" title="Delete chat">×</button>
    `;
    el.addEventListener('click', () => openChat(c.name));
    list.appendChild(el);
  });
}

document.getElementById('searchInput').addEventListener('input', e => {
  renderChatList(e.target.value);
});

// ─── MODALS ──────────────────────────────────────────────────────────────
document.getElementById('newChatBtn').addEventListener('click', showNewChatModal);
document.getElementById('closeNewChatModal').addEventListener('click', hideNewChatModal);
document.getElementById('settingsBtn').addEventListener('click', showSettingsModal);
document.getElementById('closeSettingsModal').addEventListener('click', hideSettingsModal);

document.getElementById('newChatModal').addEventListener('click', (e) => {
  if (e.target.id === 'newChatModal') hideNewChatModal();
});

document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target.id === 'settingsModal') hideSettingsModal();
});

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('clearAllChats').addEventListener('click', clearAllLocalData);

function showNewChatModal() {
  const modal = document.getElementById('newChatModal');
  const userList = document.getElementById('userList');

  userList.innerHTML = '';

  // Фильтруем текущего пользователя из списка
  const availableUsers = onlineUsers.filter(u => u !== currentUsername);

  if (availableUsers.length === 0) {
    userList.innerHTML = '<div class="empty-list">No other users online</div>';
  } else {
    availableUsers.forEach(username => {
      const el = document.createElement('div');
      el.className = 'user-item';
      el.innerHTML = `
        <div class="avatar" style="background:${color(username)}">${initials(username)}</div>
        <div class="user-info">
          <div class="user-name">${username}</div>
          <div class="user-status">online</div>
        </div>`;
      el.addEventListener('click', () => {
        hideNewChatModal();
        openChat(username);
      });
      userList.appendChild(el);
    });
  }

  modal.classList.add('show');
}

function hideNewChatModal() {
  document.getElementById('newChatModal').classList.remove('show');
}

function showSettingsModal() {
  updateThemeSwitch();
  document.getElementById('settingsModal').classList.add('show');
}

function hideSettingsModal() {
  document.getElementById('settingsModal').classList.remove('show');
}

// ─── OPEN CHAT ────────────────────────────────────────────────────────────
function openChat(username) {
  // Предотвращаем открытие чата с самим собой
  if (username === currentUsername) {
    alert('You cannot chat with yourself!');
    return;
  }

  activeContact = username;
  const contact = contacts.find(c => c.name === username);
  
  if (!contact) {
    contacts.push({
      name: username,
      status: onlineUsers.includes(username) ? 'online' : 'offline',
      last: '',
      time: '',
      unread: 0
    });
    saveContactsToLocal();
  } else {
    contact.unread = 0;
    saveContactsToLocal();
  }
  
  renderChatList(document.getElementById('searchInput').value);

  const main = document.getElementById('main');
  const status = contact?.status || (onlineUsers.includes(username) ? 'online' : 'offline');
  
  main.innerHTML = `
    <div class="chat-window">
      <div class="chat-header" id="chatHeader">
        <div class="avatar" style="background:${color(username)}">${initials(username)}</div>
        <div class="chat-header-info">
          <div class="name">${username}</div>
          <div class="status ${status==='online' ? 'online' : ''}" id="statusText">${status}</div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" onclick="clearChatHistory('${username}')" title="Clear chat history">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
              <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
          <button class="icon-btn" onclick="deleteChat('${username}')" title="Delete chat">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button class="icon-btn" title="Search">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="messages" id="messages">
        <div class="date-divider"><span>${today()}</span></div>
      </div>

      <div class="input-area">
        <button class="attach-btn" title="Attach file">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <div class="msg-input-wrap">
          <textarea id="msgInput" rows="1" placeholder="Message..."></textarea>
          <button class="emoji-btn">😊</button>
        </div>
        <button class="send-btn" id="sendBtn" title="Send">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
      </div>
    </div>`;

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'get_history',
      contact: username
    }));
  }
  
  renderMessages();
  setupInput();
}

function updateChatHeader() {
  const contact = contacts.find(c => c.name === activeContact);
  if (contact) {
    const statusEl = document.getElementById('statusText');
    if (statusEl) {
      statusEl.textContent = contact.status;
      statusEl.className = 'status' + (contact.status === 'online' ? ' online' : '');
    }
  }
}

function renderMessages() {
  const msgs = chatHistory[activeContact] || [];
  const area = document.getElementById('messages');
  if (!area) return;
  
  const divider = area.querySelector('.date-divider');
  area.innerHTML = '';
  if (divider) area.appendChild(divider);
  
  msgs.forEach(m => appendBubble(m.dir, m.text, m.time));
  scrollToBottom();
}

// ─── MESSAGES ────────────────────────────────────────────────────────────
function appendBubble(dir, text, time) {
  const area = document.getElementById('messages');
  if (!area) return;
  
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

let typingTimeout = null;
function showTypingIndicator() {
  const area = document.getElementById('messages');
  if (!area) return;
  
  const old = document.getElementById('typing');
  if (old) old.remove();
  
  const typingRow = document.createElement('div');
  typingRow.className = 'msg-row in';
  typingRow.id = 'typing';
  typingRow.innerHTML = `<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  area.appendChild(typingRow);
  scrollToBottom();
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
  }, 3000);
}

// ─── INPUT LOGIC ──────────────────────────────────────────────────────────
function setupInput() {
  const input  = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    
    if (ws && ws.readyState === WebSocket.OPEN && input.value.trim()) {
      ws.send(JSON.stringify({
        type: 'typing',
        to: activeContact
      }));
    }
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
  if (!text || !activeContact) return;

  const t = now();

  if (!chatHistory[activeContact]) chatHistory[activeContact] = [];
  chatHistory[activeContact].push({ dir:'out', text, time: t });

  appendBubble('out', text, t);
  scrollToBottom();

  const contact = contacts.find(c => c.name === activeContact);
  if (contact) {
    contact.last = text;
    contact.time = t;
  }
  
  saveContactsToLocal();
  saveChatHistoryToLocal();
  renderChatList(document.getElementById('searchInput').value);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'send_message',
      to: activeContact,
      text: text
    }));
  }

  input.value = '';
  input.style.height = 'auto';
  input.focus();
}

// ─── INIT ─────────────────────────────────────────────────────────────────
initTheme();
loadFromLocal();
connectWebSocket();
renderChatList();
