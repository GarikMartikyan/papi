import { App as AntdApp } from 'antd';

import { type AsideLink, Icon, type UserMenuItem } from '@papi/components';
import { useAuth } from '@papi/hooks';
import { type PapiRoute, PapiRouter } from '@papi/routing';

import { ROUTES } from './constants/routes.constants';
import { useTranslation } from './hooks/useTranslation';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { UsersPage } from './pages/UsersPage/UsersPage';
import { Permission } from './types/enums/permissions.enums';

const APP_ROUTES: PapiRoute[] = [
  {
    path: ROUTES.users,
    element: <UsersPage />,
    labelId: 'users',
    iconName: 'users',
    permission: Permission.VIEW_USERS,
    index: true,
  },
  {
    path: ROUTES.settings,
    element: <SettingsPage />,
    labelId: 'settings',
    iconName: 'settings',
    permission: Permission.VIEW_SETTINGS,
  },
];

interface LinkDefinition {
  href: string;
  label: string;
  iconName: string;
}

const ASIDE_LINKS: LinkDefinition[] = [
  { href: 'https://ant.design/components/overview', label: 'Ant Design', iconName: 'book-open' },
  { href: 'https://reactrouter.com', label: 'React Router', iconName: 'route' },
  { href: 'https://redux-toolkit.js.org', label: 'Redux Toolkit', iconName: 'layers' },
];

export const App = () => {
  const t = useTranslation();

  const { message } = AntdApp.useApp();

  const { logout } = useAuth();

  const asideItems: AsideLink[] = ASIDE_LINKS.map((link) => ({
    href: link.href,
    icon: <Icon name={link.iconName} />,
    label: link.label,
  }));

  const handleLogout = () => {
    logout();
    message.success(t('signed out hint'));
  };

  const userMenuItems: UserMenuItem[] = [
    {
      key: 'settings',
      label: t('settings'),
      icon: <Icon name="settings" />,
      to: ROUTES.settings,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: t('sign out'),
      icon: <Icon name="log-out" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return <PapiRouter asideItems={asideItems} routes={APP_ROUTES} user={{ items: userMenuItems }} />;
};
