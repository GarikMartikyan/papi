import { DEFAULT_THEME_MODE } from '../constants/defaults.constants';
import { getThemeModeLS } from '../services/localStorage.service';
import { ThemeMode } from '../types/enums/global.enum';

import { warn } from './logger.util';

const THEME_MODES = new Set<string>(Object.values(ThemeMode));

/** Тема, которую сейчас запрашивает система. `null`, если узнать нельзя. */
export const getSystemThemeMode = (): ThemeMode | null => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? ThemeMode.DARK
    : ThemeMode.LIGHT;
};

/**
 * Тема при старте: localStorage → системная → LIGHT.
 *
 * Значение из хранилища валидируется, а не берётся на веру: `getThemeModeLS`
 * делает cast, поэтому там может оказаться что угодно.
 */
export const resolveInitialThemeMode = (): ThemeMode => {
  const stored = getThemeModeLS();

  if (stored !== null) {
    if (THEME_MODES.has(stored)) return stored;

    warn(`Unknown theme "${stored}" in localStorage — falling back to the system one.`);
  }

  return getSystemThemeMode() ?? DEFAULT_THEME_MODE;
};
