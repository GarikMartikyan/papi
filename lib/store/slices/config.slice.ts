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

export const { setThemeMode, setLocale, syncLocale, setSidebarCollapsed, toggleSidebar } =
  configSlice.actions;

export const { selectThemeMode, selectLocale, selectSidebarCollapsed } = configSlice.selectors;
