import { useSelector } from 'react-redux';

import type { AppState } from '../store/store';

/**
 * `useSelector`, привязанный к состоянию панели.
 *
 * Хук ядра типизирован своим состоянием и про слайсы панели не знает — поэтому
 * панель делает себе свой. Селекторы ядра (`selectThemeMode`, `selectLocale`)
 * работают и здесь: `AppState` включает состояние ядра.
 */
export const useAppSelector = useSelector.withTypes<AppState>();
