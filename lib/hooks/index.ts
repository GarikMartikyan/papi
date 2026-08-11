/**
 * Hooks — typed store hooks, auth/permission access, UI state helpers.
 *
 * `useTranslation` наружу выходит generic-ом: панель подставляет в него ключи
 * своего каталога. Строки ядра сужает `usePapiTranslation` — он рядом, но в
 * барель не входит: панели её ключи он не проверит, а чужие запретит.
 */

export * from './useAppDispatch';
export * from './useAppSelector';
export * from './useAuth';
export * from './useLocale';
export * from './useThemeMode';
export * from './useToken';
export * from './useTranslation';
