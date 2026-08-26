import { api } from '../api/api';
import {
  loggedIn,
  loggedOut,
  selectIsAuthenticated,
  selectToken,
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
 * @returns `token` — токен из стора или `null`; `isAuthenticated` — есть ли он;
 * `login(token)` — начать сессию; `logout()` — закончить.
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
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = (next: string) => {
    dispatch(loggedIn(next));
    dispatch(api.util.resetApiState());
  };

  const logout = () => {
    dispatch(loggedOut());
    dispatch(api.util.resetApiState());
  };

  return { token, isAuthenticated, login, logout };
};
