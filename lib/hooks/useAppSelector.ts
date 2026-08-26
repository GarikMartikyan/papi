import { useSelector } from 'react-redux';

import type { RootState } from '../store/store';

/**
 * `useSelector` bound to papi's state, so selectors need no type argument.
 *
 * @returns Значение, которое вернул селектор; перерисовка — по изменению этого
 * значения, как у обычного `useSelector`.
 * @example
 * ```tsx
 * const locale = useAppSelector(selectLocale);
 * ```
 */
export const useAppSelector = useSelector.withTypes<RootState>();
