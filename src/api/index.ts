/**
 * API панели — её эндпоинты поверх api ядра.
 *
 * Своего api панель не создаёт: он один, живёт в ядре и приходит из
 * `@papi/api`. Файл эндпоинтов дописывает в него свои ручки и объявляет теги,
 * которые ему нужны:
 *
 * ```ts
 * import { api } from '@papi/api';
 *
 * export const usersApi = api
 *   .enhanceEndpoints({ addTagTypes: ['User'] })
 *   .injectEndpoints({ endpoints: (build) => ({ … }) });
 *
 * export const { useGetUsersQuery } = usersApi;
 * ```
 *
 * Адрес бэкенда сюда не передаётся — ядро читает его из `VITE_API_BASE_URL`.
 *
 * TODO: заглушка — пустой барель. Наполнится, когда у панели появится первый
 * файл эндпоинтов: `export * from './users.api'`.
 */

export {};
