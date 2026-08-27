import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  getAccessTokenLS,
  getRefreshTokenLS,
  removeAccessTokenLS,
  removeRefreshTokenLS,
  setAccessTokenLS,
  setRefreshTokenLS,
} from '../../services/localStorage.service';
import type { AuthState } from '../../types/interfaces/authState.interface';

/** Пара токенов, которой отвечают и вход, и ротация. */
export interface AuthTokensPayload {
  accessToken: string;
  refreshToken: string;
}

/**
 * Начальное состояние сессии: токены сразу берутся из localStorage, поэтому
 * перезагрузка страницы вошедшего не выкидывает.
 */
export const authInitialState: AuthState = {
  accessToken: getAccessTokenLS(),
  refreshToken: getRefreshTokenLS(),
};

/** Записать пару в состояние и в хранилище — общее тело `loggedIn` и `tokensRotated`. */
const applyTokens = (state: AuthState, tokens: AuthTokensPayload): void => {
  state.accessToken = tokens.accessToken;
  state.refreshToken = tokens.refreshToken;

  setAccessTokenLS(tokens.accessToken);
  setRefreshTokenLS(tokens.refreshToken);
};

/**
 * Сессия пользователя.
 *
 * Хранилище правится прямо в редьюсерах, как и в `config`: тогда токены
 * сохраняются независимо от того, кто задиспатчил экшен, — форма входа,
 * ротация из `baseQuery` или пункт «Выйти».
 *
 * Экшена на начало сессии два, и это не дублирование. Вход и ротация пишут одно
 * и то же, но значат разное: вход — это другой человек за той же вкладкой, и
 * кеш RTK Query после него сбрасывается (`useAuth().login`), а ротация случается
 * каждые несколько минут под руками у работающего, и сброс кеша на ней стирал бы
 * открытые списки на ровном месте. Поэтому ротация ходит своим экшеном, мимо
 * `useAuth`.
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    loggedIn(state, action: PayloadAction<AuthTokensPayload>) {
      applyTokens(state, action.payload);
    },
    tokensRotated(state, action: PayloadAction<AuthTokensPayload>) {
      applyTokens(state, action.payload);
    },
    loggedOut(state) {
      state.accessToken = null;
      state.refreshToken = null;

      removeAccessTokenLS();
      removeRefreshTokenLS();
    },
  },
  selectors: {
    selectAccessToken: (state) => state.accessToken,
    selectRefreshToken: (state) => state.refreshToken,
    /**
     * Пустая строка — то же, что её отсутствие: заголовок с ней не отправить.
     *
     * Смотрим на refresh, а не на access: access живёт минуты и к моменту
     * возврата во вкладку истёк почти всегда, а сессия при этом жива — её
     * продлит ближайший запрос. Сессия кончается тогда, когда продлевать
     * нечем.
     *
     * Больше ядро о токенах ничего не спрашивает: годны ли они — знает только
     * тот, кто их выдал. Сверяй ядро строку у себя, при чужом токене оно
     * уводило бы на вход, не отправив запроса, — а вместе с запросом пропал бы
     * и 401, которым `baseQuery` запускает ротацию.
     */
    selectIsAuthenticated: (state) => state.refreshToken !== null && state.refreshToken !== '',
  },
});

/* Экшены — одной деструктуризацией, описание каждого внутри паттерна. В
   подсказку редактора оно оттуда не попадает: JSDoc у элемента деструктуризации
   tsserver не берёт — описание читается здесь. */
export const {
  /**
   * Сессия началась: пара токенов ложится и в стор, и в localStorage.
   *
   * Панель обычно зовёт `login` из `useAuth` — он делает то же и вдобавок
   * сбрасывает кеш RTK Query, где могли осесть ответы, полученные с чужим токеном.
   *
   * @param tokens Пара, которую вернул вход.
   * @example
   * ```ts
   * dispatch(loggedIn({ accessToken, refreshToken }));
   * ```
   */
  loggedIn,
  /**
   * Сессия продлена: пара заменяется на новую, кеш при этом остаётся.
   *
   * Диспатчится только из `refreshSession` — панели он не нужен. Отдельно от
   * `loggedIn` потому, что ротация не должна сбрасывать кеш: она случается посреди
   * работы, а не вместо неё.
   *
   * @param tokens Пара, которую вернула ротация.
   */
  tokensRotated,
  /**
   * Сессия закончилась: оба токена убираются и из стора, и из localStorage.
   *
   * Диспатчится не только пунктом «Выйти»: так же его зовёт `refreshSession`,
   * когда продлить сессию не вышло. `PapiRouter` следит за стором и уводит на вход
   * сам, откуда бы экшен ни пришёл.
   */
  loggedOut,
} = authSlice.actions;

/* Селекторы — тем же паттерном, что и экшены выше. */
export const {
  /**
   * Токен доступа — тот, что уходит в заголовке.
   *
   * @returns Токен или `null`. Для проверки «вошёл ли» есть
   * `selectIsAuthenticated`: истёкший access сессию не заканчивает.
   */
  selectAccessToken,
  /**
   * Токен обновления — тот, которым продлевают сессию.
   *
   * @returns Токен или `null`.
   */
  selectRefreshToken,
  /**
   * Вошёл ли пользователь.
   *
   * Проверка только на наличие refresh-токена: годен ли он, знает лишь тот, кто
   * его выдал, и ответ приходит на первом же запросе.
   *
   * @returns `true`, если токен обновления есть и он не пустой.
   * @example
   * ```tsx
   * const isAuthenticated = useAppSelector(selectIsAuthenticated);
   * ```
   */
  selectIsAuthenticated,
} = authSlice.selectors;
