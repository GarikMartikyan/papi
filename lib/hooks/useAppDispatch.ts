import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../store/store';

/**
 * `useDispatch` bound to papi's dispatch, so thunks and actions stay typed.
 *
 * @returns `dispatch` стора панели: экшены слайсов ядра и слайсов панели,
 * подмешанных через `injectSlices`, проверяются по типу.
 * @example
 * ```tsx
 * const dispatch = useAppDispatch();
 *
 * dispatch(setSidebarCollapsed(true));
 * ```
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
