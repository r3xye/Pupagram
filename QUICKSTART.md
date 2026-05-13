# 🚀 Быстрый старт

## Что изменилось

✅ **Удалены боты** - теперь только реальные пользователи
✅ **Постоянная память** - все сообщения сохраняются в SQLite базу данных
✅ **История не теряется** при перезапуске сервера

## Запуск

### Вариант 1: Автоматический (рекомендуется)

```bash
cd /home/r3xye/messenger
./start.sh
```

Это запустит:
- Сервер на порту 8765
- Двух клиентов (Alice и Bob)
- Откроет браузер для каждого

### Вариант 2: Ручной запуск

**Терминал 1 - Сервер:**
```bash
cd /home/r3xye/messenger
source venv/bin/activate
python3 server.py
```

**Терминал 2 - Клиент Alice:**
```bash
cd /home/r3xye/messenger
source venv/bin/activate
python3 client.py Alice
```

**Терминал 3 - Клиент Bob:**
```bash
cd /home/r3xye/messenger
source venv/bin/activate
python3 client.py Bob
```

**Терминал 4 - Клиент Charlie:**
```bash
cd /home/r3xye/messenger
source venv/bin/activate
python3 client.py Charlie
```

## Как пользоваться

1. **Запустите сервер и клиенты**
2. **Откроется браузер** с интерфейсом мессенджера
3. **Отправьте сообщение** другому пользователю
4. **История сохраняется** автоматически в `messenger.db`

## Где хранятся сообщения

Все сообщения сохраняются в файле:
```
/home/r3xye/messenger/messenger.db
```

## Просмотр истории в базе

```bash
cd /home/r3xye/messenger
sqlite3 messenger.db "SELECT sender, recipient, text, timestamp FROM messages ORDER BY id DESC LIMIT 10;"
```

## Остановка

Нажмите `Ctrl+C` в терминале с сервером

## Проблемы?

**Порт занят:**
```bash
# Найти процесс на порту 8765
lsof -i :8765
# Убить процесс
kill -9 <PID>
```

**Не подключается к серверу:**
- Проверьте, что сервер запущен
- Проверьте, что используется правильный порт (8765)

**База данных повреждена:**
```bash
rm messenger.db
# Будет создана заново при запуске сервера
```
