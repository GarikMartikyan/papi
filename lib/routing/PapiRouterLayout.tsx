import { Button, Result } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router';

import { type Me, useGetMeQuery } from '../api/endpoints/me.api';
import {
  MainLayout,
  type MainLayoutProps,
  type NavItem,
} from '../components/layouts/MainLayout/MainLayout';
import { Icon } from '../components/shared/Icon';
import { SplashScreen } from '../components/shared/SplashScreen';
import type { UserMenuProps } from '../components/shared/UserMenu';
import { PAPI_MESSAGES } from '../constants/messages.constants';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { toApiError } from '../utils/apiError.util';

import type { PapiRoute } from './PapiRouter';
import { PAPI_ROUTES, type PapiLoginState } from './routes.constants';

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
 * Гард, проверка сессии и каркас — одним маршрутом-обёрткой.
 *
 * Вместе, а не по отдельности, потому что это один ответ на один вопрос: пускать
 * ли внутрь. Пускаем — рисуем каркас и подставляем страницу в `Outlet`, не
 * пускаем — уводим на вход. Разделённые, они дали бы мигание: каркас успел бы
 * отрисоваться до редиректа.
 *
 * Дверей две, и токен открывает только первую. Есть ли токен — вопрос к
 * localStorage, ответ на него мгновенный; жив ли он — знает лишь бэкенд,
 * поэтому следом уходит запрос «кто я», а каркас ждёт ответа за
 * `SplashScreen`. Спрашивается это именно на загрузке страницы: токен лежит в
 * хранилище неделями и переживает и смену пароля, и удаление пользователя, —
 * без проверки панель открывалась бы с мёртвой сессией и падала на первом же
 * запросе за данными.
 *
 * Три ответа и три исхода:
 *
 * — ответ пришёл: рисуем каркас, а имя и аватар из него уходят в шапку;
 * — 401: `baseQuery` убирает токен сам, сессия становится пустой, и следующий
 *   же рендер уводит на вход — отдельной ветки под это здесь нет;
 * — любая другая ошибка: экран с «Повторить». Токен при этом не трогаем — с ним
 *   всё может быть в порядке, а лежать может сервер, и выкидывать из-за этого на
 *   форму входа значит требовать пароль там, где хватит перезапроса.
 *
 * Адрес, с которого увели, уходит в `state` — после входа человек вернётся
 * туда, куда шёл.
 */
export const PapiRouterLayout = (props: PapiRouterLayoutProps) => {
  const { routes, user, ...rest } = props;

  const { pathname } = useLocation();
  const t = useTranslation();

  const { isAuthenticated, logout } = useAuth();

  /* Без токена спрашивать нечего: запрос ушёл бы без заголовка и вернулся бы
     401, то есть сообщил бы то, что и так известно. */
  const { data: me, error, refetch } = useGetMeQuery(undefined, { skip: !isAuthenticated });

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

  const apiError = error === undefined ? undefined : toApiError(error);

  const handleRetry = () => {
    void refetch();
  };

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PAPI_ROUTES.login}
        state={{ from: pathname } satisfies PapiLoginState}
        replace
      />
    );
  }

  /*
   * Ошибка гасит панель, только пока показывать нечего. Упавший перезапрос —
   * он приходит от панели, инвалидировавшей тег, — оставляет в кеше прошлый
   * ответ, и сворачивать открытую панель в экран ошибки из-за него неверно:
   * человек в это время работает, а устарела карточка в шапке.
   */
  if (apiError !== undefined && me === undefined) {
    return (
      <SplashScreen>
        <Result
          status="warning"
          title={t(PAPI_MESSAGES.sessionTitle)}
          /* Текст бэкенда, если он есть: он точнее любого нашего — там знают,
             что именно не так. Нет — остаётся строка ядра под статус. */
          subTitle={apiError.message ?? t(apiError.descriptor)}
          extra={[
            <Button key="retry" type="primary" onClick={handleRetry}>
              {t(PAPI_MESSAGES.sessionRetry)}
            </Button>,
            /* Выход рядом с «Повторить»: если сервер лежит не первый час,
               единственное, что тут остаётся сделать, — уйти. */
            <Button key="logout" onClick={logout}>
              {t(PAPI_MESSAGES.sessionSignOut)}
            </Button>,
          ]}
        />
      </SplashScreen>
    );
  }

  if (me === undefined) return <SplashScreen />;

  return (
    <MainLayout
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
