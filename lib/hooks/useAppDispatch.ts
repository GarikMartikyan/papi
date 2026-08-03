import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../store/store';

/** `useDispatch` bound to papi's dispatch, so thunks and actions stay typed. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
