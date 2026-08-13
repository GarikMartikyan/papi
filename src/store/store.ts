import { injectSlices, type RootState, type StateOf } from '@papi/store';

import { usersSlice } from './slices/users.slice';

export const appSlices = injectSlices([usersSlice]);

export type AppState = RootState & StateOf<typeof appSlices>;

export const { selectSelectedUserId, selectSearch } = appSlices.users.selectors;
