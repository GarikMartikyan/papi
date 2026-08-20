import { Layout, Space } from 'antd';
import type { ReactNode } from 'react';

import { useThemeToken } from '../../../../hooks/useThemeToken';
import { LocaleSelect } from '../../../shared/LocaleSelect';
import { PanelLogo } from '../../../shared/PanelLogo';
import { ThemeSwitcher, type ThemeSwitcherVariant } from '../../../shared/ThemeSwitcher';
import { UserMenu, type UserMenuProps } from '../../../shared/UserMenu';

/**
 * Высота логотипа — что знака панели, что картинки панели вместо него. Ширину
 * оба считают от неё сами: у знака она набегает из букв, у картинки — из её
 * пропорций (у логотипа ядра 124:49).
 *
 * Выше не стоит: шапка antd — 64px, и логотип упрётся в её края; 40 оставляет
 * по 12 сверху и снизу — то же поле, что и у `Space` справа.
 */
const LOGO_HEIGHT = 40;

export interface MainLayoutHeaderProps {
  extra?: ReactNode;
  localeSelect: boolean;
  /** Своя картинка панели. Не передана — знак панели из `.env`. */
  logo?: string;
  /** `undefined` пропускается насквозь: вид по умолчанию решает `ThemeSwitcher`. */
  themeSwitcher?: ThemeSwitcherVariant | 'none';
  /** Не передан — аватара в шапке нет вовсе. */
  user?: UserMenuProps;
}

/**
 * Шапка каркаса: логотип слева, справа — то, что панель положила в `extra`,
 * язык, тема и пользователь.
 *
 * Логотип слева — знак панели: `PanelLogo` без пропсов берёт буквы, имя и
 * иконку по `VITE_APP_ABBR`, поэтому шапка своя у каждой панели без единой
 * настройки. Картинка вместо него ставится пропом `logo`.
 *
 * Кнопка сворачивания сюда не входит: она живёт в самой навигации, рядом с тем,
 * что сворачивает.
 */
export const MainLayoutHeader = (props: MainLayoutHeaderProps) => {
  const { extra, localeSelect, logo, themeSwitcher, user } = props;

  const token = useThemeToken();

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: token.margin,
        paddingInline: token.padding,
        /*
         * Прозрачный фон, без линии и тени: шапка ложится на фон страницы и
         * читается как её часть, а не как отдельная плашка. Граница ей не нужна
         * — её задаёт отступ навигации снизу.
         *
         * Задано явно, потому что у `Layout.Header` есть собственный тёмный фон
         * по умолчанию (`colorBgHeader`), и без этого он бы и остался.
         */
        background: 'transparent',
      }}
    >
      {/* `large` — с именем панели: шапка её единственное место на экране.

          alt у картинки пустой намеренно: логотип декоративный, а своих строк
          ядро не возит — подпись на чужом языке была бы хуже её отсутствия. */}
      {logo === undefined ? (
        <PanelLogo size="large" height={LOGO_HEIGHT} />
      ) : (
        <img src={logo} alt="" height={LOGO_HEIGHT} style={{ display: 'block' }} />
      )}

      {/* Язык, тема и пользователь — после `extra`: они есть у каждой панели,
          поэтому держатся на постоянном месте, а не переезжают вслед за её
          содержимым. Аватар при этом крайний: там его ищут в любой админке. */}
      <Space size="middle">
        {extra}
        {themeSwitcher !== 'none' && <ThemeSwitcher variant={themeSwitcher} />}
        {localeSelect && <LocaleSelect variant="button" />}
        {user !== undefined && <UserMenu {...user} />}
      </Space>
    </Layout.Header>
  );
};
