import { useGetMeQuery } from '../api/endpoints/me.api';
import type { PapiPermission } from '../types/types/permission.type';

import { useAuth } from './useAuth';

/**
 * Права вошедшего и проверка одного права.
 *
 * Своего запроса хук не делает: права приезжают в `GET /me` — том самом ответе,
 * которым гард подтверждает сессию, — и здесь он берётся из кеша RTK Query,
 * уже наполненного `PapiRouterLayout`.
 *
 * Нет списка в ответе — открыто всё. Бэкенд, который про права ничего не знает,
 * не должен получить панель с пустым меню: отсутствие списка означает «правами
 * тут не управляют», а не «прав нет ни на что». Пустой список означает как раз
 * второе.
 *
 * «Списка нет» и «ответ ещё не пришёл» при этом разведены. Ответа нет — закрыто:
 * внутри `PapiRouter` до этого не доходит, там ответа дожидается гард, но
 * `PermissionGate` панель ставит и сама — вокруг кнопки удаления, колонки,
 * секции, — и там ждать некому. Открыться на время загрузки значит показать
 * закрытое правом на секунду каждому, а после `logout` (там
 * `api.util.resetApiState()`) и на своей странице входа — не на секунду.
 */
export const usePermissions = () => {
  const { isAuthenticated } = useAuth();

  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const permissions = me?.permissions;

  const hasPermission = (permission?: PapiPermission) => {
    /* Право не указано — оно и не требуется: содержимое без права открыто всем,
       и ответа про вошедшего для этого ждать незачем. */
    if (permission === undefined) return true;

    if (me === undefined) return false;

    return permissions === undefined || permissions.includes(permission);
  };

  return { permissions, hasPermission };
};
