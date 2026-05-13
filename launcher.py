#!/usr/bin/env python3
"""
Универсальный лаунчер мессенджера
Работает на Windows, Linux, macOS
"""

import asyncio
import webbrowser
import time
import sys
import os
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import subprocess

# Определяем директорию проекта
PROJECT_DIR = Path(__file__).parent
os.chdir(PROJECT_DIR)

print("=" * 60)
print("🚀 Запуск локального мессенджера")
print("=" * 60)
print()

# Проверяем зависимости
try:
    import websockets
    print("✅ Модуль websockets установлен")
except ImportError:
    print("❌ Модуль websockets не установлен")
    print()
    print("Установите зависимости:")
    print("  pip install websockets")
    print("или")
    print("  python -m pip install websockets")
    sys.exit(1)

print()

# Импортируем сервер
sys.path.insert(0, str(PROJECT_DIR))
from server import main as server_main, init_database

# Инициализируем базу данных
print("📊 Инициализация базы данных...")
init_database()
print("✅ База данных готова")
print()

# HTTP сервер для фронтенда
class QuietHTTPRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Отключаем логи HTTP

def start_http_server(port=8000):
    """Запускает HTTP сервер"""
    server = HTTPServer(('0.0.0.0', port), QuietHTTPRequestHandler)
    print(f"🌐 HTTP сервер запущен на http://0.0.0.0:{port}")
    server.serve_forever()

# Запускаем HTTP сервер в отдельном потоке
http_thread = threading.Thread(target=start_http_server, args=(8000,), daemon=True)
http_thread.start()
time.sleep(1)

# Запускаем WebSocket сервер в отдельном потоке
def start_websocket_server():
    """Запускает WebSocket сервер"""
    asyncio.run(server_main())

ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
ws_thread.start()
time.sleep(2)

# Получаем локальный IP
import socket
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

local_ip = get_local_ip()

print()
print("=" * 60)
print("✅ Мессенджер запущен!")
print("=" * 60)
print()
print("📱 Локально (на этом компьютере):")
print()
print("   Alice:   http://localhost:8000/frontend.html?user=Alice")
print("   Bob:     http://localhost:8000/frontend.html?user=Bob")
print()
print("🌐 Для друзей в локальной сети:")
print()
print(f"   http://{local_ip}:8000/frontend.html?user=ИмяДруга")
print()
print(f"   Пример: http://{local_ip}:8000/frontend.html?user=Charlie")
print()
print("💾 База данных: messenger.db")
print("📋 Все сообщения сохраняются автоматически")
print()
print("🛑 Для остановки нажмите Ctrl+C")
print("=" * 60)
print()

# Открываем браузер
try:
    print("🌐 Открываю браузер...")
    webbrowser.open("http://localhost:8000/frontend.html?user=Alice")
    time.sleep(1)
    webbrowser.open("http://localhost:8000/frontend.html?user=Bob")
    print("✅ Браузер открыт")
except Exception as e:
    print(f"⚠️  Не удалось открыть браузер автоматически: {e}")
    print("   Откройте вручную: http://localhost:8000/frontend.html?user=Alice")

print()
print("Мессенджер работает...")
print()

# Держим программу запущенной
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print()
    print("👋 Остановка мессенджера...")
    print("✅ Завершено")
    sys.exit(0)
