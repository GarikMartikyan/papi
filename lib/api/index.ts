/**
 * API layer — RTK Query base query and endpoint injection.
 *
 * TODO: общей обработки ошибок нет — разбор `FetchBaseQueryError` и реакция на
 * 401 появятся, когда будет известен формат ошибок бэкенда.
 */

export * from './apiConfig';
export * from './baseApi';
export * from './baseQuery';
export * from './configureApi';
