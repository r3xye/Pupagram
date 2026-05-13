#!/bin/bash
# Скрипт для запуска мессенджера с доступом из локальной сети

cd "$(dirname "$0")"

# Получаем локальный IP
LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -1)

echo "════════════════════════════════════════════════════════════"
echo "🚀 Запуск мессенджера с сетевым доступом"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Ваш локальный IP: $LOCAL_IP"
echo ""
echo "📱 Для вас (на этом компьютере):"
echo "   http://localhost:8000/frontend.html?user=YourName"
echo ""
echo "🌐 Для друзей в вашей сети:"
echo "   http://$LOCAL_IP:8000/frontend.html?user=FriendName"
echo ""
echo "💡 Отправьте эту ссылку другу:"
echo "   http://$LOCAL_IP:8000/frontend.html?user=Friend"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Активируем виртуальное окружение если есть
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Запускаем лаунчер
python3 launcher.py
