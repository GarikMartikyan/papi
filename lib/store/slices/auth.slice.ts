import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  getAccessTokenLS,
  removeAccessTokenLS,
  setAccessTokenLS,
} from '../../services/localStorage.service';
import type { AuthState } from '../../types/interfaces/authState.interface';

export const authInitialState: AuthState = { token: getAccessTokenLS() };

/**
 * Сессия пользователя.
 *
 * Хранилище правится прямо в редьюсерах, как и в `config`: тогда токен
 * сохраняется независимо от того, кто задиспатчил экшен, — форма входа, ответ
 * 401 из `baseQuery` или пункт «Выйти».
 *
 * Запроса к бэкенду на выходе нет намеренно: не у каждого он есть, а токен
 * убрать нужно в любом случае. Панель, которой нужен серверный выход, дёргает
 * свой эндпоинт и потом зовёт `logout`.
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    loggedIn(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setAccessTokenLS(action.payload);
    },
    loggedOut(state) {
      state.token = null;
      removeAccessTokenLS();
    },
  },
  selectors: {
    selectToken: (state) => state.token,
    /**
     * Пустая строка — то же, что её отсутствие: заголовок с ней не отправить.
     *
     * Больше ядро о токене ничего не спрашивает: годен ли он — знает только тот,
     * кто его выдал, и ответ приходит на `GET /me`. Сверяй ядро строку у себя,
     * при чужом токене оно уводило бы на вход, не отправив запроса, — а вместе с
     * запросом пропал бы и 401, которым `baseQuery` убирает токен из хранилища.
     */
    selectIsAuthenticated: (state) => state.token !== null && state.token !== '',
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;

export const { selectToken, selectIsAuthenticated } = authSlice.selectors;
