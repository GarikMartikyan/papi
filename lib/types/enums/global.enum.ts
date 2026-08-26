/**
 * Цветовая схема панели.
 *
 * Языка здесь намеренно нет: набор языков задаёт панель, поэтому это `Locale`
 * (см. `types/types/i18n.type`), а не закрытый enum. Тема — закрытый набор.
 *
 * @example
 * ```tsx
 * const { mode, setMode } = useThemeMode();
 *
 * setMode(mode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK);
 * ```
 */
export enum ThemeMode {
  /** Светлая схема. С неё панель и начинает — см. `DEFAULT_THEME_MODE`. */
  LIGHT = 'light',
  /** Тёмная схема. */
  DARK = 'dark',
}
