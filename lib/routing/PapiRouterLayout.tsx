import { Outlet } from 'react-router';

import { useGetMeQuery } from '../api/endpoints/me.api';
import {
  MainLayout,
  type MainLayoutProps,
  type NavItem,
} from '../components/layouts/MainLayout/MainLayout';
import { Icon } from '../components/shared/Icon';
import { SplashScreen } from '../components/shared/SplashScreen';
import type { UserMenuProps } from '../components/shared/UserMenu';
import { usePapiTranslation } from '../hooks/usePapiTranslation';
import { usePermissions } from '../hooks/usePermissions';
import type { Me } from '../types/interfaces/me.interface';

import type { PapiRoute } from './PapiRouter';

/**
 * Ответ «кто я» → карточка пользователя в шапке.
 *
 * Пунктов меню здесь нет: они приходят от панели — у каждой свои разделы и своё
 * действие на выходе.
 *
 * Аватар — `AvatarProps` целиком, поэтому ссылка заворачивается в объект. Её
 * нет — нет и пропа: `UserMenu` тогда рисует инициалы, а не пустой кружок.
 */
const toUserProps = (me: Me): Omit<UserMenuProps, 'items'> => ({
  name: me.name,
  fullName: me.fullName,
  description: me.description,
  avatar: me.avatarUrl === undefined ? undefined : { src: me.avatarUrl },
});

export interface PapiRouterLayoutProps extends Omit<MainLayoutProps, 'children' | 'navItems'> {
  /** Те же маршруты, что у `PapiRouter`: из них собираются пункты меню. */
  routes: readonly PapiRoute[];
}

/**
 * Каркас панели — и только он.
 *
 * Пускать ли внутрь, решено выше, в `RouteProtector`: сюда доходит вошедший, с
 * подтверждённой сессией. Поэтому своего запроса тут нет — `useGetMeQuery`
 * попадает в уже наполненный кеш и отдаёт тот же ответ, из которого собирается
 * карточка в шапке.
 */
export const PapiRouterLayout = (props: PapiRouterLayoutProps) => {
  const { routes, user, logo, ...rest } = props;

  const t = usePapiTranslation();

  const { hasPermission } = usePermissions();

  const { data: me } = useGetMeQuery();

  /*
   * Пункт меню появляется у маршрута с подписью. Без неё маршрут остаётся
   * рабочим адресом, но в навигацию не попадает — так описываются страницы,
   * на которые ходят по ссылке: карточка записи, экран печати.
   *
   * Второе условие — право: закрытый раздел из меню исчезает целиком, а не
   * гаснет заблокированным пунктом. Заблокированный пункт сообщал бы, что у
   * панели есть раздел, к которому этого человека не пускают, — знание, ради
   * которого его никто не спрашивал. Сам адрес при этом закрыт отдельно, в
   * `PermissionGate`: пункт в меню — не единственный путь на страницу.
   */
  const navItems: NavItem[] = routes.flatMap((route) =>
    route.labelId === undefined || !hasPermission(route.permission)
      ? []
      : [
          {
            key: route.path,
            /* Дескриптором, а не строкой: `t` здесь сужен до ключей ядра, а
               подпись приехала из каталога панели — их ядро не знает. */
            label: t({ id: route.labelId }),
            icon: route.iconName === undefined ? undefined : <Icon name={route.iconName} />,
          },
        ],
  );

  /* До каркаса ответ уже получен — ветка нужна одному TypeScript: кеш он
     типизирует как «данные или ничего», ничего не зная о протекторе. */
  if (me === undefined) return <SplashScreen logo={logo} />;

  return (
    <MainLayout
      logo={logo}
      navItems={navItems}
      /* Данные из ответа, а поверх них — то, что передала панель: у неё может
         быть свой профиль, побогаче общего `/me`. Пункты меню приходят только
         оттуда, поэтому без пропа `user` карточки в шапке нет вовсе. */
      user={user === undefined ? undefined : { ...toUserProps(me), ...user }}
      {...rest}
    >
      <Outlet />
    </MainLayout>
  );
};
