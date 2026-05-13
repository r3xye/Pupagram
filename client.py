#!/usr/bin/env python3
"""
Клиентская часть локального мессенджера
Запускает веб-сервер для фронтенда и WebSocket клиент для связи с сервером
"""

import asyncio
import json
import logging
import webbrowser
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import websockets
from websockets.client import WebSocketClientProtocol

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MessengerClient:
    """Клиент мессенджера"""
    
    def __init__(self, server_url: str, username: str):
        self.server_url = server_url
        self.username = username
        self.websocket: WebSocketClientProtocol = None
        self.connected = False
        self.message_callbacks = []
    
    async def connect(self):
        """Подключается к серверу"""
        try:
            self.websocket = await websockets.connect(self.server_url)
            self.connected = True
            logger.info(f"Подключено к серверу {self.server_url}")
            
            # Регистрируемся на сервере
            await self.register()
            
            # Запускаем прослушивание сообщений
            asyncio.create_task(self.listen())
            
        except Exception as e:
            logger.error(f"Ошибка подключения: {e}")
            self.connected = False
    
    async def register(self):
        """Регистрирует пользователя на сервере"""
        message = {
            'type': 'register',
            'username': self.username
        }
        await self.websocket.send(json.dumps(message))
        logger.info(f"Регистрация пользователя {self.username}")
    
    async def listen(self):
        """Прослушивает входящие сообщения"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                logger.info(f"Получено: {data.get('type')}")
                
                # Вызываем все зарегистрированные callback'и
                for callback in self.message_callbacks:
                    await callback(data)
        
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Соединение с сервером закрыто")
            self.connected = False
        except Exception as e:
            logger.error(f"Ошибка при прослушивании: {e}")
            self.connected = False
    
    async def send_message(self, recipient: str, text: str):
        """Отправляет сообщение"""
        if not self.connected:
            logger.error("Не подключено к серверу")
            return False
        
        message = {
            'type': 'send_message',
            'to': recipient,
            'text': text
        }
        
        try:
            await self.websocket.send(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения: {e}")
            return False
    
    async def get_contacts(self):
        """Запрашивает список контактов"""
        if not self.connected:
            return []
        
        message = {'type': 'get_contacts'}
        await self.websocket.send(json.dumps(message))
    
    async def get_history(self, contact: str):
        """Запрашивает историю сообщений"""
        if not self.connected:
            return []
        
        message = {
            'type': 'get_history',
            'contact': contact
        }
        await self.websocket.send(json.dumps(message))
    
    async def get_online_users(self):
        """Запрашивает список онлайн пользователей"""
        if not self.connected:
            return []
        
        message = {'type': 'get_online_users'}
        await self.websocket.send(json.dumps(message))
    
    async def send_typing(self, recipient: str):
        """Отправляет уведомление о наборе текста"""
        if not self.connected:
            return
        
        message = {
            'type': 'typing',
            'to': recipient
        }
        await self.websocket.send(json.dumps(message))
    
    def add_message_callback(self, callback):
        """Добавляет callback для обработки входящих сообщений"""
        self.message_callbacks.append(callback)
    
    async def disconnect(self):
        """Отключается от сервера"""
        if self.websocket:
            await self.websocket.close()
            self.connected = False
            logger.info("Отключено от сервера")


class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Кастомный HTTP обработчик для раздачи статических файлов"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def log_message(self, format, *args):
        """Переопределяем для более чистого вывода"""
        logger.debug(f"HTTP: {format % args}")
    
    def end_headers(self):
        """Добавляем CORS заголовки"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()


def start_http_server(port: int = 8000):
    """Запускает HTTP сервер для фронтенда"""
    server = HTTPServer(('localhost', port), CustomHTTPRequestHandler)
    logger.info(f"HTTP сервер запущен на http://localhost:{port}")
    server.serve_forever()


async def interactive_mode(client: MessengerClient):
    """Интерактивный режим для тестирования"""
    
    async def print_message(data):
        """Выводит полученные сообщения"""
        msg_type = data.get('type')
        
        if msg_type == 'message':
            print(f"\n💬 Сообщение от {data['from']}: {data['text']}")
        elif msg_type == 'user_status':
            status = '🟢 онлайн' if data['status'] == 'online' else '⚫ оффлайн'
            print(f"\n👤 {data['username']} {status}")
        elif msg_type == 'typing':
            print(f"\n✍️  {data['from']} печатает...")
        elif msg_type == 'registered':
            print(f"\n✅ Вы зарегистрированы как {data['username']}")
        elif msg_type == 'contacts':
            print(f"\n📋 Контакты ({len(data['contacts'])}):")
            for contact in data['contacts']:
                status = '🟢' if contact['status'] == 'online' else '⚫'
                print(f"  {status} {contact['username']}")
        elif msg_type == 'online_users':
            print(f"\n👥 Онлайн пользователи: {', '.join(data['users'])}")
        elif msg_type == 'history':
            print(f"\n📜 История с {data['contact']}:")
            for msg in data['messages']:
                direction = '→' if msg['dir'] == 'out' else '←'
                print(f"  {direction} [{msg['time']}] {msg['text']}")
    
    client.add_message_callback(print_message)
    
    print("\n" + "="*60)
    print("🚀 Мессенджер запущен!")
    print("="*60)
    print("\nДоступные команды:")
    print("  /send <username> <message>  - отправить сообщение")
    print("  /contacts                   - показать контакты")
    print("  /online                     - показать онлайн пользователей")
    print("  /history <username>         - показать историю с пользователем")
    print("  /quit                       - выход")
    print("="*60 + "\n")
    
    while client.connected:
        try:
            # Используем asyncio для неблокирующего ввода
            command = await asyncio.get_event_loop().run_in_executor(
                None, input, f"{client.username}> "
            )
            
            command = command.strip()
            
            if not command:
                continue
            
            if command == '/quit':
                print("👋 До свидания!")
                break
            
            elif command == '/contacts':
                await client.get_contacts()
            
            elif command == '/online':
                await client.get_online_users()
            
            elif command.startswith('/history '):
                parts = command.split(maxsplit=1)
                if len(parts) == 2:
                    await client.get_history(parts[1])
                else:
                    print("❌ Использование: /history <username>")
            
            elif command.startswith('/send '):
                parts = command.split(maxsplit=2)
                if len(parts) == 3:
                    _, recipient, text = parts
                    success = await client.send_message(recipient, text)
                    if success:
                        print(f"✅ Сообщение отправлено {recipient}")
                else:
                    print("❌ Использование: /send <username> <message>")
            
            else:
                print("❌ Неизвестная команда. Используйте /quit для выхода")
        
        except EOFError:
            break
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            break
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    await client.disconnect()


async def main():
    """Главная функция"""
    import sys
    
    # Параметры по умолчанию
    server_url = 'ws://localhost:8765'
    username = 'user1'
    http_port = 8000
    mode = 'web'  # 'web' или 'cli'
    
    # Парсим аргументы командной строки
    if len(sys.argv) > 1:
        username = sys.argv[1]
    if len(sys.argv) > 2:
        server_url = sys.argv[2]
    if len(sys.argv) > 3:
        mode = sys.argv[3]
    
    # Создаем клиент
    client = MessengerClient(server_url, username)
    
    # Подключаемся к серверу
    await client.connect()
    
    if not client.connected:
        logger.error("Не удалось подключиться к серверу")
        return
    
    if mode == 'cli':
        # Консольный режим
        await interactive_mode(client)
    else:
        # Веб-режим
        # Запускаем HTTP сервер в отдельном потоке
        http_thread = threading.Thread(
            target=start_http_server,
            args=(http_port,),
            daemon=True
        )
        http_thread.start()
        
        # Открываем браузер
        url = f'http://localhost:{http_port}/frontend.html'
        logger.info(f"Открываем браузер: {url}")
        webbrowser.open(url)
        
        print("\n" + "="*60)
        print("🚀 Мессенджер запущен!")
        print("="*60)
        print(f"👤 Пользователь: {username}")
        print(f"🌐 Веб-интерфейс: {url}")
        print(f"🔌 WebSocket сервер: {server_url}")
        print("\nНажмите Ctrl+C для выхода")
        print("="*60 + "\n")
        
        try:
            # Держим программу запущенной
            await asyncio.Future()
        except KeyboardInterrupt:
            print("\n👋 Завершение работы...")
            await client.disconnect()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 До свидания!")
