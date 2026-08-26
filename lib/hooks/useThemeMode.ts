import { selectThemeMode, setThemeMode } from '../store/slices/config.slice';
import { ThemeMode } from '../types/enums/global.enum';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

/**
 * Чтение и смена темы. Запись в localStorage делает сам слайс, поэтому здесь
 * достаточно задиспатчить экшен.
 *
 * @returns `mode` — активная схема; `isDark` — она же готовым флагом для
 * ветвления в разметке; `setMode(next)` — поставить схему; `toggleMode()` —
 * перевернуть текущую.
 * @example
 * ```tsx
 * const { isDark, toggleMode } = useThemeMode();
 *
 * return <Switch checked={isDark} onChange={toggleMode} />;
 * ```
 */
export const useThemeMode = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);
  const isDark = mode === ThemeMode.DARK;

  const setMode = (next: ThemeMode) => {
    dispatch(setThemeMode(next));
  };

  const toggleMode = () => {
    setMode(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  return { mode, isDark, setMode, toggleMode };
};
