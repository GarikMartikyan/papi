import { App as AntdApp } from 'antd';

import { Icon, type UserMenuItem } from '@papi/components';
import { useAuth } from '@papi/hooks';
import { type PapiRoute, PapiRouter } from '@papi/routing';

import { ROUTES } from './constants/routes.constants';
import { useTranslation } from './hooks/useTranslation';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { Permission } from './types/enums/permissions.enums';

const APP_ROUTES: PapiRoute[] = [
  {
    path: ROUTES.settings,
    element: <SettingsPage />,
    labelId: 'settings',
    iconName: 'settings',
    permission: Permission.VIEW_SETTINGS,
    index: true,
  },
];

export const App = () => {
  const t = useTranslation();

  const { message } = AntdApp.useApp();

  const { logout } = useAuth();

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

  return <PapiRouter routes={APP_ROUTES} user={{ items: userMenuItems }} />;
};
