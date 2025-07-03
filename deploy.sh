#!/bin/bash

# Скрипт для деплоя сайта на сервер через nginx + Git
# Использование: ./deploy.sh

SERVER="anton@85.192.30.220"
WEB_DIR="/home/anton/sites"
SSH_KEY="~/.ssh/id_rsa_server"
REPO_URL="https://github.com/antonxklimov/remarket.git"
REPO_DIR="/home/anton/remarket-repo"

echo "🚀 Деплой сайта на сервер..."
echo "Сервер: $SERVER"
echo "Репозиторий: $REPO_URL"

# Локальная сборка проекта
echo "📦 Локальная сборка проекта..."
npm run build

# Проверяем, существует ли репозиторий на сервере
echo "🔍 Проверка репозитория на сервере..."
REPO_EXISTS=$(ssh -i $SSH_KEY $SERVER "[ -d '$REPO_DIR' ] && echo 'exists' || echo 'not_exists'")

if [ "$REPO_EXISTS" = "not_exists" ]; then
    echo "📥 Клонирование репозитория на сервер..."
    ssh -i $SSH_KEY $SERVER "git clone $REPO_URL $REPO_DIR"
else
    echo "🔄 Обновление репозитория на сервере..."
    ssh -i $SSH_KEY $SERVER "cd $REPO_DIR && git pull origin main"
fi

# Устанавливаем зависимости на сервере (если нужно)
echo "📦 Установка зависимостей на сервере..."
ssh -i $SSH_KEY $SERVER "cd $REPO_DIR && npm install --production"

# Собираем проект на сервере
echo "🔧 Сборка проекта на сервере..."
ssh -i $SSH_KEY $SERVER "cd $REPO_DIR && npm run build"

# Копируем файлы из build в web-директорию
echo "📁 Копирование файлов в web-директорию..."
ssh -i $SSH_KEY $SERVER "cp -r $REPO_DIR/dist/* $WEB_DIR/"

# Исправляем права доступа
echo "🔧 Настройка прав доступа..."
ssh -i $SSH_KEY $SERVER "chmod 755 $WEB_DIR && chmod 755 $WEB_DIR/assets && chmod 644 $WEB_DIR/* && chmod 644 $WEB_DIR/assets/*"

# Проверяем статус nginx
echo "✅ Проверка nginx..."
ssh -i $SSH_KEY $SERVER "echo '123456789987654321' | sudo -S systemctl status nginx --no-pager -l | head -5"

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: http://85.192.30.220"
echo "🔧 Админка доступна по адресу: http://85.192.30.220/?admin=true"
echo "📋 Git коммит: $(git rev-parse --short HEAD)" 