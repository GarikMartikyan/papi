import { ConfigProvider, Menu, type MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router';

import { useThemeToken } from '../../../../hooks/useThemeToken';
import type { NavItem } from '../MainLayout';

type MenuItem = NonNullable<MenuProps['items']>[number];

interface NavMatch {
  key: string;
  openKeys: string[];
}

/**
 * `NavItem` → элемент меню antd. Ветка и лист собираются разными ветвями: у
 * antd это разные типы, и `children: undefined` у листа не проходит проверку.
 */
const toMenuItem = (item: NavItem): MenuItem => {
  const { children, icon, key, label } = item;

  if (children === undefined) return { key, icon, label };

  return { key, icon, label, children: children.map(toMenuItem) };
};

/**
 * `/users` подходит и самому `/users`, и `/users/42`, но не `/users-archive`:
 * граница считается по сегменту пути, а не по символу, — иначе соседний
 * маршрут с общим началом подсвечивал бы чужой пункт.
 */
const matchesPathname = (key: string, pathname: string): boolean => {
  if (pathname === key) return true;

  return pathname.startsWith(key.endsWith('/') ? key : `${key}/`);
};

const collectMatches = (
  items: readonly NavItem[],
  pathname: string,
  ancestors: string[],
): NavMatch[] => {
  const matches: NavMatch[] = [];

  for (const item of items) {
    if (matchesPathname(item.key, pathname)) {
      matches.push({ key: item.key, openKeys: ancestors });
    }

    if (item.children !== undefined) {
      matches.push(...collectMatches(item.children, pathname, [...ancestors, item.key]));
    }
  }

  return matches;
};

/**
 * Какой пункт подсветить на текущем адресе и какие ветки ради него раскрыть.
 *
 * Из подошедших выигрывает самый длинный путь — он же самый конкретный: на
 * `/users/roles/42` подходят и `/users`, и `/users/roles`, а подсветить нужно
 * второй.
 */
const resolveActiveNav = (items: readonly NavItem[], pathname: string): NavMatch | null => {
  let best: NavMatch | null = null;

  for (const match of collectMatches(items, pathname, [])) {
    if (best === null || match.key.length > best.key.length) best = match;
  }

  return best;
};

export interface MainLayoutNavProps {
  items: readonly NavItem[];
  theme?: MenuProps['theme'];
}

/**
 * Меню левого сайдбара.
 *
 * Единственное место, где ядро зависит от роутера: `MainLayout` про него не
 * знает, поэтому панель без навигации может использовать каркас и вне роутера.
 *
 * `inlineCollapsed` не передаётся: свёрнутость меню читает из контекста
 * `Layout.Sider` само.
 */
export const MainLayoutNav = (props: MainLayoutNavProps) => {
  const { items, theme } = props;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const token = useThemeToken();

  const active = resolveActiveNav(items, pathname);

  const handleSelect: NonNullable<MenuProps['onSelect']> = (info) => {
    void navigate(info.key);
  };

  /*
   * Активный пункт заливается основным цветом целиком.
   *
   * Свой `itemSelectedBg` antd берёт из `colorPrimaryBg` — самого светлого
   * оттенка основного цвета. Он рассчитан на белый фон, а навигация лежит на
   * сером `colorBgLayout`: на нём эта заливка даёт контраст 1.03 и не читается
   * вовсе — от подсветки остаётся один цвет текста.
   *
   * Через `ConfigProvider`, а не через `Menu` в `BASE_THEME`: там тема — статичный
   * объект, и `colorPrimary` пришлось бы вписать значением. Панель, задавшая свой
   * основной цвет, получила бы навигацию, подсвеченную чужим. Здесь же цвет
   * приходит из уже собранной темы — то есть тот самый, который панель и выбрала.
   *
   * Тёмная навигация сюда не попадает: под `theme="dark"` у меню свои токены, и
   * заливка активного пункта там и так основной цвет.
   */
  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemSelectedBg: token.colorPrimary,
            itemSelectedColor: token.colorTextLightSolid,
          },
        },
      }}
    >
      <Menu
        /*
         * `defaultOpenKeys`, а не `openKeys`: ветку активного пункта достаточно
         * раскрыть на входе, дальше подменю принадлежат пользователю. С
         * контролируемым списком пришлось бы возвращать ему открытым то, что он
         * только что закрыл.
         */
        defaultOpenKeys={active?.openKeys}
        items={items.map(toMenuItem)}
        mode="inline"
        selectedKeys={active === null ? [] : [active.key]}
        /*
         * Прозрачный фон: свой у меню белый, и он лёг бы плашкой поверх фона
         * навигации, оборвавшись на последнем пункте.
         *
         * Правая граница снята: у `mode="inline"` она отделяет меню от контента,
         * но здесь между ними и так есть отступ, и черта повисает сама по себе.
         */
        style={{ background: 'transparent', borderInlineEnd: 'none' }}
        theme={theme}
        onSelect={handleSelect}
      />
    </ConfigProvider>
  );
};
