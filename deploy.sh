#!/bin/bash

# Скрипт для деплоя сайта на сервер через nginx + Git
# Использование: ./deploy.sh

SERVER="anton@85.192.30.220"
WEB_DIR="/home/anton/sites"
SSH_KEY="~/.ssh/id_rsa_server"
REPO_URL="https://github.com/antonxklimov/remarket.git"
PASSWORD="123456789987654321"

echo "🚀 Деплой сайта на сервер..."
echo "Сервер: $SERVER"
echo "Репозиторий: $REPO_URL"

# Обновляем локальный репозиторий
echo "🔄 Обновление локального репозитория..."
git pull origin main

# Локальная сборка проекта
echo "📦 Локальная сборка проекта..."
npm run build

# Очищаем папку на сервере с sudo
echo "🧹 Очистка папки на сервере..."
ssh -i $SSH_KEY $SERVER "echo '$PASSWORD' | sudo -S rm -rf $WEB_DIR/* && mkdir -p $WEB_DIR/assets && echo '$PASSWORD' | sudo -S chown -R anton:anton $WEB_DIR"

# Загружаем файлы на сервер
echo "⬆️ Загрузка файлов на сервер..."
scp -i $SSH_KEY -r dist/* $SERVER:$WEB_DIR/

# Исправляем права доступа с sudo
echo "🔧 Настройка прав доступа..."
ssh -i $SSH_KEY $SERVER "echo '$PASSWORD' | sudo -S chmod -R 644 $WEB_DIR/* && echo '$PASSWORD' | sudo -S chmod 755 $WEB_DIR && echo '$PASSWORD' | sudo -S chmod 755 $WEB_DIR/assets"

# Проверяем статус nginx
echo "✅ Проверка nginx..."
ssh -i $SSH_KEY $SERVER "echo '$PASSWORD' | sudo -S systemctl status nginx --no-pager -l | head -3"

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: http://85.192.30.220"
echo "🔧 Админка доступна по адресу: http://85.192.30.220/?admin=true"
echo "📋 Git коммит: $(git rev-parse --short HEAD)" 