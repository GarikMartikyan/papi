/**
 * API layer — RTK Query base query, error handling and endpoint injection.
 *
 * `notifier` наружу не выходит: это мостик между `baseQuery` и antd, и ставит
 * его `ApiProvider`. Панель показывает свои сообщения через `App.useApp()`
 * напрямую.
 *
 * Ручки лежат в `endpoints/`, по файлу на ресурс; рядом с ними — `api.ts` с
 * самим `createApi` и `baseQuery`. Панель кладёт свои прямо в `src/api/`:
 * подпапка нужна тому, у кого рядом лежит ещё и устройство самого api.
 *
 * Теги ядра здесь не живут: они обычные литералы и лежат со всеми остальными в
 * `constants/tags.constants`. Тут только `injectTags` — им панель объявляет свои
 * и получает в ответ весь набор, так что `@papi/constants` ради тега ядра ей не
 * нужен.
 */

export * from './api';
export * from './baseQuery';
export * from './endpoints/auth.api';
export * from './endpoints/me.api';
export * from './fetchQuery';
export * from './injectTags';
export * from './refreshSession';
