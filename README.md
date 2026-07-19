# Электрика Туапсе

Сайт электромонтажных услуг в Туапсе и районе.

## Ссылки

- Сайт: https://www.electrik-tuapse.ru/
- Калькулятор: https://www.electrik-tuapse.ru/calculator
- Репозиторий: https://github.com/Rinat-Khabibullin/KES

## Запуск

```bash
npm install
npm run dev
```

`npm run dev` запускает Vite и локальный middleware для `/api/*`.

Для проверки реального Vercel runtime:

```bash
npm run dev:vercel
npm run build:vercel
```

## Проверки

```bash
npm run check
npm run test
npm run build
npm run build:vercel
```

## Страницы

- `/` — продающий лендинг.
- `/calculator` — полный калькулятор электромонтажных работ.
- Неизвестный маршрут показывает страницу возврата на главную.

SPA rewrite настроен в `vercel.json`; `/api/*`, ассеты, фото работ и файлы с расширением не переписываются в `index.html`.

## Переменные окружения

Локально значения лежат в `.env.local`. На Vercel добавить эти же переменные в Project Settings -> Environment Variables отдельно для Development, Preview и Production:

```env
GIGACHAT_CREDENTIALS=
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat-2
GIGACHAT_TIMEOUT=30
GIGACHAT_VERIFY_SSL=true
GIGACHAT_AUTH_URL=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_API_URL=https://api.giga.chat/v1/chat/completions
GIGACHAT_CA_CERT_BASE64=
LLM_CORS_ORIGINS=https://electrik-tuapse.ru,https://www.electrik-tuapse.ru
```

Для локальной диагностики допускается `GIGACHAT_VERIFY_SSL=false`. В Production лучше использовать `true` и передать сертификат через `GIGACHAT_CA_CERT_BASE64` или `GIGACHAT_CA_CERT_PATH`.

После изменения переменных на Vercel нужен новый deployment.

## Диагностика чата

- `GET /api/health/chat` — безопасная проверка окружения без OAuth-запроса.
- `POST /api/chat` — основной endpoint помощника.
- `OPTIONS /api/chat` — CORS preflight.

Health endpoint не возвращает ключи, токены и содержимое сертификата.

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

Чтобы изменить цену, правьте одну строку в `src/shared/estimate/catalog.ts`, затем запускайте проверки.

Для повторной проверки исходного XLSX:

```bash
python3 scripts/extract-price-catalog.py "/path/to/смета_электромонтаж_полная.xlsx"
```

## Чат

- Системный промпт и настройки модели: `api/_chat/prompt.ts`
- Контекст сайта: `api/_chat/siteContext.ts`
- Фильтр тем: `api/_chat/guards.ts`
- Связь чата с прайсом и расчетом: `api/_chat/priceContext.ts`
- GigaChat HTTP-клиент: `api/_chat/gigachatClient.ts`
- Runtime config/CORS/health: `api/_chat/runtime.ts`
- UI виджета: `src/components/ChatWidget/ChatWidget.tsx`

Деплой на Vercel выполняется автоматически при push в ветку `main`, если проект подключен к этому репозиторию.
