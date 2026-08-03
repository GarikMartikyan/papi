import { useSelector } from 'react-redux';

import type { RootState } from '../store/store';

/** `useSelector` bound to papi's state, so selectors need no type argument. */
export const useAppSelector = useSelector.withTypes<RootState>();
