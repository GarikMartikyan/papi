/**
 * Ключи хранилищ. Префикс нужен потому, что несколько панелей могут работать
 * на одном origin и без него перетирали бы настройки друг друга.
 */
const PREFIX = 'papi';

export const THEME_MODE_KEY = `${PREFIX}:theme_mode`;
export const LOCALE_KEY = `${PREFIX}:locale`;
export const ACCESS_TOKEN_KEY = `${PREFIX}:access_token`;
export const SIDEBAR_COLLAPSED_KEY = `${PREFIX}:sidebar_collapsed`;

/** Общий для localStorage и sessionStorage — объявлен один раз намеренно. */
export const PROJECT_ID_KEY = `${PREFIX}:project_id`;
