import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import type { MainLayoutProps } from '../components/layouts/MainLayout/MainLayout';
import { papiRoutes } from '../constants/routes.constants';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';
import type { MessageId } from '../types/types/i18n.type';
import type { PapiPermission } from '../types/types/permission.type';

import { PapiRouterLayout } from './PapiRouterLayout';
import { PermissionGate } from './PermissionGate';
import { RouteProtector } from './RouteProtector';

/**
 * Раздел панели: адрес, страница и то, как он выглядит в меню.
 *
 * Одной записью, а не парой «маршрут отдельно, пункт меню отдельно»: раньше
 * панель писала путь дважды, и на двадцати разделах они расходились.
 *
 * @example
 * ```tsx
 * export const routes: PapiRoute[] = [
 *   { path: '/users', element: <UsersPage />, labelId: 'users', iconName: 'Users', index: true },
 *   { path: '/settings', element: <SettingsPage />, permission: Permission.SETTINGS },
 * ];
 * ```
 */
export interface PapiRoute {
  /** Адрес. Он же ключ пункта меню — по нему подсвечивается активный раздел. */
  path: string;
  /** Страница раздела — то, что рисуется внутри каркаса. */
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
   * Право, которое раздел требует. Не указано — раздел открыт всем вошедшим.
   *
   * Не перечислением ядра: набор прав у каждой панели свой, приезжает с её
   * бэкенда и ядру неизвестен. Панель объявляет свой enum у себя, и `PapiRoute`
   * получает здесь именно его — через `Papi.Permissions`, см. `PapiPermission`.
   * Панель без объявления пишет сюда обычную строку.
   *
   * Права вошедшего ядро берёт из `GET /me`. Нет права — раздела нет в меню, а
   * по прямому адресу вместо страницы стоит `ForbiddenPage`. Прячется и то, и
   * другое: убрать только пункт значит оставить адрес открытым, а закрыть
   * только адрес — оставить в меню пункт, который всегда отвечает отказом.
   */
  permission?: PapiPermission;
  /**
   * Первый раздел панели: на него уходит корень. Не отмечен ни один — берётся
   * первый в списке. Отмеченный, но закрытый правом пропускается — корень
   * уводит на первый доступный.
   */
  index?: boolean;
}

/**
 * Пропсы `PapiRouter`.
 *
 * Всё, кроме `routes` и двух подмен, — пропсы каркаса: они уходят в `MainLayout`
 * как есть. `children` и `navItems` из них вычеркнуты: страницу подставляет
 * маршрут, а меню собирается из `routes`.
 */
export interface PapiRouterProps extends Omit<MainLayoutProps, 'children' | 'navItems'> {
  /** Разделы панели: адреса, страницы и пункты меню. Порядок — порядок в меню. */
  routes: readonly PapiRoute[];
  /**
   * Своя страница входа вместо `LoginPage` ядра.
   *
   * @defaultValue `<LoginPage />` — форма ядра на `POST /auth/login`.
   */
  loginElement?: ReactNode;
  /**
   * Своя страница ненайденного адреса вместо `NotFoundPage` ядра. Рисуется
   * вместо каркаса, а не внутри, поэтому обрамление на ней своё — как и на
   * странице входа.
   *
   * @defaultValue `<NotFoundPage />` с логотипом из `logo`. Не передан он —
   * на 404 стоит логотип ядра, а не знак панели.
   */
  notFoundElement?: ReactNode;
}

/**
 * Маршруты панели, вход, 404 и каркас вокруг них.
 *
 * Панель передаёт список разделов и пропсы каркаса, а всё остальное — общее для
 * панелей — приезжает отсюда: вход и ненайденный адрес вне каркаса, гард перед
 * всем остальным, подстановка первого доступного раздела на корень и проверка
 * прав на каждом разделе.
 *
 * Ненайденный адрес стоит рядом с входом, а не внутри каркаса: раздела, в
 * котором находится человек, тут нет, а каркас вокруг пустоты выдаёт себя за
 * незагрузившуюся страницу. Вместе с каркасом с него снимается и гард — 404
 * показывается и без сессии. Так и надо: несуществующий адрес остаётся
 * несуществующим независимо от того, кто по нему пришёл, а требовать вход, чтобы
 * сообщить об опечатке в ссылке, значит отвечать не на тот вопрос.
 *
 * Гард — `RouteProtector`, и он проверяет не только наличие токена: перед
 * каркасом он спрашивает у бэкенда `GET /me` и ждёт ответа. Оттуда же в шапку
 * приходят имя и аватар, поэтому в пропе `user` панели остаются пункты меню.
 * Каркас за ним — `PapiRouterLayout` — рисует уже только себя.
 *
 * `logo` уходит не только в каркас, но и на экраны вне его — ожидание сессии,
 * ошибку гарда, отказ и 404. Иначе панель со своим логотипом показывала бы чужой
 * ровно там, где кроме логотипа на экране ничего нет.
 *
 * Здесь `Routes`, а не `Router`: сам `BrowserRouter` ставит `PapiProvider`, и
 * второй роутер вокруг этих маршрутов был бы вложенным в первый.
 *
 * @example
 * ```tsx
 * <PapiProvider i18n={i18n}>
 *   <PapiRouter routes={routes} headerExtra={<ProjectSelect />} />
 * </PapiProvider>
 * ```
 */
export const PapiRouter = (props: PapiRouterProps) => {
  const { routes, loginElement, notFoundElement, logo, ...rest } = props;

  /* Раздел на самом корне панель объявить вправе — тогда своей ветки корню не
     нужно: она стала бы вторым маршрутом на тот же адрес, и какой из двух
     совпадёт, решал бы react-router. */
  const hasHomeRoute = routes.some((route) => route.path === papiRoutes.home);

  return (
    <Routes>
      <Route path={papiRoutes.login} element={loginElement ?? <LoginPage />} />

      <Route element={<RouteProtector routes={routes} logo={logo} />}>
        {/* До элемента корень не доходит: с него уводит сам протектор, и уводит
            на первый доступный раздел. Маршрут всё же объявлен — иначе ветка не
            совпадёт, и `/` достанется `*`, то есть странице «не найдено».
            Разделов нет вовсе — нет и его: вести с корня некуда. */}
        {routes.length > 0 && !hasHomeRoute && <Route path={papiRoutes.home} element={null} />}

        <Route element={<PapiRouterLayout routes={routes} logo={logo} {...rest} />}>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <PermissionGate permission={route.permission}>{route.element}</PermissionGate>
              }
            />
          ))}
        </Route>
      </Route>

      {/* Последним по порядку, но не по приоритету: react-router сортирует
          маршруты по точности, и `*` проигрывает любому совпавшему. */}
      <Route path="*" element={notFoundElement ?? <NotFoundPage logo={logo} />} />
    </Routes>
  );
};
