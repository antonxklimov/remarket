# 🚀 Быстрый старт: remarket.cc

## 📋 Данные для настройки

- **Домен**: `remarket.cc`
- **IP сервера**: `85.192.30.220`
- **Email**: `re.market.re@yandex.ru`

## 🔧 DNS-записи для владельца домена

Владелец домена должен настроить:

```
remarket.cc.     A    85.192.30.220
www.remarket.cc. A    85.192.30.220
```

## ⚡ Быстрая настройка

### 1. Подготовка файлов
```bash
# Сделать скрипт исполняемым
chmod +x setup_domain.sh
```

### 2. Запуск автоматической настройки
```bash
./setup_domain.sh remarket.cc
```

### 3. Проверка результата
```bash
# Проверка DNS
nslookup remarket.cc

# Проверка доступности
curl -I https://remarket.cc

# Проверка SSL
sudo certbot certificates
```

## ✅ Что произойдет автоматически

1. ✅ Обновление конфигурации nginx
2. ✅ Копирование конфигурации на сервер
3. ✅ Проверка конфигурации nginx
4. ✅ Перезапуск nginx
5. ✅ Установка certbot (если не установлен)
6. ✅ Получение SSL-сертификата
7. ✅ Настройка автообновления сертификата

## 🌐 Результат

После успешного выполнения:
- **HTTP**: `http://remarket.cc` → редирект на HTTPS
- **HTTPS**: `https://remarket.cc` → основной сайт
- **WWW**: `https://www.remarket.cc` → основной сайт

## 🔍 Проверка работоспособности

```bash
# Проверка всех компонентов
curl -I http://remarket.cc    # Должен вернуть 301 редирект
curl -I https://remarket.cc   # Должен вернуть 200 OK
curl -I https://www.remarket.cc # Должен вернуть 200 OK

# Проверка API
curl -I https://remarket.cc/api/health

# Проверка загрузки изображений
curl -I https://remarket.cc/uploads/test.jpg
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `sudo tail -f /var/log/nginx/remarket_error.log`
2. Проверьте статус nginx: `sudo systemctl status nginx`
3. Проверьте SSL: `sudo certbot certificates`

## 🎯 Готово!

Сайт фестиваля RE→MARKET 2025 будет доступен по адресу:
**https://remarket.cc** 