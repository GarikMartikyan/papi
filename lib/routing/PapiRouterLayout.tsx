import { Navigate, Outlet, useLocation } from 'react-router';

import {
  MainLayout,
  type MainLayoutProps,
  type NavItem,
} from '../components/layouts/MainLayout/MainLayout';
import { Icon } from '../components/shared/Icon';
import { useAppSelector } from '../hooks/useAppSelector';
import { useTranslation } from '../hooks/useTranslation';
import { selectIsAuthenticated } from '../store/slices/auth.slice';

import type { PapiRoute } from './PapiRouter';
import { PAPI_ROUTES, type PapiLoginState } from './routes.constants';

export interface PapiRouterLayoutProps extends Omit<MainLayoutProps, 'children' | 'navItems'> {
  /** Те же маршруты, что у `PapiRouter`: из них собираются пункты меню. */
  routes: readonly PapiRoute[];
}

/**
 * Гард и каркас — одним маршрутом-обёрткой.
 *
 * Вместе, а не по отдельности, потому что это один ответ на один вопрос: пускать
 * ли внутрь. Пускаем — рисуем каркас и подставляем страницу в `Outlet`, не
 * пускаем — уводим на вход. Разделённые, они дали бы мигание: каркас успел бы
 * отрисоваться до редиректа.
 *
 * Адрес, с которого увели, уходит в `state` — после входа человек вернётся
 * туда, куда шёл.
 */
export const PapiRouterLayout = (props: PapiRouterLayoutProps) => {
  const { routes, ...rest } = props;

  const { pathname } = useLocation();
  const t = useTranslation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  /*
   * Пункт меню появляется у маршрута с подписью. Без неё маршрут остаётся
   * рабочим адресом, но в навигацию не попадает — так описываются страницы,
   * на которые ходят по ссылке: карточка записи, экран печати.
   */
  const navItems: NavItem[] = routes.flatMap((route) =>
    route.labelId === undefined
      ? []
      : [
          {
            key: route.path,
            label: t(route.labelId),
            icon: route.iconName === undefined ? undefined : <Icon name={route.iconName} />,
          },
        ],
  );

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PAPI_ROUTES.login}
        state={{ from: pathname } satisfies PapiLoginState}
        replace
      />
    );
  }

  return (
    <MainLayout navItems={navItems} {...rest}>
      <Outlet />
    </MainLayout>
  );
};
