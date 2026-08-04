import { type FocusEvent, type ReactNode, useState } from 'react';

import { Layout } from 'antd';

import {
  DEFAULT_ASIDE_WIDTH,
  DEFAULT_SIDER_COLLAPSED_WIDTH,
  DEFAULT_SIDER_WIDTH,
} from '../../../constants/defaults.constants';
import { BLOCK_RADIUS } from '../../../constants/theme.constants';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { useToken } from '../../../hooks/useToken';
import { selectSidebarCollapsed, toggleSidebar } from '../../../store/slices/config.slice';
import type { ThemeSwitcherVariant } from '../../shared/ThemeSwitcher';
import type { UserMenuProps } from '../../shared/UserMenu';

import { MainLayoutHeader } from './elements/MainLayoutHeader';
import { MainLayoutLinks } from './elements/MainLayoutLinks';
import { MainLayoutNav } from './elements/MainLayoutNav';
import { MainLayoutSider } from './elements/MainLayoutSider';

/**
 * Правая колонка лежит выше контента: открытая она его перекрывает.
 *
 * Единица, а не значение из темы: соседей в этом слое у неё нет — всплывающее
 * antd живёт на порядок выше (`zIndexPopupBase` — 1000), и спорить с ним колонка
 * не должна.
 */
const ASIDE_Z_INDEX = 1;

/**
 * Насколько долго правая колонка выезжает и уезжает.
 *
 * Дольше дефолтных antd `motionDurationMid` (0.2s): та скорость рассчитана на
 * колонку, которая раздвигает страницу, а эта идёт поверх контента — на быстром
 * движении она читается скачком, а не выездом.
 *
 * `background 0s` повторяет antd: фон колонки меняется вместе с темой панели, и
 * тянуть его означало бы задержку при переключении.
 */
const ASIDE_TRANSITION = 'all 0.40s, background 0s';

/**
 * Тень открытой правой колонки — только влево, на контент.
 *
 * Вправо тени нет: там край окна, отделять колонку не от чего. Поэтому оба слоя
 * смещены влево, и смещение у размытого больше его радиуса — остаток тени
 * уходит под саму колонку, а не вылезает из-под её правого края.
 *
 * Не `boxShadowSecondary` из темы: он чёрный, а в тёмной теме и колонка, и
 * контент под ней стоят на `colorBgLayout` — чистом чёрном. Чёрное на чёрном не
 * читается, поэтому там колонку отделяет светлая линия по краю и такое же
 * светлое свечение, а не затемнение.
 *
 * `light-dark()`, как у `BLOCK_BG`: режим браузер берёт из `color-scheme` на
 * <html>, который ставит `ThemeProvider`, поэтому значение остаётся одной
 * статичной строкой. Меняются в ней только цвета — функция цветовая, на список
 * теней целиком её не натянуть.
 */
const ASIDE_SHADOW = [
  '-1px 0 0 0 light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.14))',
  '-24px 0 24px -6px light-dark(rgba(0, 0, 0, 0.09), rgba(255, 255, 255, 0.04))',
].join(', ');

/**
 * Пункт навигации панели.
 *
 * Подпись приходит готовым узлом, а не ключом сообщения: собственного каталога
 * строк у ядра нет — языки целиком задаёт панель (см. `I18nConfig`). Панель
 * пишет `label: t('nav.users')`.
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

/**
 * Ссылка правой колонки.
 *
 * Ведёт наружу и открывается в новой вкладке, поэтому у неё `href`, а не `key`:
 * это адрес чужого сайта, а не маршрут панели. Подсвечивать такую ссылку нечем
 * — снаружи страницы «активной» не бывает.
 */
export interface AsideLink {
  href: string;
  /** Подпись — уже переведённая, как и у `NavItem`. */
  label: ReactNode;
  /**
   * Иконка. Формально необязательна, но на деле нужна почти всегда: колонка
   * стоит закрытой, пока на неё не навели, а в закрытой от ссылки видно только
   * иконку — без неё там окажется пустая строка.
   */
  icon?: ReactNode;
}

export interface MainLayoutProps {
  /** Контент страницы — обычно `<Routes>` панели. */
  children: ReactNode;
  /**
   * Ссылки правой колонки. Не переданы или список пуст — колонки нет вовсе,
   * контент занимает всю ширину до края страницы.
   *
   * Пустой массив приравнен к отсутствию намеренно: список чаще всего
   * собирается на месте — фильтруется по правам или приходит из конфига, — и
   * пустым он оказывается сам собой. Полоска, которая на наведение открывает
   * пустоту, была бы в этом случае мусором на странице.
   *
   * В отличие от `navItems`, это выходы наружу: каждая ссылка открывается в
   * новой вкладке, панель под ней остаётся на месте. Маршрутам панели тут не
   * место — для них левая колонка.
   */
  asideItems?: readonly AsideLink[];
  /** Ширина открытой правой колонки. Открытая лежит поверх контента. */
  asideWidth?: number;
  /**
   * Ширина полоски, которой правая колонка стоит на странице закрытой. Место в
   * разметке занимает только она: открывается колонка поверх контента.
   */
  asideCollapsedWidth?: number;
  /** Правая часть шапки: то, что панель добавляет к языку и теме. */
  headerExtra?: ReactNode;
  /**
   * Переключатель языка в шапке. Стоит по умолчанию — как и переключатель темы.
   * С одним языком в `I18nConfig` не показывается сам: выбирать не из чего.
   */
  localeSelect?: boolean;
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
   * Ядро эти данные нигде не хранит: ни слайса, ни запроса под пользователя у
   * него нет — панель передаёт то, что получила сама.
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
 * Обе колонки — один и тот же `MainLayoutSider`, но живут они по-разному. Слева
 * маршруты панели: колонка сворачивается кнопкой, двигает контент и помнит
 * положение между заходами — `config`-слайс держит его в localStorage. Справа
 * ссылки наружу: там нет кнопки, колонка открывается наведением поверх контента
 * и закрывается, как только курсор ушёл.
 *
 * Наведение, а не кнопка, потому что ссылки уводят с панели: колонка нужна
 * открытой ровно на то время, пока в неё целятся. Поверх контента — по той же
 * причине: страница не должна перекладываться от движения мыши мимо края.
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
    asideCollapsedWidth = DEFAULT_SIDER_COLLAPSED_WIDTH,
    asideItems,
    asideWidth = DEFAULT_ASIDE_WIDTH,
    children,
    headerExtra,
    localeSelect = true,
    navItems,
    siderCollapsedWidth = DEFAULT_SIDER_COLLAPSED_WIDTH,
    siderTheme = 'light',
    siderWidth = DEFAULT_SIDER_WIDTH,
    themeSwitcher,
    user,
  } = props;

  const token = useToken();

  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);

  /*
   * Открытость правой колонки — только состояние наведения, поэтому и стейт
   * локальный: сохранять тут нечего, закрытой она оказывается сама.
   */
  const [asideOpen, setAsideOpen] = useState(false);

  const gutter = token.paddingXS;

  const hasAside = asideItems !== undefined && asideItems.length > 0;

  /* Полоска закрытой колонки плюс просветы по её бокам — их даёт `marginInline`
     самой колонки, поэтому место под них держит обёртка, а не колонка. */
  const asideRailWidth = asideCollapsedWidth + gutter;

  const handleSiderToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleAsideOpen = () => {
    setAsideOpen(true);
  };

  const handleAsideClose = () => {
    setAsideOpen(false);
  };

  /*
   * Клавиатурой колонка тоже открывается: ссылки в ней фокусируются, а в
   * закрытой от них видны одни иконки. `relatedTarget` — куда фокус уходит:
   * внутри колонки он просто переходит с ссылки на ссылку, и закрывать её тогда
   * нельзя, иначе на каждом Tab она мигала бы.
   */
  const handleAsideBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    setAsideOpen(false);
  };

  return (
    <Layout style={{ height: '100vh', background: token.colorBgContainer }}>
      <MainLayoutHeader
        extra={headerExtra}
        localeSelect={localeSelect}
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
           * Колонка вынута из потока, а место под закрытую держит эта обёртка:
           * открывайся колонка в потоке, страница перекладывалась бы от каждого
           * движения мыши у правого края.
           */
          <div style={{ position: 'relative', flex: `0 0 ${asideRailWidth}px` }}>
            <MainLayoutSider
              collapsed={!asideOpen}
              collapsedWidth={asideCollapsedWidth}
              gutter={gutter}
              side="end"
              style={{
                position: 'absolute',
                insetBlock: 0,
                right: 0,
                zIndex: ASIDE_Z_INDEX,
                transition: ASIDE_TRANSITION,
                boxShadow: asideOpen ? ASIDE_SHADOW : undefined,
              }}
              theme={siderTheme}
              width={asideWidth}
              onBlur={handleAsideBlur}
              onFocus={handleAsideOpen}
              onMouseEnter={handleAsideOpen}
              onMouseLeave={handleAsideClose}
            >
              <MainLayoutLinks items={asideItems} theme={siderTheme} />
            </MainLayoutSider>
          </div>
        )}
      </Layout>
    </Layout>
  );
};
