import { useDispatch } from 'react-redux';

import type { AppDispatch } from '@papi/store';

/** Dispatch берётся у ядра: стор один, и панель его не подменяет. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
