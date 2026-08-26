import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  setLocaleLS,
  setSidebarCollapsedLS,
  setThemeModeLS,
} from '../../services/localStorage.service';
import type { ThemeMode } from '../../types/enums/global.enum';
import type { ConfigState } from '../../types/interfaces/configState.interface';
import type { Locale } from '../../types/types/i18n.type';
import {
  resolveInitialLocale,
  resolveInitialSidebarCollapsed,
  resolveInitialThemeMode,
} from '../../utils';

/**
 * Начальные настройки панели: тема, язык и сайдбар подбираются на старте по
 * localStorage и браузеру — см. `utils/themeMode`, `utils/locale`,
 * `utils/sidebar`. Язык здесь может оказаться неподдерживаемым: список языков
 * приносит панель позже, и сверяет его `I18nProvider`.
 */
export const configInitialState: ConfigState = {
  themeMode: resolveInitialThemeMode(),
  locale: resolveInitialLocale(),
  sidebarCollapsed: resolveInitialSidebarCollapsed(),
};

/**
 * Panel-wide preferences.
 *
 * Начальные значения берутся из localStorage/браузера, а выбор пользователя
 * пишется обратно прямо в редьюсерах — так он сохраняется независимо от того,
 * кто задиспатчил экшен.
 *
 * Пишется именно выбор: подбор языка ядром идёт через `syncLocale` и в
 * хранилище не попадает, иначе догадка стала бы неотличима от решения.
 */
export const configSlice = createSlice({
  name: 'config',
  initialState: configInitialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      setThemeModeLS(action.payload);
    },
    /** Выбор пользователя — он и сохраняется. */
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
      setLocaleLS(action.payload);
    },
    /**
     * Согласование стора со списком языков панели. Это подбор ядра, а не выбор
     * пользователя, поэтому в localStorage не уходит: `resolveInitialLocale`
     * ставит хранилище выше браузера, и записанный подбор был бы необратим —
     * панель навсегда осталась бы на языке, который однажды выбрала сама.
     */
    syncLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
    },
    /**
     * Положение навигации сохраняется наравне с темой и языком: свернувший её
     * освобождает место под свою работу, а не под один экран, и разворачивать
     * её заново на каждом входе пришлось бы вручную.
     *
     * Сохраняется и то, что задиспатчила сама панель: это её решение о своей
     * навигации, а не догадка ядра, — в отличие от `syncLocale`.
     */
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
      setSidebarCollapsedLS(action.payload);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      setSidebarCollapsedLS(state.sidebarCollapsed);
    },
  },
  selectors: {
    selectThemeMode: (state) => state.themeMode,
    selectLocale: (state) => state.locale,
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
  },
});

/**
 * Поставить цветовую схему — выбор пользователя, поэтому он сохраняется.
 *
 * Панели обычно хватает `useThemeMode`.
 *
 * @param mode Схема, которую выбрали.
 */
export const setThemeMode = configSlice.actions.setThemeMode;

/**
 * Поставить язык — выбор пользователя, поэтому он сохраняется.
 *
 * Панели обычно хватает `useLocale`. Поддерживается ли язык, решает
 * `I18nProvider`: незнакомый он заменит на запасной из `I18nConfig`.
 *
 * @param locale Тег языка BCP-47.
 */
export const setLocale = configSlice.actions.setLocale;

/**
 * Согласовать язык со списком панели — подбор ядра, а не выбор пользователя,
 * поэтому в localStorage он не уходит.
 *
 * Диспатчит его `I18nProvider`; панели этот экшен не нужен — ей нужен
 * `setLocale`.
 *
 * @param locale Тег языка, на который ядро согласилось.
 */
export const syncLocale = configSlice.actions.syncLocale;

/**
 * Свернуть или развернуть левый сайдбар. Состояние сохраняется наравне с темой
 * и языком.
 *
 * @param collapsed Свёрнут ли сайдбар.
 */
export const setSidebarCollapsed = configSlice.actions.setSidebarCollapsed;

/** Перевернуть состояние сайдбара. Тем же экшеном это делает кнопка в шапке. */
export const toggleSidebar = configSlice.actions.toggleSidebar;

/**
 * Активная цветовая схема.
 *
 * @returns `ThemeMode.LIGHT` или `ThemeMode.DARK`. Готовый флаг `isDark` есть у
 * `useThemeMode`.
 */
export const selectThemeMode = configSlice.selectors.selectThemeMode;

/**
 * Активный язык.
 *
 * @returns Тег языка. До того, как `I18nProvider` сверит его со списком панели,
 * здесь может лежать язык, которого у неё нет.
 */
export const selectLocale = configSlice.selectors.selectLocale;

/**
 * Свёрнут ли левый сайдбар.
 *
 * @returns `true` — сайдбар свёрнут в столбик иконок.
 * @example
 * ```tsx
 * const collapsed = useAppSelector(selectSidebarCollapsed);
 * ```
 */
export const selectSidebarCollapsed = configSlice.selectors.selectSidebarCollapsed;
