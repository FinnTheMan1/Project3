# DevSpace 3.0 — курсовой проект

АИС «DevSpace» для ООО «Digital Core». Интерфейс ориентирован на минималистичный стиль Notion, а серверная часть построена на Node.js + Express + PostgreSQL 16.

## Что уже работает

- React/Vite интерфейс;
- Express API;
- JWT-авторизация;
- роли: Администратор / Руководитель / Разработчик;
- проекты;
- задачи и статусы;
- проектный чат;
- управление пользователями;
- профиль;
- PostgreSQL-схема из 7 таблиц;
- демо-режим без PostgreSQL;
- полноценная инициализация PostgreSQL командой `npm run db:init`.

## 1. Установка зависимостей

В PowerShell из папки проекта:

```powershell
npm install
```

## 2. PostgreSQL

Установите PostgreSQL 16 и создайте базу `devspace`.

Через pgAdmin:
1. Databases → Create → Database
2. Name: `devspace`
3. Owner: `postgres`

## 3. Файл .env

Скопируйте `.env.example` в `.env`.

Для стандартной установки PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@127.0.0.1:5432/devspace
JWT_SECRET=devspace-course-secret-change-me
PORT=3001
```

Если пароль пользователя `postgres` — `postgres`, оставьте строку из `.env.example`.

## 4. Создать таблицы и загрузить демо-данные

```powershell
npm run db:init
```

Команда создаст 7 таблиц и загрузит тестовых пользователей, проекты, задачи и сообщения.

## 5. Запуск

```powershell
npm run dev:all
```

Открыть:

`http://127.0.0.1:5173/`

API:

`http://127.0.0.1:3001/api/health`

## Демо-аккаунты

- `admin` / `admin` — Администратор
- `anna` / `admin` — Руководитель
- `ivan` / `admin` — Разработчик
- `maria` / `admin` — Разработчик

## Если PostgreSQL пока не установлен

Можно просто выполнить:

```powershell
npm install
npm run dev:all
```

Приложение автоматически перейдёт в Demo Mode и продолжит работать без БД.

## Важно

Это уже рабочая клиент-серверная основа курсовой. Следующий функциональный слой можно расширить: комментарии к задачам, загрузка файлов, сброс/смена пароля, редактирование пользователей и управление составом проекта.
