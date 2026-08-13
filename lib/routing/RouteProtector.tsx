import { Button, Result } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useGetMeQuery } from '../api/endpoints/me.api';
import { SplashScreen } from '../components/shared/SplashScreen';
import { papiRoutes } from '../constants/routes.constants';
import { useAuth } from '../hooks/useAuth';
import { usePapiTranslation } from '../hooks/usePapiTranslation';
import { usePermissions } from '../hooks/usePermissions';
import { ForbiddenPage } from '../pages/ForbiddenPage/ForbiddenPage';
import type { PapiLoginState } from '../types/interfaces/loginState.interface';
import { toApiError } from '../utils/apiError.util';

import type { PapiRoute } from './PapiRouter';

export interface RouteProtectorProps {
  /** Те же маршруты, что у `PapiRouter`: по ним выбирается, куда вести с корня. */
  routes: readonly PapiRoute[];
  /** Логотип панели — он же на всех экранах вне каркаса. */
  logo?: string;
}

/**
 * Пускать ли внутрь — все ответы на этот вопрос в одном месте.
 *
 * Стоит выше каркаса, потому что каждый его ответ рисуется **вместо** панели, а
 * не внутри неё: и уход на вход, и ожидание сессии, и экран «Повторить». Каркас
 * вокруг них выдавал бы себя за незагрузившуюся страницу — шапка и меню, за
 * которыми ничего нет.
 *
 * Дверей две, и токен открывает только первую. Есть ли токен — вопрос к
 * localStorage, ответ мгновенный; жив ли он — знает лишь бэкенд, поэтому следом
 * уходит `GET /me`, и до ответа панель ждёт за `SplashScreen`. Спрашивается это
 * на каждой загрузке страницы: токен лежит в хранилище неделями и переживает и
 * смену пароля, и удаление пользователя, — без проверки панель открывалась бы с
 * мёртвой сессией и падала на первом же запросе за данными.
 *
 * Три ответа и три исхода:
 *
 * — ответ пришёл: пускаем дальше, в каркас;
 * — 401: `baseQuery` убирает токен сам, сессия становится пустой, и следующий
 *   же рендер уводит на вход — отдельной ветки под это здесь нет;
 * — любая другая ошибка: экран с «Повторить». Токен при этом не трогаем — с ним
 *   всё может быть в порядке, а лежать может сервер, и выкидывать из-за этого на
 *   форму входа значит требовать пароль там, где хватит перезапроса.
 *
 * Адрес, с которого увели, уходит в `state` — после входа человек вернётся
 * туда, куда шёл.
 *
 * Здесь же корень: он уводит на первый **доступный** раздел, и потому именно
 * здесь, а не выше, — права приезжают в том же `GET /me`, и до его ответа выбор
 * был бы сделан вслепую.
 *
 * Право самого раздела проверяет `PermissionGate` вокруг его страницы: отказ на
 * закрытом разделе рисуется как раз внутри каркаса — человек в панели, и уйти
 * из закрытого раздела он должен по навигации.
 */
export const RouteProtector = (props: RouteProtectorProps) => {
  const { routes, logo } = props;

  const { pathname } = useLocation();
  const t = usePapiTranslation();

  const { isAuthenticated, logout } = useAuth();
  const { hasPermission } = usePermissions();

  /* Без токена спрашивать нечего: запрос ушёл бы без заголовка и вернулся бы
     401, то есть сообщил бы то, что и так известно. */
  const { data: me, error, refetch } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const apiError = error === undefined ? undefined : toApiError(error);

  const handleRetry = () => {
    void refetch();
  };

  if (!isAuthenticated) {
    return (
      <Navigate to={papiRoutes.login} state={{ from: pathname } satisfies PapiLoginState} replace />
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
      <SplashScreen logo={logo}>
        <Result
          status="warning"
          title={t('we could not confirm your session')}
          /* Текст бэкенда, если он есть: он точнее любого нашего — там знают,
             что именно не так. Нет — остаётся строка ядра под статус. */
          subTitle={apiError.message ?? t(apiError.descriptor)}
          extra={[
            <Button key="retry" type="primary" onClick={handleRetry}>
              {t('try again')}
            </Button>,
            /* Выход рядом с «Повторить»: если сервер лежит не первый час,
               единственное, что тут остаётся сделать, — уйти. */
            <Button key="logout" onClick={logout}>
              {t('sign out')}
            </Button>,
          ]}
        />
      </SplashScreen>
    );
  }

  if (me === undefined) return <SplashScreen logo={logo} />;

  if (pathname === papiRoutes.home) {
    const allowed = routes.filter((route) => hasPermission(route.permission));
    const target = allowed.find((route) => route.index) ?? allowed[0];

    /*
     * Доступного раздела нет ни одного — отказ, и без каркаса: меню, в котором
     * нечего показать, ничем бы человеку не помогло.
     *
     * Кнопка здесь своя, вместо «Вернуться в панель»: та ведёт на корень, то
     * есть на этот же экран, — единственное, что человеку остаётся, это выйти и
     * войти кем-то другим. Ровно тот же выход, что на экране выше, и по той же
     * причине: экран без выхода запирает в панели до очистки хранилища.
     */
    if (target === undefined) {
      return (
        <SplashScreen logo={logo}>
          <ForbiddenPage
            subTitle={t('there is no section here you can open')}
            extra={
              <Button type="primary" onClick={logout}>
                {t('sign out')}
              </Button>
            }
          />
        </SplashScreen>
      );
    }

    /*
     * Уводим, только если есть куда: панель вправе объявить раздел прямо на
     * корне, и тогда цель — текущий адрес. `Navigate` на него зациклил бы
     * редирект вместо того, чтобы показать страницу, — она уже здесь, и её
     * рисует `Outlet` ниже.
     */
    if (target.path !== pathname) return <Navigate to={target.path} replace />;
  }

  return <Outlet />;
};
