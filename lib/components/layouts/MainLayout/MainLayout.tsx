import { Layout } from 'antd';
import type { ReactNode } from 'react';

import {
  DEFAULT_SIDER_COLLAPSED_WIDTH,
  DEFAULT_SIDER_WIDTH,
} from '../../../constants/defaults.constants';
import { BLOCK_RADIUS } from '../../../constants/theme.constants';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { useThemeToken } from '../../../hooks/useThemeToken';
import { selectSidebarCollapsed, toggleSidebar } from '../../../store/slices/config.slice';
import { getOtherPanels } from '../../shared/PanelLogo';
import type { ThemeSwitcherVariant } from '../../shared/ThemeSwitcher';
import type { UserMenuProps } from '../../shared/UserMenu';

import { MainLayoutHeader } from './elements/MainLayoutHeader';
import { MainLayoutNav } from './elements/MainLayoutNav';
import { MainLayoutPanels } from './elements/MainLayoutPanels';
import { MainLayoutSider } from './elements/MainLayoutSider';

/**
 * Пункт навигации панели.
 *
 * Подпись приходит готовым узлом, а не ключом сообщения: собственного каталога
 * строк у ядра нет — языки целиком задаёт панель (см. `I18nConfig`). Панель
 * пишет `label: t('users')`.
 */
export interface NavItem {
  /**
   * Путь маршрута. Он же ключ пункта: активным считается тот, чей путь совпал с
   * адресом страницы или оказался его началом, — иначе на `/users/42` не
   * подсветился бы `/users`.
   */
  key: string;
  /** Подпись — уже переведённая. */
  label: ReactNode;
  icon?: ReactNode;
  /**
   * Вложенные пункты. Такой пункт разворачивает подменю, а не ведёт на
   * маршрут, поэтому его `key` нужен лишь для того, чтобы отличать подменю друг
   * от друга.
   */
  children?: readonly NavItem[];
}

export interface MainLayoutProps {
  /** Контент страницы — обычно `<Routes>` панели. */
  children: ReactNode;
  /**
   * Ширина правой колонки. Одна на все состояния: колонка не открывается — это
   * столбик знаков соседних панелей, а не список, который разворачивают.
   */
  asideWidth?: number;
  /** Правая часть шапки: то, что панель добавляет к языку и теме. */
  headerExtra?: ReactNode;
  /**
   * Переключатель языка в шапке. Стоит по умолчанию — как и переключатель темы.
   * С одним языком в `I18nConfig` не показывается сам: выбирать не из чего.
   */
  localeSelect?: boolean;
  /**
   * Картинка в шапке вместо знака панели — тот же проп, что у `AuthLayout`
   * и `SplashScreen`, и с тем же смыслом.
   *
   * Не передан — в шапке стоит `PanelLogo`: буквы, имя и иконку он берёт из
   * `.env` сам, и панели с нарисованным логотипом проп нужен только затем,
   * чтобы поставить его вместо знака.
   *
   * Ссылкой на картинку, а не узлом: логотип стоит в трёх местах разного размера
   * (шапка, вход, экран ожидания), и высоту каждое из них задаёт себе само.
   */
  logo?: string;
  navItems?: readonly NavItem[];
  /**
   * Тема навигации: от неё зависят цвета меню и логотипа, а с ними и то, какой
   * токен фона берёт `Layout.Sider` — `light` берёт `lightSiderBg`, `dark`
   * берёт `siderBg`. Оба задаёт тема панели.
   *
   * По умолчанию `light`: под ним панель сводит фон навигации с фоном своих
   * карточек. С `dark` за читаемостью меню на этом фоне следит она же.
   *
   * Уходит и в `Layout.Sider`, и в меню сразу: antd их не связывает — у `Sider`
   * по умолчанию `dark`, у `Menu` `light`, — и заданные порознь они дают
   * светлое меню на тёмном фоне.
   *
   * Одно значение на обе колонки: это один и тот же приём, «блок на странице», и
   * разъехавшись по теме, они перестали бы читаться как пара.
   */
  siderTheme?: 'light' | 'dark';
  siderWidth?: number;
  /** Ширина навигации в свёрнутом виде. */
  siderCollapsedWidth?: number;
  /**
   * Переключатель темы в шапке. Стоит по умолчанию: он нужен каждой панели, и
   * собирать его заново в `headerExtra` пришлось бы всем. `'none'` — убрать.
   *
   * Вид по умолчанию задаёт сам `ThemeSwitcher`, а не этот проп: иначе дефолт
   * пришлось бы держать в двух местах и следить, чтобы они совпадали.
   */
  themeSwitcher?: ThemeSwitcherVariant | 'none';
  /**
   * Пользователь в шапке: аватар с выпадающим меню, крайним справа. Не передан —
   * блока нет вовсе.
   *
   * Одним объектом, а не парой пропсов «данные» и «пункты»: это пропсы
   * `UserMenu` целиком, поэтому вместе с именем, описанием и аватаром сюда
   * уходит и всё, что умеет `Dropdown` под ним, — `placement`, `trigger`,
   * `open` с `onOpenChange`, `popupRender`, свой триггер через `children`.
   * Каркасу не приходится знать про них по одному.
   *
   * Сам каркас за пользователем никуда не ходит — он рисует то, что передали.
   * Под `PapiRouter` передаёт гард: имя, описание и аватар он берёт из ответа
   * `GET /me`, а поверх кладёт этот проп, — то есть панели здесь остаются
   * пункты меню и поля, которые она хочет показать по-своему.
   */
  user?: UserMenuProps;
}

/**
 * Каркас панели.
 *
 * Шапка идёт во всю ширину поверх всего, под ней в строку — навигация, контент
 * и правая колонка:
 *
 * ```
 * ┌──────────────────────────────────────────┐
 * │ Header                                   │
 * ├────────┬─────────────────────┬───────────┤
 * │ Nav    │      Content        │   Aside   │
 * └────────┴─────────────────────┴───────────┘
 * ```
 *
 * Обе колонки — один и тот же `MainLayoutSider`, но живут по-разному. Слева
 * маршруты панели: колонка сворачивается кнопкой, двигает контент и помнит
 * положение между заходами — `config`-слайс держит его в localStorage. Справа
 * соседние панели из каталога `panelLogos`, кроме этой: узкая полоса знаков,
 * которая не открывается и не сворачивается — кнопки у неё нет.
 *
 * Не открывается, потому что открывать нечего: знак панели читается целиком и
 * в полосе, а имя к нему даёт подсказка. Полоса от этого стоит на странице
 * неподвижно, и контент рядом с ней не перекладывается.
 *
 * Панелями, а не пропом: список ядро знает само, и панели, собранные на нём,
 * ссылаются друг на друга без единой настройки в каждой.
 *
 * Всё содержимое приходит пропсами — панель импортирует только этот компонент.
 *
 * Рендерится внутри роутера панели: меню ходит по маршрутам и подсвечивает
 * активный пункт по адресу. Роутер в `PapiProvider` намеренно не входит — выбор
 * между history, hash и memory остаётся за панелью.
 *
 * Страница не скроллится вообще: высота фиксирована в `100vh`, а навигация,
 * контент и правый сайдбар прокручиваются каждый внутри себя. Поэтому `height`,
 * а не `minHeight`, — иначе внутреннему `overflow` не от чего считать.
 */
export const MainLayout = (props: MainLayoutProps) => {
  const {
    asideWidth = DEFAULT_SIDER_COLLAPSED_WIDTH,
    children,
    headerExtra,
    localeSelect = true,
    logo,
    navItems,
    siderCollapsedWidth = DEFAULT_SIDER_COLLAPSED_WIDTH,
    siderTheme = 'light',
    siderWidth = DEFAULT_SIDER_WIDTH,
    themeSwitcher,
    user,
  } = props;

  const token = useThemeToken();

  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);

  const gutter = token.paddingXS;

  /* Колонка соседей есть, только если соседи есть: панель, оказавшаяся в
     каталоге одна, полоски с пустотой не получает. */
  const panels = getOtherPanels();
  const hasAside = panels.length > 0;

  const handleSiderToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <Layout style={{ height: '100vh', background: token.colorBgContainer }}>
      <MainLayoutHeader
        extra={headerExtra}
        localeSelect={localeSelect}
        logo={logo}
        themeSwitcher={themeSwitcher}
        user={user}
      />

      <Layout hasSider style={{ overflow: 'hidden', background: token.colorBgContainer }}>
        <MainLayoutSider
          collapsed={collapsed}
          collapsedWidth={siderCollapsedWidth}
          gutter={gutter}
          side="start"
          theme={siderTheme}
          width={siderWidth}
          onToggle={handleSiderToggle}
        >
          {navItems !== undefined && <MainLayoutNav items={navItems} theme={siderTheme} />}
        </MainLayoutSider>

        <Layout.Content
          className="papi-scroll-hidden"
          style={{
            overflow: 'auto',
            borderRadius: BLOCK_RADIUS,
            marginBottom: gutter,
            marginInline: gutter,
            padding: token.paddingSM,
            background: token.colorBgLayout,
            overscrollBehavior: 'none',
          }}
        >
          {children}
        </Layout.Content>

        {hasAside && (
          /*
           * Колонка стоит одной ширины и всегда свёрнутой: кнопки у неё нет, и
           * разворачивать нечего — знаки соседей и так видны целиком.
           */
          <MainLayoutSider
            collapsed
            collapsedWidth={asideWidth}
            gutter={gutter}
            side="end"
            theme={siderTheme}
            width={asideWidth}
          >
            <MainLayoutPanels items={panels} />
          </MainLayoutSider>
        )}
      </Layout>
    </Layout>
  );
};
