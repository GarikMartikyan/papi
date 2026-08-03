import { createApi } from '@reduxjs/toolkit/query/react';

import { papiBaseQuery } from './baseQuery';

/**
 * Единственный api-слайс ядра.
 *
 * Живёт в papi, а не в панели, потому что его редьюсер и middleware
 * регистрируются при создании стора — после этого middleware уже не добавить.
 * Панель не создаёт свой api, а дописывает эндпоинты в этот через
 * `injectEndpoints` (см. `configureApi`).
 *
 * `tagTypes` не задан: набор тегов фиксируется в `createApi`, поэтому теги
 * панели добавляются в `configureApi` через `enhanceEndpoints`.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: papiBaseQuery,
  endpoints: () => ({}),
});
