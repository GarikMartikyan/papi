/**
 * Ключи хранилищ. Префикс нужен потому, что несколько панелей могут работать
 * на одном origin и без него перетирали бы настройки друг друга.
 */
const PREFIX = 'papi';

/** Выбранная цветовая схема — значение `ThemeMode`. */
export const THEME_MODE_KEY = `${PREFIX}:theme_mode`;

/** Выбранный язык — тег BCP-47. Пишется только явный выбор пользователя. */
export const LOCALE_KEY = `${PREFIX}:locale`;

/**
 * Токен доступа. Читается ещё и вне React — `baseQuery` берёт его отсюда перед
 * каждым запросом, до стора он не дотягивается.
 */
export const ACCESS_TOKEN_KEY = `${PREFIX}:access_token`;

/**
 * Токен обновления. Живёт неделю и одноразовый: каждая ротация выдаёт новый,
 * а предъявленный второй раз бэкенд считает кражей и отзывает всю семью
 * токенов этой сессии.
 */
export const REFRESH_TOKEN_KEY = `${PREFIX}:refresh_token`;

/** Свёрнут ли левый сайдбар — `'true'` или `'false'`. Читается на старте. */
export const SIDEBAR_COLLAPSED_KEY = `${PREFIX}:sidebar_collapsed`;

/** Общий для localStorage и sessionStorage — объявлен один раз намеренно. */
export const PROJECT_ID_KEY = `${PREFIX}:project_id`;
