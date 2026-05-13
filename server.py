#!/usr/bin/env python3
"""
Серверная часть локального мессенджера
Использует WebSocket для real-time коммуникации и SQLite для хранения истории
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime
from typing import Dict, Set
import websockets
from websockets.server import WebSocketServerProtocol
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Хранилище подключенных клиентов: {username: websocket}
clients: Dict[str, WebSocketServerProtocol] = {}

# Путь к базе данных
DB_PATH = Path(__file__).parent / 'messenger.db'


def init_database():
    """Инициализирует базу данных"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица сообщений
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            recipient TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender) REFERENCES users(username),
            FOREIGN KEY (recipient) REFERENCES users(username)
        )
    ''')
    
    # Индексы для быстрого поиска
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_messages_sender 
        ON messages(sender)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_messages_recipient 
        ON messages(recipient)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_messages_chat 
        ON messages(sender, recipient)
    ''')
    
    conn.commit()
    conn.close()
    logger.info(f"База данных инициализирована: {DB_PATH}")


def get_timestamp():
    """Возвращает текущее время в формате HH:MM"""
    return datetime.now().strftime('%H:%M')


def add_user(username: str):
    """Добавляет пользователя в базу данных"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT OR IGNORE INTO users (username) VALUES (?)', (username,))
        conn.commit()
    finally:
        conn.close()


def save_message(sender: str, recipient: str, text: str, timestamp: str):
    """Сохраняет сообщение в базу данных"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO messages (sender, recipient, text, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (sender, recipient, text, timestamp))
        conn.commit()
    finally:
        conn.close()


def get_chat_history(user1: str, user2: str, limit: int = 100):
    """Получает историю сообщений между двумя пользователями"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT sender, recipient, text, timestamp
            FROM messages
            WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
            ORDER BY id ASC
            LIMIT ?
        ''', (user1, user2, user2, user1, limit))
        
        messages = []
        for row in cursor.fetchall():
            sender, recipient, text, timestamp = row
            messages.append({
                'from': sender,
                'text': text,
                'timestamp': timestamp
            })
        
        return messages
    finally:
        conn.close()


def get_user_contacts(username: str):
    """Получает список контактов пользователя (с кем была переписка)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT DISTINCT 
                CASE 
                    WHEN sender = ? THEN recipient 
                    ELSE sender 
                END as contact
            FROM messages
            WHERE sender = ? OR recipient = ?
        ''', (username, username, username))
        
        contacts = [row[0] for row in cursor.fetchall()]
        return contacts
    finally:
        conn.close()


def get_last_message(user1: str, user2: str):
    """Получает последнее сообщение между двумя пользователями"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT text, timestamp
            FROM messages
            WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
            ORDER BY id DESC
            LIMIT 1
        ''', (user1, user2, user2, user1))
        
        row = cursor.fetchone()
        if row:
            return {'text': row[0], 'timestamp': row[1]}
        return None
    finally:
        conn.close()


async def register_client(websocket: WebSocketServerProtocol, username: str):
    """Регистрирует нового клиента"""
    clients[username] = websocket
    add_user(username)
    logger.info(f"Клиент {username} подключился. Всего клиентов: {len(clients)}")
    
    # Отправляем список онлайн пользователей
    await broadcast_user_status(username, 'online')


async def unregister_client(username: str):
    """Удаляет клиента из списка"""
    if username in clients:
        del clients[username]
        logger.info(f"Клиент {username} отключился. Осталось клиентов: {len(clients)}")
        await broadcast_user_status(username, 'offline')


async def broadcast_user_status(username: str, status: str):
    """Рассылает всем клиентам информацию о статусе пользователя"""
    message = {
        'type': 'user_status',
        'username': username,
        'status': status,
        'timestamp': get_timestamp()
    }
    
    # Отправляем всем подключенным клиентам
    disconnected = []
    for user, ws in clients.items():
        if user != username:  # Не отправляем самому себе
            try:
                await ws.send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(user)
    
    # Удаляем отключенных клиентов
    for user in disconnected:
        await unregister_client(user)


async def send_message(sender: str, recipient: str, text: str):
    """Отправляет сообщение от отправителя получателю"""
    timestamp = get_timestamp()
    
    # Сохраняем в базу данных
    save_message(sender, recipient, text, timestamp)
    
    message = {
        'type': 'message',
        'from': sender,
        'to': recipient,
        'text': text,
        'timestamp': timestamp
    }
    
    # Отправляем получателю если он онлайн
    if recipient in clients:
        try:
            await clients[recipient].send(json.dumps(message))
            logger.info(f"Сообщение от {sender} к {recipient}: {text[:30]}...")
        except websockets.exceptions.ConnectionClosed:
            await unregister_client(recipient)
            return {'status': 'error', 'message': 'Получатель отключен'}
    
    return {'status': 'delivered', 'timestamp': timestamp}


async def get_contacts(username: str):
    """Возвращает список контактов пользователя"""
    contact_usernames = get_user_contacts(username)
    contacts = []
    
    for contact in contact_usernames:
        last_msg = get_last_message(username, contact)
        
        contact_info = {
            'username': contact,
            'status': 'online' if contact in clients else 'offline',
            'last_message': last_msg['text'] if last_msg else '',
            'last_time': last_msg['timestamp'] if last_msg else '',
            'unread': 0  # Можно добавить подсчет непрочитанных
        }
        contacts.append(contact_info)
    
    return contacts


async def get_history(username: str, contact: str):
    """Возвращает историю сообщений между двумя пользователями"""
    messages = get_chat_history(username, contact)
    
    # Преобразуем в формат для клиента
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            'dir': 'out' if msg['from'] == username else 'in',
            'text': msg['text'],
            'time': msg['timestamp']
        })
    
    return formatted_messages


async def get_online_users():
    """Возвращает список всех онлайн пользователей"""
    return list(clients.keys())


async def handle_client(websocket: WebSocketServerProtocol):
    """Обрабатывает подключение клиента"""
    username = None
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get('type')
                
                if msg_type == 'register':
                    # Регистрация клиента
                    username = data.get('username')
                    if not username:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Имя пользователя обязательно'
                        }))
                        continue
                    
                    await register_client(websocket, username)
                    
                    # Отправляем подтверждение
                    await websocket.send(json.dumps({
                        'type': 'registered',
                        'username': username
                    }))
                
                elif msg_type == 'send_message':
                    # Отправка сообщения
                    if not username:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Сначала зарегистрируйтесь'
                        }))
                        continue
                    
                    recipient = data.get('to')
                    text = data.get('text')
                    
                    if not recipient or not text:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Получатель и текст обязательны'
                        }))
                        continue
                    
                    result = await send_message(username, recipient, text)
                    
                    # Подтверждаем отправителю
                    await websocket.send(json.dumps({
                        'type': 'message_sent',
                        **result
                    }))
                
                elif msg_type == 'get_contacts':
                    # Получение списка контактов
                    if not username:
                        continue
                    
                    contacts = await get_contacts(username)
                    await websocket.send(json.dumps({
                        'type': 'contacts',
                        'contacts': contacts
                    }))
                
                elif msg_type == 'get_history':
                    # Получение истории сообщений
                    if not username:
                        continue
                    
                    contact = data.get('contact')
                    if not contact:
                        continue
                    
                    history = await get_history(username, contact)
                    await websocket.send(json.dumps({
                        'type': 'history',
                        'contact': contact,
                        'messages': history
                    }))
                
                elif msg_type == 'get_online_users':
                    # Получение списка онлайн пользователей
                    users = await get_online_users()
                    await websocket.send(json.dumps({
                        'type': 'online_users',
                        'users': users
                    }))
                
                elif msg_type == 'typing':
                    # Уведомление о наборе текста
                    if not username:
                        continue
                    
                    recipient = data.get('to')
                    if recipient and recipient in clients:
                        await clients[recipient].send(json.dumps({
                            'type': 'typing',
                            'from': username
                        }))
                
                else:
                    logger.warning(f"Неизвестный тип сообщения: {msg_type}")
            
            except json.JSONDecodeError:
                logger.error(f"Ошибка декодирования JSON: {message}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': 'Неверный формат сообщения'
                }))
            
            except Exception as e:
                logger.error(f"Ошибка обработки сообщения: {e}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Соединение закрыто для {username}")
    
    finally:
        if username:
            await unregister_client(username)


async def main():
    """Запускает WebSocket сервер"""
    # Инициализируем базу данных
    init_database()
    
    host = '0.0.0.0'
    port = 8765
    
    logger.info(f"Запуск сервера на ws://{host}:{port}")
    
    async with websockets.serve(handle_client, host, port):
        logger.info("Сервер запущен и ожидает подключений...")
        logger.info(f"База данных: {DB_PATH}")
        await asyncio.Future()  # Работает вечно


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Сервер остановлен")
