import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UsersState {
  /** Выбранная строка таблицы. */
  selectedUserId: string | null;
  /** Поисковая строка. Живёт в сторе, а не в компоненте, чтобы её видели и другие экраны. */
  search: string;
}

const initialState: UsersState = {
  selectedUserId: null,
  search: '',
};

/**
 * Слайс панели. В стор papi попадает через `injectSlices` — см. `store/store.ts`.
 *
 * Селекторы объявлены здесь же (`selectors`), чтобы после инжекта отдать их
 * наружу уже безопасными: до первого dispatch ключа `users` в состоянии нет.
 */
export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUserId(state, action: PayloadAction<string | null>) {
      state.selectedUserId = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
  },
  selectors: {
    selectSelectedUserId: (state) => state.selectedUserId,
    selectSearch: (state) => state.search,
  },
});

export const { setSelectedUserId, setSearch } = usersSlice.actions;
