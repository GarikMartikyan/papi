import { createApi } from '@reduxjs/toolkit/query/react';

import { papiRtkTags } from '../constants/tags.constants';
import type { PapiTag } from '../types/types/tag.type';

import { papiBaseQuery } from './baseQuery';

/**
 * Набор тегов кеша, с которым создаётся api.
 *
 * Весь набор ядра сразу, а не по тегу на файл эндпоинтов:
 * `createApi` фиксирует набор при создании, и файл, объявляющий только свои
 * теги, не смог бы инвалидировать чужой. Теги перечислены константами из
 * `constants/tags.constants` — опечатка в строке по месту не ломает сборку, она
 * просто тихо перестаёт инвалидировать кеш.
 *
 * Значений панели в массиве нет и быть не может: ядро о её сущностях не знает.
 * Она дописывает их в рантайме — `injectTags` в `src/constants/tags.constants`.
 * Приведение к `PapiTag` — вторая половина того же: тип `TagTypes` выводится из
 * этого массива, и без него `providesTags` не принял бы тег панели, сколько бы
 * их ни добавили в рантайме. Сам `PapiTag` собирается из объявления
 * `Papi.ApiTags`, которое панель пишет у себя.
 *
 * Отдельной переменной с типом, а не значением по месту: `TagTypes` выводится из
 * того, что лежит в `tagTypes`, и без аннотации вывелся бы `'Me'`.
 */
const tagTypes: PapiTag[] = Object.values(papiRtkTags);

/**
 * Единственный api на всю панель.
 *
 * Живёт в ядре, а не в панели, потому что его редьюсер и middleware
 * регистрируются при создании стора, а после этого middleware уже не добавить.
 * Поэтому свой api панель не создаёт — она дописывает эндпоинты в этот.
 *
 * Запросы уходят через `papiBaseQuery`: адрес из `VITE_API_BASE_URL`, токен в
 * заголовке, тосты на ошибку и на успех, выход из сессии по 401.
 *
 * @example
 * ```ts
 * import { api } from '@papi/api';
 *
 * export const usersApi = api.injectEndpoints({
 *   endpoints: (build) => ({
 *     getUsers: build.query<User[], void>({
 *       query: () => '/users',
 *       providesTags: [rtkTags.users],
 *     }),
 *   }),
 * });
 *
 * export const { useGetUsersQuery } = usersApi;
 * ```
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: papiBaseQuery,
  tagTypes,
  endpoints: () => ({}),
});
