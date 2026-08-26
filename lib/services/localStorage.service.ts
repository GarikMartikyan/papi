import {
  ACCESS_TOKEN_KEY,
  LOCALE_KEY,
  PROJECT_ID_KEY,
  SIDEBAR_COLLAPSED_KEY,
  THEME_MODE_KEY,
} from '../constants/storageKeys.constants';
import type { ThemeMode } from '../types/enums/global.enum';
import type { Locale } from '../types/types/i18n.type';

/**
 * Доступ к localStorage, который не бросает.
 *
 * Чтение самого `localStorage` падает в песочнице iframe, а запись — в приватном
 * режиме Safari при исчерпании квоты. Эти функции вызываются из редьюсеров,
 * поэтому исключение здесь уронило бы весь dispatch.
 */
const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Квота или отключённое хранилище — настройка просто не сохранится.
  }
};

const remove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // См. write.
  }
};

/**
 * Тема, выбранная пользователем в прошлый раз. Читается на старте — с неё
 * начинается `configInitialState`.
 *
 * @returns Схему из хранилища; `null` — выбора там ещё нет или хранилище
 * недоступно. Значение приводится к `ThemeMode` без проверки: чужое туда мог
 * положить только тот, кто правил хранилище руками.
 */
export const getThemeModeLS = () => {
  return read(THEME_MODE_KEY) as ThemeMode | null;
};

/**
 * Запомнить тему — она переживёт перезагрузку. Зовётся из редьюсера
 * `setThemeMode`, панели вызывать её самой не нужно.
 *
 * @param mode Схема, которую выбрал пользователь.
 */
export const setThemeModeLS = (mode: ThemeMode) => {
  write(THEME_MODE_KEY, mode);
};

/** Забыть выбранную тему: следующий старт возьмёт `DEFAULT_THEME_MODE`. */
export const removeThemeModeLS = () => {
  remove(THEME_MODE_KEY);
};

/**
 * Язык, выбранный пользователем в прошлый раз.
 *
 * Без cast: `Locale` — это строка, а поддерживается ли язык, решает провайдер.
 *
 * @returns Тег языка из хранилища; `null` — выбора там ещё нет. Языка может не
 * оказаться в списке панели — сверяет и правит `I18nProvider`.
 */
export const getLocaleLS = () => {
  return read(LOCALE_KEY);
};

/**
 * Запомнить язык. Пишется только явный выбор пользователя: подбор ядра идёт
 * через `syncLocale` и в хранилище не уходит.
 *
 * @param locale Тег языка BCP-47.
 */
export const setLocaleLS = (locale: Locale) => {
  write(LOCALE_KEY, locale);
};

/** Забыть выбранный язык: следующий старт снова начнёт с языка браузера. */
export const removeLocaleLS = () => {
  remove(LOCALE_KEY);
};

/**
 * Токен сессии. Отсюда его берёт `baseQuery` перед каждым запросом — он
 * работает вне React и до стора не дотягивается.
 *
 * @returns Токен; `null` — пользователь не вошёл.
 */
export const getAccessTokenLS = () => {
  return read(ACCESS_TOKEN_KEY);
};

/**
 * Сохранить токен. Зовётся из редьюсера `loggedIn` — панель начинает сессию
 * через `useAuth().login`, а не отсюда.
 *
 * @param token Токен, который вернул вход.
 */
export const setAccessTokenLS = (token: string) => {
  write(ACCESS_TOKEN_KEY, token);
};

/** Стереть токен. Зовётся из редьюсера `loggedOut`; после этого гард уводит на вход. */
export const removeAccessTokenLS = () => {
  remove(ACCESS_TOKEN_KEY);
};

/**
 * Сохранить проект для всех вкладок этого браузера.
 *
 * Напрямую нужна редко: оба хранилища сразу пишет `setProjectId` из
 * `projectId.util` — он же проверяет формат значения.
 *
 * @param projectId Идентификатор проекта; число приводится к строке.
 */
export const setProjectIdLS = (projectId: number | string) => {
  write(PROJECT_ID_KEY, projectId.toString());
};

/**
 * Проект, общий для всех вкладок.
 *
 * @returns Идентификатор; `null` — проект не выбирали. Читать лучше через
 * `getStoredProjectId`: он сперва смотрит в свою вкладку.
 */
export const getProjectIdLS = () => {
  return read(PROJECT_ID_KEY);
};

/** Забыть проект во всём браузере. Обе стороны сразу стирает `removeProjectId`. */
export const removeProjectIdLS = () => {
  remove(PROJECT_ID_KEY);
};

/**
 * Состояние сайдбара с прошлого визита. Читается на старте.
 *
 * @returns Строку `'true'` или `'false'`; `null` — сайдбар ещё не сворачивали.
 * Строкой, а не булевым: в хранилище лежат одни строки, разбирает её
 * `configInitialState`.
 */
export const getSidebarCollapsedLS = () => {
  return read(SIDEBAR_COLLAPSED_KEY);
};

/**
 * Запомнить состояние сайдбара.
 *
 * @param collapsed Свёрнут ли сайдбар.
 */
export const setSidebarCollapsedLS = (collapsed: boolean) => {
  write(SIDEBAR_COLLAPSED_KEY, String(collapsed));
};

/** Забыть состояние сайдбара: следующий старт возьмёт `DEFAULT_SIDEBAR_COLLAPSED`. */
export const removeSidebarCollapsedLS = () => {
  remove(SIDEBAR_COLLAPSED_KEY);
};
