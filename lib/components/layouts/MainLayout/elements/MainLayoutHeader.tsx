import { Layout, Space } from 'antd';
import type { ReactNode } from 'react';

import logoLarge from '../../../../assets/images/logo-large.svg';
import { useToken } from '../../../../hooks/useToken';
import { LocaleSelect } from '../../../shared/LocaleSelect';
import { ThemeSwitcher, type ThemeSwitcherVariant } from '../../../shared/ThemeSwitcher';
import { UserMenu, type UserMenuProps } from '../../../shared/UserMenu';

/**
 * Пропорции логотипа 124:49, поэтому ширина считается от высоты, а не задаётся.
 * Выше не стоит: шапка antd — 64px, и логотип упрётся в её края.
 */
const LOGO_HEIGHT = 48;

export interface MainLayoutHeaderProps {
  extra?: ReactNode;
  localeSelect: boolean;
  /** `undefined` пропускается насквозь: вид по умолчанию решает `ThemeSwitcher`. */
  themeSwitcher?: ThemeSwitcherVariant | 'none';
  /** Не передан — аватара в шапке нет вовсе. */
  user?: UserMenuProps;
}

/**
 * Шапка каркаса: логотип слева, справа — то, что панель положила в `extra`,
 * язык, тема и пользователь.
 *
 * Кнопка сворачивания сюда не входит: она живёт в самой навигации, рядом с тем,
 * что сворачивает.
 */
export const MainLayoutHeader = (props: MainLayoutHeaderProps) => {
  const { extra, localeSelect, themeSwitcher, user } = props;

  const token = useToken();

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
      {/* alt пустой намеренно: логотип декоративный, а своих строк ядро не
          возит — подпись на чужом языке была бы хуже её отсутствия. */}
      <img src={logoLarge} alt="" height={LOGO_HEIGHT} style={{ display: 'block' }} />

      {/* Язык, тема и пользователь — после `extra`: они есть у каждой панели,
          поэтому держатся на постоянном месте, а не переезжают вслед за её
          содержимым. Аватар при этом крайний: там его ищут в любой админке. */}
      <Space size="middle">
        {extra}
        {themeSwitcher !== 'none' && <ThemeSwitcher variant={themeSwitcher} />}
        {localeSelect && <LocaleSelect />}
        {user !== undefined && <UserMenu {...user} />}
      </Space>
    </Layout.Header>
  );
};
