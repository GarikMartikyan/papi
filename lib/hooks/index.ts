/**
 * Hooks — typed store hooks, auth/permission access, UI state helpers.
 *
 * `useTranslation` один на всех: строки панели он форматирует по ключу с
 * проверкой, строки ядра — по дескриптору из `PAPI_MESSAGES`, с запасным
 * текстом. Отдельного хука под ядро нет.
 */

export * from './useAppDispatch';
export * from './useAppSelector';
export * from './useAuth';
export * from './useLocale';
export * from './useThemeMode';
export * from './useToken';
export * from './useTranslation';
