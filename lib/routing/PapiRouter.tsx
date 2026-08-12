import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import type { MainLayoutProps } from '../components/layouts/MainLayout/MainLayout';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';
import type { MessageId } from '../types/types/i18n.type';

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
   *
   * `MessageId`, а не `string`: панель, объявившая свои ключи в
   * `FormatjsIntl.Message`, получает здесь их список и проверку опечаток. Не
   * объявившая — обычную строку, как было.
   */
  labelId?: MessageId;
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
  /**
   * Своя страница ненайденного адреса вместо `NotFoundPage` ядра. Рисуется
   * вместо каркаса, а не внутри, поэтому обрамление на ней своё — как и на
   * странице входа.
   */
  notFoundElement?: ReactNode;
}

/**
 * Маршруты панели, вход, 404 и каркас вокруг них.
 *
 * Панель передаёт список разделов и пропсы каркаса, а всё остальное — общее для
 * панелей — приезжает отсюда: вход и ненайденный адрес вне каркаса, гард перед
 * всем остальным, подстановка первого раздела на корень.
 *
 * Ненайденный адрес стоит рядом с входом, а не внутри каркаса: раздела, в
 * котором находится человек, тут нет, а каркас вокруг пустоты выдаёт себя за
 * незагрузившуюся страницу. Вместе с каркасом с него снимается и гард — 404
 * показывается и без сессии. Так и надо: несуществующий адрес остаётся
 * несуществующим независимо от того, кто по нему пришёл, а требовать вход, чтобы
 * сообщить об опечатке в ссылке, значит отвечать не на тот вопрос.
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
      </Route>

      {/* Последним по порядку, но не по приоритету: react-router сортирует
          маршруты по точности, и `*` проигрывает любому совпавшему. */}
      <Route path="*" element={notFoundElement ?? <NotFoundPage />} />
    </Routes>
  );
};
