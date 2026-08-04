/**
 * API layer — RTK Query base query, error handling and endpoint injection.
 *
 * `errorNotifier` наружу не выходит: это мостик между `baseQuery` и antd, и
 * ставит его `ApiProvider`. Панель показывает свои сообщения через
 * `App.useApp()` напрямую.
 *
 * Ручки лежат в `endpoints/`, по файлу на ресурс; рядом с ними — `api.ts` с
 * самим `createApi` и `baseQuery`. Панель складывает свои так же —
 * `src/api/endpoints/`.
 *
 * Теги здесь не живут: они обычные литералы ядра и лежат со всеми остальными в
 * `constants/tags.constants` — оттуда же их берёт и панель, через
 * `@papi/constants`.
 */

export * from './api';
export * from './baseQuery';
export * from './endpoints/auth.api';
export * from './endpoints/me.api';
