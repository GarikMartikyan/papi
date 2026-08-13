import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UsersState {
  selectedUserId: string | null;
  search: string;
}

const initialState: UsersState = {
  selectedUserId: null,
  search: '',
};

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
