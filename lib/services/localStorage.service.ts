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

export const getThemeModeLS = () => {
  return read(THEME_MODE_KEY) as ThemeMode | null;
};

export const setThemeModeLS = (mode: ThemeMode) => {
  write(THEME_MODE_KEY, mode);
};

export const removeThemeModeLS = () => {
  remove(THEME_MODE_KEY);
};

/** Без cast: `Locale` — это строка, а поддерживается ли язык, решает провайдер. */
export const getLocaleLS = () => {
  return read(LOCALE_KEY);
};

export const setLocaleLS = (locale: Locale) => {
  write(LOCALE_KEY, locale);
};

export const removeLocaleLS = () => {
  remove(LOCALE_KEY);
};

export const getAccessTokenLS = () => {
  return read(ACCESS_TOKEN_KEY);
};

export const setAccessTokenLS = (token: string) => {
  write(ACCESS_TOKEN_KEY, token);
};

export const removeAccessTokenLS = () => {
  remove(ACCESS_TOKEN_KEY);
};

export const setProjectIdLS = (projectId: number | string) => {
  write(PROJECT_ID_KEY, projectId.toString());
};

export const getProjectIdLS = () => {
  return read(PROJECT_ID_KEY);
};

export const removeProjectIdLS = () => {
  remove(PROJECT_ID_KEY);
};

export const getSidebarCollapsedLS = () => {
  return read(SIDEBAR_COLLAPSED_KEY);
};

export const setSidebarCollapsedLS = (collapsed: boolean) => {
  write(SIDEBAR_COLLAPSED_KEY, String(collapsed));
};

export const removeSidebarCollapsedLS = () => {
  remove(SIDEBAR_COLLAPSED_KEY);
};
