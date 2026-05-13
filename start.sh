#!/bin/bash

# Скрипт для быстрого запуска мессенджера

echo "=================================="
echo "🚀 Запуск локального мессенджера"
echo "=================================="
echo ""

# Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python 3.8+"
    exit 1
fi

# Активируем виртуальное окружение
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Виртуальное окружение активировано"
else
    echo "⚠️  Виртуальное окружение не найдено"
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi
echo ""

# Запускаем сервер в фоне
echo "🔌 Запуск сервера..."
python3 server.py &
SERVER_PID=$!
echo "   Сервер запущен (PID: $SERVER_PID)"
sleep 2

# Функция для остановки сервера при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка сервера..."
    kill $SERVER_PID 2>/dev/null
    echo "👋 До свидания!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Запускаем клиентов
echo ""
echo "👥 Запуск клиентов..."
echo "   Откроются окна браузера для каждого пользователя"
echo ""

# Клиент 1
echo "   Запуск клиента: Alice"
python3 client.py Alice ws://localhost:8765 web &
CLIENT1_PID=$!
sleep 1

# Клиент 2
echo "   Запуск клиента: Bob"
python3 client.py Bob ws://localhost:8765 web &
CLIENT2_PID=$!
sleep 1

echo ""
echo "=================================="
echo "✅ Мессенджер запущен!"
echo "=================================="
echo ""
echo "Пользователи:"
echo "  👤 Alice"
echo "  👤 Bob"
echo ""
echo "Для добавления пользователей:"
echo "  python3 client.py <username>"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo "=================================="
echo ""

# Ждем
wait
