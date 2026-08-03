import { App as AntdApp } from 'antd';
import { Navigate, Route, Routes } from 'react-router';

import { Icon, MainLayout, type NavItem, type UserMenuItem } from '@papi/components';
import { removeAccessTokenLS } from '@papi/services';

import { type MessageKey, useTranslation } from './hooks';
import { HomePage } from './pages/HomePage/HomePage';

interface NavDefinition {
  /** Совпадает с путём маршрута — по нему ядро и подсвечивает активный пункт. */
  key: string;
  labelId: MessageKey;
  /** Имя иконки для `Icon`: здесь lucide, но подошло бы и antd-имя. */
  iconName: string;
}

/*
 * TODO: заглушка — один раздел, чтобы каркас было видно запущенным. Панель
 * заменяет список своим и заводит под каждый пункт страницу и маршрут ниже.
 *
 * Подписи переводятся на рендере, поэтому в константе лежат только их ключи.
 */
const NAV: NavDefinition[] = [{ key: '/home', labelId: 'nav.home', iconName: 'house' }];

/*
 * TODO: заглушка — имя придёт из запроса «кто я», когда в ядре появится
 * авторизация. Аватарки рядом нет намеренно: без неё видно, что ядро рисует в
 * кружке инициалы.
 *
 * Имён два: короткое стоит на кнопке в шапке, полное — в карточке меню.
 */
const USER_NAME = 'Admin';
const USER_FULL_NAME = 'Panel Admin';

/**
 * Каркас и маршруты панели.
 *
 * Каркас целиком приходит из ядра: `MainLayout` — единственный компонент,
 * который панель импортирует ради вида, и всё, что в нём видно, передано ему
 * пропсами. Своего Layout, сайдбара и меню у панели нет.
 *
 * Роутер стоит выше, в `main.tsx`: ядро его намеренно не включает — выбор между
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

  /*
   * TODO: заглушка — настоящего выхода в скелете нет, выходить не из чего.
   * Пункт делает единственное осмысленное: убирает токен. Панель с авторизацией
   * дёрнула бы здесь свой эндпоинт и ушла на экран входа.
   *
   * Обработчик объявлен выше пунктов, а не ниже, как велит общий порядок:
   * массив пунктов ссылается на него прямо на рендере.
   */
  const handleLogout = () => {
    removeAccessTokenLS();
    message.success(t('user.loggedOut'));
  };

  const userMenuItems: UserMenuItem[] = [
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
      /* `asideItems` и `headerExtra` не передаются: колонки ссылок наружу у
         скелета нет, а язык и тему `MainLayout` ставит в шапку сам. */
      localeSelectLabel={t('layout.changeLanguage')}
      navItems={navItems}
      themeSwitcherLabel={t('layout.toggleTheme')}
      triggerLabel={t('layout.toggleSidebar')}
      user={{
        name: USER_NAME,
        fullName: USER_FULL_NAME,
        description: t('user.role'),
        items: userMenuItems,
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </MainLayout>
  );
};
