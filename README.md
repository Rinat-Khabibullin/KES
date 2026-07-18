# Электрика Туапсе

Одностраничный лендинг для команды электриков в Туапсе и районе.

## Ссылки

- Репозиторий: https://github.com/Rinat-Khabibullin/KES

## Запуск локально

```bash
npm install
npm run dev
```

В dev-режиме Vite сам обслуживает `/api/chat`, поэтому Vercel CLI и авторизация в Vercel для локального запуска не нужны.

## Переменные окружения

Добавить локально в `.env.local`, а на Vercel в Project Settings -> Environment Variables:

```env
GIGACHAT_CREDENTIALS=
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat-2
GIGACHAT_TIMEOUT=30
GIGACHAT_VERIFY_SSL=false
LLM_CORS_ORIGIN=http://localhost:5173
```

`GIGACHAT_AUTH_URL`, `GIGACHAT_API_URL` и `GIGACHAT_CA_CERT_PATH` можно оставить как в `.env.example`, если не нужны переопределения.

## Сборка

```bash
npm run build
```

## Проверки

```bash
npm run check
npm run test
npm run build
```

## Прайс и калькулятор

- Единый каталог цен: `src/shared/estimate/catalog.ts`
- Расчётный движок: `src/shared/estimate/calculate.ts`
- Поиск по прайсу: `src/shared/estimate/search.ts`
- UI калькулятора: `src/components/EstimateCalculator/EstimateCalculator.tsx`
- Аудит неоднозначных позиций: `docs/estimate-price-audit.md`

API:

- `GET /api/prices`
- `GET /api/prices/search?q=розетка`
- `POST /api/estimate/calculate`

Чтобы изменить цену, правьте одну строку в `src/shared/estimate/catalog.ts`, затем запускайте:

```bash
npm run check
npm run test
npm run build
```

Для повторной проверки исходного XLSX:

```bash
python3 scripts/extract-price-catalog.py "/path/to/смета_электромонтаж_полная.xlsx"
```

## Настройка чата

- Системный промпт и настройки модели: `api/_chat/prompt.ts`
- Контекст сайта для помощника: `api/_chat/siteContext.ts`
- Связь чата с прайсом и расчетом: `api/_chat/priceContext.ts`
- Быстрые вопросы и приветствие: `src/data/chat.ts`
- Серверный endpoint: `api/chat.ts`
- UI виджета: `src/components/ChatWidget/ChatWidget.tsx`

Деплой на Vercel выполняется автоматически при push в ветку `main`, если проект подключен к этому репозиторию.
