import { App as AntdApp } from 'antd';

import { type AsideLink, Icon, type UserMenuItem } from '@papi/components';
import { useAuth } from '@papi/hooks';
import { type PapiRoute, PapiRouter } from '@papi/routing';

import { type MessageKey, useTranslation } from './hooks';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { UsersPage } from './pages/UsersPage/UsersPage';
import { ROUTES } from './routes';

/**
 * Маршрут панели с проверкой ключа подписи.
 *
 * Ядро типизировать ключи не может — каталог принадлежит панели, — поэтому в
 * `PapiRoute` подпись объявлена обычной строкой. Здесь она сужается до ключей
 * `en.json`, и опечатка не доживает до рантайма.
 */
interface AppRoute extends PapiRoute {
  labelId?: MessageKey;
}

/**
 * Разделы панели: адрес, страница и вид в меню — одной записью.
 *
 * Раздел без `labelId` в меню не появится, но останется рабочим адресом — так
 * описываются страницы, на которые ходят по ссылке.
 */
const APP_ROUTES: AppRoute[] = [
  {
    path: ROUTES.users,
    element: <UsersPage />,
    labelId: 'nav.users',
    iconName: 'users',
    index: true,
  },
  {
    path: ROUTES.settings,
    element: <SettingsPage />,
    labelId: 'nav.settings',
    iconName: 'settings',
  },
];

interface LinkDefinition {
  href: string;
  /** Название продукта: переводить нечего, поэтому строкой, а не ключом. */
  label: string;
  iconName: string;
}

/*
 * Ссылки правой колонки — выходы наружу, каждая открывается в новой вкладке.
 *
 * Иконка обязательна не по типу, а по делу: колонка открывается свёрнутой, и в
 * свёрнутом виде от ссылки видно только её.
 */
const ASIDE_LINKS: LinkDefinition[] = [
  { href: 'https://ant.design/components/overview', label: 'Ant Design', iconName: 'book-open' },
  { href: 'https://reactrouter.com', label: 'React Router', iconName: 'route' },
  { href: 'https://redux-toolkit.js.org', label: 'Redux Toolkit', iconName: 'layers' },
];

/**
 * Панель целиком: разделы и то, что панель кладёт в каркас.
 *
 * Ни `MainLayout`, ни `<Routes>` здесь больше нет — их ставит `PapiRouter`.
 * Вместе с ними ушли вход, ненайденный адрес, редирект с корня и проверка
 * токена: всё это одинаково у всех панелей и живёт в ядре.
 *
 * Роутер тоже приезжает из ядра: `BrowserRouter` ставит `PapiProvider`, поэтому
 * в `main.tsx` его больше нет.
 */
export const App = () => {
  const t = useTranslation();

  const { message } = AntdApp.useApp();

  const { logout } = useAuth();

  const asideItems: AsideLink[] = ASIDE_LINKS.map((link) => ({
    href: link.href,
    icon: <Icon name={link.iconName} />,
    label: link.label,
  }));

  /*
   * Выход целиком в ядре: оно убирает токен и сбрасывает кеш запросов, а
   * `PapiRouter` видит пустую сессию и уводит на вход. Панели остаётся сказать
   * об этом вслух.
   *
   * Обработчик объявлен выше пунктов, а не ниже, как велит общий порядок:
   * массив пунктов ссылается на него прямо на рендере.
   */
  const handleLogout = () => {
    logout();
    message.success(t('user.loggedOut'));
  };

  /*
   * Здесь, а не константой рядом с APP_ROUTES: у пунктов есть обработчик, а он
   * живёт только внутри компонента. Видны все три вида пункта сразу — переход
   * по маршруту, разделитель и красное действие без маршрута.
   */
  const userMenuItems: UserMenuItem[] = [
    {
      key: 'settings',
      label: t('user.settings'),
      icon: <Icon name="settings" />,
      to: ROUTES.settings,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: t('user.logout'),
      icon: <Icon name="log-out" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <PapiRouter
      asideItems={asideItems}
      routes={APP_ROUTES}
      /* Одни пункты меню: имя, описание и аватар ядро берёт из `GET /me` — того
         самого запроса, которым гард проверяет сессию перед каркасом. */
      user={{ items: userMenuItems }}
    />
  );
};
