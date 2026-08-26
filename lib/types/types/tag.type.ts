import type { papiRtkTags } from '../../constants/tags.constants';

/**
 * Тег кеша RTK Query — весь набор, который знает api.
 *
 * Теги ядра здесь всегда, теги панели — как только она объявила их в
 * `Papi.ApiTags` (см. `src/types/tags.d.ts`); не объявила — union схлопывается в
 * `string`, и `providesTags` перестаёт что-либо проверять.
 *
 * Тем же приёмом, что `PapiPermission` и `MessageId`, и по той же причине:
 * значения принадлежат панели, а тип нужен ядру — оно ставит его в `tagTypes`
 * при `createApi`.
 *
 * Набор ядра приписан отдельно, хотя `injectTags` и так возвращает его вместе с
 * тегами панели: `values` панель объявляет руками, и стоит ей перечислить там
 * только свои теги, как тег ядра перестал бы проходить в файлах эндпоинтов
 * самого ядра.
 *
 * @example
 * ```ts
 * usersApi.injectEndpoints({
 *   endpoints: (build) => ({
 *     getUsers: build.query<User[], void>({
 *       query: () => '/users',
 *       providesTags: ['Users'] satisfies PapiTag[],
 *     }),
 *   }),
 * });
 * ```
 */
export type PapiTag =
  | (typeof papiRtkTags)[keyof typeof papiRtkTags]
  | (Papi.ApiTags extends { values: infer Values } ? Values : string);
