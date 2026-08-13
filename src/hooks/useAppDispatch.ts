import { useDispatch } from 'react-redux';

import type { AppDispatch } from '@papi/store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
