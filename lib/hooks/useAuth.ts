import { api } from '../api/api';
import { authApi } from '../api/endpoints/auth.api';
import type { AuthTokensPayload } from '../store/slices/auth.slice';
import {
  loggedIn,
  loggedOut,
  selectAccessToken,
  selectIsAuthenticated,
  selectRefreshToken,
} from '../store/slices/auth.slice';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

/**
 * Сессия пользователя: есть ли она, как начать и как закончить.
 *
 * Кеш RTK Query сбрасывается и на входе, и на выходе. На выходе — очевидно: за
 * одним браузером сидят разные люди, и второй не должен увидеть данные первого,
 * пока страница не перезапросит их. На входе — потому что до входа в кеше уже
 * могли осесть ответы, полученные без токена или с чужим.
 *
 * Продление сессии сюда не входит: оно случается само, внутри `baseQuery`, и
 * кеш не трогает — иначе списки очищались бы под руками каждые несколько минут.
 *
 * @returns `accessToken` и `refreshToken` из стора или `null`;
 * `isAuthenticated` — жива ли сессия; `login(tokens)` — начать её;
 * `logout()` — закончить.
 * @example
 * ```tsx
 * const { isAuthenticated, logout } = useAuth();
 *
 * if (!isAuthenticated) return <Navigate to={papiRoutes.login} />;
 *
 * return <Button onClick={logout}>Выйти</Button>;
 * ```
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = (tokens: AuthTokensPayload) => {
    dispatch(loggedIn(tokens));
    dispatch(api.util.resetApiState());
  };

  const logout = () => {
    const hasSession = refreshToken !== null && refreshToken !== '';

    /*
     * Бэкенду говорим, но ответа не ждём: он отзовёт всю семью токенов этой
     * сессии, и без этого украденный refresh пережил бы выход. Уйти же человек
     * должен немедленно и при лежащей сети, поэтому `loggedOut` идёт следом
     * безусловно, а не в `then`.
     *
     * Кеш сбрасывается ПОСЛЕ ответа, а не сразу: `resetApiState` прерывает всё
     * идущее, и сброс на месте оборвал бы этот самый запрос — то есть отзыва
     * на бэкенде не случилось бы. Между выходом и сбросом чужих данных никто не
     * увидит: сессии уже нет, и `PapiRouter` держит человека на экране входа. А
     * вход, если он случится раньше ответа, сбросит кеш сам.
     */
    if (hasSession) {
      void dispatch(authApi.endpoints.logout.initiate({ refreshToken })).finally(() => {
        dispatch(api.util.resetApiState());
      });
    }

    dispatch(loggedOut());

    if (!hasSession) dispatch(api.util.resetApiState());
  };

  return { accessToken, refreshToken, isAuthenticated, login, logout };
};
