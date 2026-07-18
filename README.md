# Электрика Туапсе

Одностраничный лендинг для команды электриков в Туапсе и районе.

## Ссылки

- Репозиторий: https://github.com/Rinat-Khabibullin/KES

## Запуск локально

Только frontend без serverless API:

```bash
npm install
npm run dev
```

Frontend вместе с `/api/chat` через Vercel Functions:

```bash
npm install
npm install -g vercel
cp .env.example .env.local
vercel dev
```

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

## Настройка чата

- Системный промпт и настройки модели: `api/_chat/prompt.ts`
- Контекст сайта для помощника: `api/_chat/siteContext.ts`
- Быстрые вопросы и приветствие: `src/data/chat.ts`
- Серверный endpoint: `api/chat.ts`
- UI виджета: `src/components/ChatWidget/ChatWidget.tsx`

Деплой на Vercel выполняется автоматически при push в ветку `main`, если проект подключен к этому репозиторию.
