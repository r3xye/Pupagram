# 💬 Local Messenger

A feature-rich local messenger with web interface, WebSocket communication, and SQLite database for persistent message history.

## ✨ Features

- ✅ **Real-time messaging** via WebSocket
- ✅ **Persistent message history** (SQLite database + localStorage)
- ✅ **Beautiful web interface** with modern design
- ✅ **Dark/Light theme** - Switch between themes
- ✅ **"+ New Chat" button** - See all online users
- ✅ **Delete chats** - Remove individual conversations
- ✅ **Clear all chats** - Delete all conversations at once
- ✅ **Online/offline status** indicators
- ✅ **Typing indicators**
- ✅ **Contact search**
- ✅ **Cross-platform** - Works on Windows, Linux, macOS

## 🚀 Quick Start

### Installation

1. Install Python 3.8+ from https://python.org/downloads/

2. Install dependencies:
```bash
pip install websockets
```

Or on Linux with venv:
```bash
python3 -m venv venv
source venv/bin/activate
pip install websockets
```

### Launch

**Linux/macOS:**
```bash
cd /path/to/messenger
source venv/bin/activate
python3 launcher.py
```

**Windows:**
```cmd
cd path\to\messenger
python launcher.py
```

Or double-click `start.bat` on Windows.

## 💬 How to Use

1. **Launch** `launcher.py`
2. **Two browser tabs will open:**
   - Alice: http://localhost:8000/frontend.html?user=Alice
   - Bob: http://localhost:8000/frontend.html?user=Bob

3. **Start chatting:**
   - Click **"+ New Chat"** button (top right)
   - Select a user from the online users list
   - Type a message and press Enter

4. **Switch themes:**
   - Click the **Settings** icon (⚙️) in the sidebar
   - Toggle **"Dark Theme"** switch

5. **Delete chats:**
   - Hover over a chat in the sidebar
   - Click the **×** button to delete
   - Or use **"Clear All Chats"** in Settings

## 🎨 New Features

### Theme Switching
- **Dark theme** (default) - Easy on the eyes
- **Light theme** - Clean and bright
- Theme preference is saved automatically

### Chat Management
- **Delete individual chats** - Hover over chat and click ×
- **Clear all chats** - Settings → Clear All Chats
- **Local storage** - Chats persist in browser

### Settings Menu
- Access via ⚙️ icon in sidebar
- Toggle dark/light theme
- Clear all conversations
- More settings coming soon!

## 📁 Project Structure

```
messenger/
├── launcher.py          # Main launcher (cross-platform)
├── server.py            # WebSocket server with SQLite
├── client.py            # Client (web + CLI modes)
├── frontend.html        # Web interface with themes
├── frontend.js          # Frontend logic with new features
├── messenger.db         # SQLite database (auto-created)
├── start.bat            # Windows launcher
├── start_linux.sh       # Linux launcher
└── venv/                # Python virtual environment
```

## 🎯 Adding More Users

Open a new browser tab with a different username:
```
http://localhost:8000/frontend.html?user=Charlie
```

Now Charlie can chat with Alice and Bob!

## 💾 Data Storage

### Server-side (SQLite)
All messages are stored in `messenger.db` for persistence across sessions.

**View message history:**
```bash
sqlite3 messenger.db "SELECT sender, recipient, text, timestamp FROM messages ORDER BY id DESC LIMIT 20;"
```

**Clear server history:**
```bash
rm messenger.db
# Database will be recreated on next server start
```

### Client-side (localStorage)
- Contact list
- Chat history (cached)
- Theme preference
- Stored in browser's localStorage

**Clear browser data:**
- Settings → Clear All Chats
- Or clear browser data manually

## 🛑 Stopping

Press `Ctrl+C` in the launcher window, or:
```bash
pkill -f "python3 launcher.py"
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Linux/macOS
lsof -i :8765
kill -9 <PID>

# Windows
netstat -ano | findstr :8765
taskkill /PID <PID> /F
```

**Module websockets not found:**
```bash
pip install websockets
```

**Button doesn't work:**
- Press Ctrl+Shift+R to reload the page
- Open browser console (F12) and check for errors
- Make sure both tabs are open with different usernames

**Theme not switching:**
- Clear browser cache
- Check browser console for errors
- Try a different browser

## 📋 CLI Mode

For testing or automation:
```bash
source venv/bin/activate
python3 client.py Alice ws://localhost:8765 cli

# Commands:
/send Bob Hello!
/contacts
/online
/history Bob
/quit
```

## 🔧 Technical Details

- **Backend:** Python 3.8+, WebSockets, SQLite
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Protocol:** WebSocket (JSON messages)
- **Database:** SQLite (server-side) + localStorage (client-side)
- **Themes:** CSS custom properties (CSS variables)

## 🎨 Customization

### Adding Custom Themes

Edit `frontend.html` and add new theme variables:

```css
[data-theme="custom"] {
  --bg-primary: #your-color;
  --bg-secondary: #your-color;
  /* ... more variables */
}
```

### Changing Colors

Modify the `COLORS` array in `frontend.js`:

```javascript
const COLORS = ['#color1', '#color2', '#color3', ...];
```

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📧 Support

If you encounter any issues, please check the troubleshooting section or open an issue on GitHub.

---

**Enjoy your local messenger!** 🎉
