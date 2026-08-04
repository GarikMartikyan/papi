import { createApi } from '@reduxjs/toolkit/query/react';

import { papiBaseQuery } from './baseQuery';

/**
 * Единственный api на всю панель.
 *
 * Живёт в ядре, а не в панели, потому что его редьюсер и middleware
 * регистрируются при создании стора, а после этого middleware уже не добавить.
 * Поэтому свой api панель не создаёт — она дописывает эндпоинты в этот:
 *
 * ```ts
 * import { api } from '@papi/api';
 *
 * export const usersApi = api
 *   .enhanceEndpoints({ addTagTypes: ['User'] })
 *   .injectEndpoints({ endpoints: (build) => ({ … }) });
 * ```
 *
 * `tagTypes` здесь пуст, и заполнить его в ядре нельзя: `createApi` фиксирует
 * набор тегов при создании, а какие теги нужны — знает только панель. Поэтому
 * теги объявляет файл эндпоинтов, через `enhanceEndpoints`. В рантайме это тот
 * же объект, набор расширяется только на уровне типов, — но `injectEndpoints`
 * вызывается именно у результата: через `api` TS не пропустит новый тег в
 * `providesTags`.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: papiBaseQuery,
  endpoints: () => ({}),
});
