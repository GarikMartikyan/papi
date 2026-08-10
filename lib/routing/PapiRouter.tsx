import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import type { MainLayoutProps } from '../components/layouts/MainLayout/MainLayout';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';

import { PapiRouterLayout } from './PapiRouterLayout';
import { PAPI_ROUTES } from './routes.constants';

/**
 * Раздел панели: адрес, страница и то, как он выглядит в меню.
 *
 * Одной записью, а не парой «маршрут отдельно, пункт меню отдельно»: раньше
 * панель писала путь дважды, и на двадцати разделах они расходились.
 */
export interface PapiRoute {
  /** Адрес. Он же ключ пункта меню — по нему подсвечивается активный раздел. */
  path: string;
  element: ReactNode;
  /**
   * Ключ подписи в каталоге панели. Есть — раздел появляется в меню, нет —
   * остаётся адресом, на который ходят по ссылке.
   *
   * Ключ, а не готовая строка: подпись переводится на рендере, а список
   * маршрутов панель обычно держит константой вне компонента.
   */
  labelId?: string;
  /** Имя иконки для `Icon`: подойдёт и lucide, и antd. */
  iconName?: string;
  /**
   * Первый раздел панели: на него уходит корень. Не отмечен ни один — берётся
   * первый в списке.
   */
  index?: boolean;
}

export interface PapiRouterProps extends Omit<MainLayoutProps, 'children' | 'navItems'> {
  routes: readonly PapiRoute[];
  /** Своя страница входа вместо `LoginPage` ядра. */
  loginElement?: ReactNode;
  /** Своя страница ненайденного адреса вместо `NotFoundPage` ядра. */
  notFoundElement?: ReactNode;
}

/**
 * Маршруты панели, вход, 404 и каркас вокруг них.
 *
 * Панель передаёт список разделов и пропсы каркаса, а всё остальное — общее для
 * панелей — приезжает отсюда: `/login` вне каркаса, гард перед всем остальным,
 * подстановка первого раздела на корень и ненайденный адрес в конце.
 *
 * Гард проверяет не только наличие токена: перед каркасом он спрашивает у
 * бэкенда `GET /me` и ждёт ответа — см. `PapiRouterLayout`. Оттуда же в шапку
 * приходят имя и аватар, поэтому в пропе `user` панели остаются пункты меню.
 *
 * Здесь `Routes`, а не `Router`: сам `BrowserRouter` ставит `PapiProvider`, и
 * второй роутер вокруг этих маршрутов был бы вложенным в первый.
 */
export const PapiRouter = (props: PapiRouterProps) => {
  const { routes, loginElement, notFoundElement, ...rest } = props;

  const indexRoute = routes.find((route) => route.index) ?? routes[0];

  return (
    <Routes>
      <Route path={PAPI_ROUTES.login} element={loginElement ?? <LoginPage />} />

      <Route element={<PapiRouterLayout routes={routes} {...rest} />}>
        {/* Разделов нет вовсе — редиректа с корня тоже: он вёл бы сам на себя. */}
        {indexRoute !== undefined && (
          <Route path={PAPI_ROUTES.home} element={<Navigate to={indexRoute.path} replace />} />
        )}

        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        <Route path="*" element={notFoundElement ?? <NotFoundPage />} />
      </Route>
    </Routes>
  );
};
