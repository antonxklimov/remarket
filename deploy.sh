#!/bin/bash

# Скрипт для деплоя сайта на сервер через nginx
# Использование: ./deploy.sh

SERVER="anton@85.192.30.220"
WEB_DIR="/home/anton/sites"
SSH_KEY="~/.ssh/id_rsa_server"

echo "🚀 Деплой сайта на сервер..."
echo "Сервер: $SERVER"
echo "Директория: $WEB_DIR"

# Собираем проект
echo "📦 Сборка проекта..."
npm run build

# Загружаем файлы на сервер
echo "⬆️ Загрузка файлов на сервер..."
scp -i $SSH_KEY -r dist/* $SERVER:$WEB_DIR/

# Исправляем права доступа
echo "🔧 Настройка прав доступа..."
ssh -i $SSH_KEY $SERVER "chmod 755 $WEB_DIR && chmod 755 $WEB_DIR/assets && chmod 644 $WEB_DIR/* && chmod 644 $WEB_DIR/assets/*"

# Проверяем статус nginx
echo "✅ Проверка nginx..."
ssh -i $SSH_KEY $SERVER "echo '123456789987654321' | sudo -S systemctl status nginx --no-pager -l | head -10"

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: http://85.192.30.220"
echo "🔧 Админка доступна по адресу: http://85.192.30.220/?admin=true" 