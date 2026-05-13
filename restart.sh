#!/bin/bash
# Скрипт для перезапуска мессенджера

echo "🔄 Перезапуск мессенджера..."

# Останавливаем старые процессы
pkill -f "python.*launcher.py" 2>/dev/null
pkill -f "python.*server.py" 2>/dev/null
sleep 2

echo "✅ Старые процессы остановлены"
echo ""
echo "🚀 Запуск нового сервера..."
echo ""

# Запускаем launcher
cd "$(dirname "$0")"
if [ -d "venv" ]; then
    source venv/bin/activate
fi

python3 launcher.py
