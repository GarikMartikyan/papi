import { App as AntdApp } from 'antd';
import { Navigate, Route, Routes } from 'react-router';

import {
  type AsideLink,
  Icon,
  MainLayout,
  type NavItem,
  type UserMenuItem,
} from '@papi/components';
import { removeAccessTokenLS } from '@papi/services';

import { type MessageKey, useTranslation } from './hooks';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { UsersPage } from './pages/UsersPage/UsersPage';

interface NavDefinition {
  /** Совпадает с путём маршрута — по нему papi и подсвечивает активный пункт. */
  key: string;
  labelId: MessageKey;
  /** Имя иконки для `Icon`: здесь lucide, но подошло бы и antd-имя. */
  iconName: string;
}

/** Подписи переводятся на рендере, поэтому в константе лежат только их ключи. */
const NAV: NavDefinition[] = [
  { key: '/users', labelId: 'nav.users', iconName: 'users' },
  { key: '/settings', labelId: 'nav.settings', iconName: 'settings' },
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

/*
 * TODO: заглушка — имя придёт из запроса «кто я», когда в ядре появится
 * авторизация. Аватарки рядом нет намеренно: без неё видно, что papi рисует в
 * кружке инициалы («GM»).
 *
 * Имён два: короткое стоит на кнопке в шапке, полное — в карточке меню.
 */
const USER_NAME = 'Garik';
const USER_FULL_NAME = 'Garik Martikyan';

/**
 * Каркас и маршруты панели.
 *
 * Каркас целиком приходит из ядра: `MainLayout` — единственный компонент,
 * который панель импортирует из papi, и всё, что в нём видно, передано ему
 * пропсами. Своего Layout, сайдбара и меню у панели больше нет.
 *
 * Роутер стоит выше, в `main.tsx`: papi его намеренно не включает — выбор между
 * history, hash и memory остаётся за панелью. `MainLayout` при этом обязан быть
 * внутри роутера, иначе меню некуда навигировать.
 */
export const App = () => {
  const t = useTranslation();

  const { message } = AntdApp.useApp();

  const navItems: NavItem[] = NAV.map((item) => ({
    key: item.key,
    icon: <Icon name={item.iconName} />,
    label: t(item.labelId),
  }));

  const asideItems: AsideLink[] = ASIDE_LINKS.map((link) => ({
    href: link.href,
    icon: <Icon name={link.iconName} />,
    label: link.label,
  }));

  /*
   * Настоящего выхода в панели нет — выходить пока не из чего, — поэтому пункт
   * делает единственное осмысленное: убирает токен, который кладёт страница
   * настроек. Панель с авторизацией дёрнула бы здесь свой эндпоинт и ушла на
   * экран входа.
   *
   * Обработчик объявлен выше пунктов, а не ниже, как велит общий порядок:
   * массив пунктов ссылается на него прямо на рендере.
   */
  const handleLogout = () => {
    removeAccessTokenLS();
    message.success(t('user.loggedOut'));
  };

  /*
   * Здесь, а не константой рядом с NAV: у пунктов есть обработчик, а он живёт
   * только внутри компонента. Видны все три вида пункта сразу — переход по
   * маршруту, разделитель и красное действие без маршрута.
   */
  const userMenuItems: UserMenuItem[] = [
    {
      key: 'settings',
      label: t('user.settings'),
      icon: <Icon name="settings" />,
      to: '/settings',
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
    <MainLayout
      /* `headerExtra` не передаётся: язык и тему MainLayout ставит в шапку сам,
         а больше панели туда класть нечего — остаются только подписи. */
      asideItems={asideItems}
      localeSelectLabel={t('layout.changeLanguage')}
      navItems={navItems}
      themeSwitcherLabel={t('layout.toggleTheme')}
      triggerLabel={t('layout.toggleSidebar')}
      /* Аватар в шапке — одним объектом: и данные пользователя, и пункты его
         меню. `label` не передаётся намеренно — имя видно на кнопке, и
         `aria-label` поверх него подменил бы собой то, что читают с экрана. */
      user={{
        name: USER_NAME,
        fullName: USER_FULL_NAME,
        description: t('user.role'),
        items: userMenuItems,
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </MainLayout>
  );
};
