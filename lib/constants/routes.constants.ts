/**
 * Маршруты, которые ядро заводит само.
 *
 * Панель разворачивает их в свой список, чтобы адреса лежали в одном месте:
 *
 * ```ts
 * export const ROUTES = { ...papiRoutes, users: '/users' } as const;
 * ```
 *
 * Ненайденной страницы здесь нет намеренно: `*` — не адрес, по нему нельзя
 * никуда перейти, и в списке адресов ему делать нечего.
 *
 * @example
 * ```ts
 * export const ROUTES = { ...papiRoutes, users: '/users' } as const;
 *
 * navigate(ROUTES.login);
 * ```
 */
export const papiRoutes = {
  /** Экран входа. Стоит вне каркаса и вне гарда — иначе входить было бы негде. */
  login: '/login',
  /** Корень. `PapiRouter` уводит с него на первый маршрут панели. */
  home: '/',
} as const;
