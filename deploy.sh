#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Настройки сервера
SERVER_IP="85.192.30.220"
SERVER_USER="anton"
SERVER_PATH="/home/anton/sites/remarket"
BACKEND_PATH="/home/anton/sites/remarket-backend"
SSH_KEY="~/.ssh/id_rsa_server"
PASSWORD="123456789987654321"

echo -e "${YELLOW}🚀 Начинаю полный деплой RE→MARKET с очисткой старых файлов...${NC}"

# Шаг 1: Обновляем локальный репозиторий
echo -e "${YELLOW}📥 Обновляю локальный репозиторий...${NC}"
git pull origin main

# Шаг 2: Собираем frontend проект
echo -e "${YELLOW}🔨 Собираю frontend проект...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка сборки frontend проекта${NC}"
    exit 1
fi

# Шаг 3: Останавливаем backend процесс перед очисткой
echo -e "${BLUE}🛑 Останавливаю backend процесс перед очисткой...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "pkill -f 'node.*server.js' || true"

# Шаг 4: Полная очистка frontend папки на сервере
echo -e "${YELLOW}🧹 Полностью очищаю frontend папку на сервере...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S rm -rf $SERVER_PATH/* && echo '$PASSWORD' | sudo -S mkdir -p $SERVER_PATH && echo '$PASSWORD' | sudo -S chown -R anton:anton $SERVER_PATH"

# Шаг 5: Полная очистка backend папки на сервере
echo -e "${BLUE}🧹 Полностью очищаю backend папку на сервере...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "rm -rf $BACKEND_PATH/* && rm -rf $BACKEND_PATH/.* 2>/dev/null || true && mkdir -p $BACKEND_PATH"

# Шаг 6: Загружаем frontend файлы на сервер
echo -e "${YELLOW}📤 Загружаю frontend файлы на сервер...${NC}"
scp -i $SSH_KEY -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Шаг 7: Загружаем backend файлы на сервер
echo -e "${BLUE}📤 Загружаю backend файлы на сервер...${NC}"
scp -i $SSH_KEY -r backend/* $SERVER_USER@$SERVER_IP:$BACKEND_PATH/

# Шаг 8: Устанавливаем только production зависимости backend
echo -e "${BLUE}📦 Устанавливаю только production зависимости backend...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $BACKEND_PATH && npm install --production --no-optional"

# Шаг 9: Обновляем nginx конфигурацию
echo -e "${YELLOW}⚙️ Обновляю nginx конфигурацию...${NC}"
scp -i $SSH_KEY nginx.conf $SERVER_USER@$SERVER_IP:/tmp/remarket.conf
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S mv /tmp/remarket.conf /etc/nginx/sites-available/remarket && echo '$PASSWORD' | sudo -S ln -sf /etc/nginx/sites-available/remarket /etc/nginx/sites-enabled/remarket"

# Шаг 10: Устанавливаем права доступа
echo -e "${YELLOW}🔐 Устанавливаю права доступа...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S chown -R www-data:www-data $SERVER_PATH && echo '$PASSWORD' | sudo -S chmod -R 755 $SERVER_PATH"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "chown -R $SERVER_USER:$SERVER_USER $BACKEND_PATH && chmod -R 755 $BACKEND_PATH"

# Шаг 11: Запускаем новый backend процесс
echo -e "${BLUE}🚀 Запускаю новый backend процесс...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $BACKEND_PATH && nohup node server.js > backend.log 2>&1 & echo \$! > backend.pid"

# Ждем немного, чтобы backend запустился
sleep 3

# Шаг 12: Проверяем, что backend запущен
echo -e "${BLUE}🏥 Проверяю статус backend...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "curl -s http://localhost:3001/api/health || echo 'Backend не отвечает'"

# Шаг 13: Перезапускаем nginx
echo -e "${YELLOW}🔄 Перезапускаю nginx...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S nginx -t && echo '$PASSWORD' | sudo -S systemctl reload nginx"

# Шаг 14: Проверяем статус nginx
echo -e "${YELLOW}🏥 Проверяю статус nginx...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S systemctl status nginx --no-pager -l | head -5"

# Шаг 15: Показываем информацию о размере node_modules
echo -e "${BLUE}📊 Размер установленных зависимостей:${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $BACKEND_PATH && du -sh node_modules 2>/dev/null || echo 'node_modules не найден'"

# Шаг 16: Показываем текущий коммит
echo -e "${YELLOW}📋 Текущий коммит:${NC}"
git log --oneline -1

echo -e "${GREEN}✅ Полный деплой завершен успешно!${NC}"
echo -e "${GREEN}🌐 Сайт доступен по адресу: http://$SERVER_IP${NC}"
echo -e "${GREEN}🔗 API доступен по адресу: http://$SERVER_IP/api/health${NC}"
echo -e "${GREEN}🔧 Админка доступна по адресу: http://$SERVER_IP/?admin=true${NC}" 