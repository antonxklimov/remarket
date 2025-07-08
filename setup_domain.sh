#!/bin/bash

# Скрипт для настройки домена
# Использование: ./setup_domain.sh your-domain.com

if [ $# -eq 0 ]; then
    echo "Использование: $0 <domain.com>"
    echo "Пример: $0 example.com"
    exit 1
fi

DOMAIN=$1
EMAIL="re.market.re@yandex.ru"

echo "=== Настройка домена $DOMAIN ==="

# 1. Обновляем конфигурацию nginx
echo "1. Обновляем конфигурацию nginx..."
sed -i "s/your-domain.com/$DOMAIN/g" nginx_domain.conf

# 2. Копируем конфигурацию на сервер
echo "2. Копируем конфигурацию nginx..."
sudo cp nginx_domain.conf /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# 3. Проверяем конфигурацию nginx
echo "3. Проверяем конфигурацию nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Конфигурация nginx корректна"
else
    echo "Ошибка в конфигурации nginx"
    exit 1
fi

# 4. Перезапускаем nginx
echo "4. Перезапускаем nginx..."
sudo systemctl reload nginx

# 5. Устанавливаем certbot если не установлен
if ! command -v certbot &> /dev/null; then
    echo "5. Устанавливаем certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# 6. Получаем SSL сертификат
echo "6. Получаем SSL сертификат для $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

if [ $? -eq 0 ]; then
    echo "SSL сертификат успешно получен!"
else
    echo "Ошибка при получении SSL сертификата"
    echo "Убедитесь, что:"
    echo "1. Домен указывает на IP-адрес сервера"
    echo "2. Порты 80 и 443 открыты"
    echo "3. Nginx работает корректно"
    exit 1
fi

# 7. Настраиваем автообновление сертификата
echo "7. Настраиваем автообновление сертификата..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "=== Настройка завершена! ==="
echo "Домен: https://$DOMAIN"
echo "Проверьте работу сайта по адресу: https://$DOMAIN" 