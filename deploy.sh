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

echo -e "${YELLOW}🚀 Начинаю деплой RE→MARKET с Backend API...${NC}"

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

# Шаг 3: Останавливаем старый backend процесс
echo -e "${BLUE}🛑 Останавливаю старый backend процесс...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "pkill -f 'node.*server.js' || true"

# Шаг 4: Сохраняем контент перед очисткой
echo -e "${YELLOW}💾 Сохраняю контент (data и uploads) перед очисткой...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "mkdir -p /tmp/backup_deploy && cp -r $BACKEND_PATH/data /tmp/backup_deploy/ 2>/dev/null || echo 'папка data не найдена для бекапа'"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cp -r $BACKEND_PATH/uploads /tmp/backup_deploy/ 2>/dev/null || echo 'папка uploads не найдена для бекапа'"

# Шаг 5: Полностью очищаем папки на сервере
echo -e "${YELLOW}🧹 Полностью очищаю папки на сервере...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S rm -rf $SERVER_PATH/* $SERVER_PATH/.* 2>/dev/null || true"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "rm -rf $BACKEND_PATH/* $BACKEND_PATH/.* 2>/dev/null || true"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S mkdir -p $SERVER_PATH && echo '$PASSWORD' | sudo -S chown -R anton:anton $SERVER_PATH"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "mkdir -p $BACKEND_PATH"

# Шаг 5: Загружаем frontend файлы на сервер
echo -e "${YELLOW}📤 Загружаю frontend файлы на сервер...${NC}"
scp -i $SSH_KEY -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Шаг 6: Загружаем только необходимые backend файлы на сервер (исключаем node_modules)
echo -e "${BLUE}📤 Загружаю backend файлы на сервер...${NC}"
scp -i $SSH_KEY backend/package.json $SERVER_USER@$SERVER_IP:$BACKEND_PATH/
scp -i $SSH_KEY backend/server.js $SERVER_USER@$SERVER_IP:$BACKEND_PATH/
scp -i $SSH_KEY backend/auth.js $SERVER_USER@$SERVER_IP:$BACKEND_PATH/

# Восстанавливаем данные из бекапа, если они есть
echo -e "${BLUE}🔄 Восстанавливаю сохраненный контент...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cp -r /tmp/backup_deploy/data $BACKEND_PATH/ 2>/dev/null || echo 'нет данных для восстановления'"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cp -r /tmp/backup_deploy/uploads $BACKEND_PATH/ 2>/dev/null || echo 'нет изображений для восстановления'"

# Если локальные папки существуют, приоритет у них (для первого деплоя)
scp -i $SSH_KEY -r backend/data $SERVER_USER@$SERVER_IP:$BACKEND_PATH/ 2>/dev/null || echo "папка data не найдена локально"
scp -i $SSH_KEY -r backend/uploads $SERVER_USER@$SERVER_IP:$BACKEND_PATH/ 2>/dev/null || echo "папка uploads не найдена локально"

# Шаг 7: Устанавливаем зависимости backend на сервере
echo -e "${BLUE}📦 Устанавливаю зависимости backend на сервере...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cd $BACKEND_PATH && npm install --production --no-optional --silent"

# Шаг 8: Обновляем nginx конфигурацию
echo -e "${YELLOW}⚙️ Обновляю nginx конфигурацию...${NC}"
scp -i $SSH_KEY nginx.conf $SERVER_USER@$SERVER_IP:/tmp/remarket.conf
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S mv /tmp/remarket.conf /etc/nginx/sites-available/remarket && echo '$PASSWORD' | sudo -S ln -sf /etc/nginx/sites-available/remarket /etc/nginx/sites-enabled/remarket"

# Шаг 9: Устанавливаем права доступа
echo -e "${YELLOW}🔐 Устанавливаю права доступа...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S chown -R www-data:www-data $SERVER_PATH && echo '$PASSWORD' | sudo -S chmod -R 755 $SERVER_PATH"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "chown -R $SERVER_USER:$SERVER_USER $BACKEND_PATH && chmod -R 755 $BACKEND_PATH"

# Шаг 10: Создаем скрипт запуска backend на сервере
echo -e "${BLUE}🚀 Создаю скрипт запуска backend...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "cat > $BACKEND_PATH/start_backend.sh << 'EOF'
#!/bin/bash
cd $BACKEND_PATH
nohup node server.js > backend.log 2>&1 < /dev/null &
echo \$! > backend.pid
echo \"Backend started with PID: \$(cat backend.pid)\"
EOF"

# Делаем скрипт исполняемым и запускаем
echo -e "${BLUE}📋 Запускаю backend через отдельный скрипт...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "chmod +x $BACKEND_PATH/start_backend.sh && timeout 10s $BACKEND_PATH/start_backend.sh || echo 'Script completed or timed out'"

# Ждем запуска
sleep 3

# Шаг 11: Проверяем статус backend
echo -e "${BLUE}🏥 Проверяю статус backend...${NC}"
for i in {1..3}; do
    BACKEND_STATUS=$(ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "curl -s http://localhost:3001/api/health -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 5 2>/dev/null || echo '000'")
    if [ "$BACKEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Backend работает корректно (попытка $i)${NC}"
        break
    else
        echo -e "${YELLOW}⚠️ Backend не отвечает (попытка $i), пробую альтернативный способ...${NC}"
        if [ "$i" = "3" ]; then
            # Последняя попытка через screen
            ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "pkill -f 'node.*server.js' || true && cd $BACKEND_PATH && screen -dm -S backend node server.js"
            sleep 2
            BACKEND_STATUS=$(ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "curl -s http://localhost:3001/api/health -o /dev/null -w '%{http_code}' --connect-timeout 3 2>/dev/null || echo '000'")
            if [ "$BACKEND_STATUS" = "200" ]; then
                echo -e "${GREEN}✅ Backend запущен через screen${NC}"
            else
                echo -e "${RED}❌ Backend не удалось запустить${NC}"
            fi
        else
            sleep 2
        fi
    fi
done

# Шаг 12: Перезапускаем nginx
echo -e "${YELLOW}🔄 Перезапускаю nginx...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S nginx -t && echo '$PASSWORD' | sudo -S systemctl reload nginx"

# Шаг 13: Проверяем статус nginx
echo -e "${YELLOW}🏥 Проверяю статус nginx...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "echo '$PASSWORD' | sudo -S systemctl status nginx --no-pager -l | head -5"

# Шаг 14: Показываем размер установленных пакетов
echo -e "${BLUE}📊 Размер backend папки на сервере:${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "du -sh $BACKEND_PATH"

# Шаг 15: Показываем текущий коммит
echo -e "${YELLOW}📋 Текущий коммит:${NC}"
git log --oneline -1

# Очищаем временную папку бекапа
echo -e "${YELLOW}🧹 Очищаю временную папку бекапа...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "rm -rf /tmp/backup_deploy"

echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo -e "${GREEN}🌐 Сайт доступен по адресу: http://$SERVER_IP${NC}"
echo -e "${GREEN}🔗 API доступен по адресу: http://$SERVER_IP/api/health${NC}"
echo -e "${GREEN}🔧 Админка доступна по адресу: http://$SERVER_IP/?admin=true${NC}" 