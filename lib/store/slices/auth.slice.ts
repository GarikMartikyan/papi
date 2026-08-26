import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  getAccessTokenLS,
  removeAccessTokenLS,
  setAccessTokenLS,
} from '../../services/localStorage.service';
import type { AuthState } from '../../types/interfaces/authState.interface';

/**
 * Начальное состояние сессии: токен сразу берётся из localStorage, поэтому
 * перезагрузка страницы вошедшего не выкидывает.
 */
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

/**
 * Сессия началась: токен ложится и в стор, и в localStorage.
 *
 * Панель обычно зовёт `login` из `useAuth` — он делает то же и вдобавок
 * сбрасывает кеш RTK Query, где могли осесть ответы, полученные с чужим токеном.
 *
 * @param token Токен, который вернул вход.
 * @example
 * ```ts
 * dispatch(loggedIn(token));
 * ```
 */
export const loggedIn = authSlice.actions.loggedIn;

/**
 * Сессия закончилась: токен убирается и из стора, и из localStorage.
 *
 * Диспатчится не только пунктом «Выйти»: так же на него отвечает `baseQuery`,
 * получив 401. `PapiRouter` следит за стором и уводит на вход сам, откуда бы
 * экшен ни пришёл.
 */
export const loggedOut = authSlice.actions.loggedOut;

/**
 * Токен сессии.
 *
 * @returns Токен или `null`. Для проверки «вошёл ли» есть
 * `selectIsAuthenticated` — он же отсекает пустую строку.
 */
export const selectToken = authSlice.selectors.selectToken;

/**
 * Вошёл ли пользователь.
 *
 * Проверка только на наличие токена: годен ли он, знает лишь тот, кто его выдал,
 * и ответ приходит на `GET /me`.
 *
 * @returns `true`, если токен есть и он не пустой.
 * @example
 * ```tsx
 * const isAuthenticated = useAppSelector(selectIsAuthenticated);
 * ```
 */
export const selectIsAuthenticated = authSlice.selectors.selectIsAuthenticated;
