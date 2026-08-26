import type { ThemeConfig } from 'antd';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import { PanelFavicon } from '../components/shared/PanelFavicon';
import type { I18nConfig } from '../types/interfaces/i18nConfig.interface';

import { ApiProvider } from './api.provider';
import { I18nProvider } from './i18n.provider';
import { StoreProvider } from './store.provider';
import { ThemeProvider } from './theme.provider';

/** Пропсы `PapiProvider`. */
export interface PapiProviderProps {
  /** Приложение панели — обычно `<PapiRouter />`. */
  children: ReactNode;
  /** Языки панели и запасной среди них — см. `I18nProviderProps.i18n`. */
  i18n: I18nConfig;
  /**
   * antd-тема панели: `token` и `components`. Ложится поверх темы ядра, поэтому
   * здесь только отличия, а не тема целиком. Алгоритм задаёт ядро.
   *
   * @defaultValue `BASE_THEME` ядра как есть.
   */
  theme?: ThemeConfig;
}

/**
 * Единственная обёртка, которую панель ставит вокруг приложения.
 *
 * Порядок вложенности не произвольный:
 *
 * — стор снаружи всех, потому что и тему, и язык остальные читают из него;
 * — язык выше темы, потому что `AntdApp` внутри ThemeProvider монтирует
 *   контейнеры `message`, `notification` и `Modal.confirm` — их строки должны
 *   попасть под локаль antd;
 * — api внутри темы, потому что берёт `message` из `App.useApp()`, а тот и
 *   монтируется тем самым `AntdApp`;
 * — роутер внутри всех: наружу он ничего не даёт — ни стору, ни теме, ни языку
 *   маршруты не нужны, — а всё, что ходит по адресам, живёт в `children`.
 *
 * Знак панели во вкладке браузера тоже ставит он — через `PanelFavicon`: иконку
 * и цвет тот берёт из каталога `panelLogos` по `VITE_APP_ABBR`. Панель, которая
 * собирает провайдеры сама, ставит этот компонент сама же.
 *
 * Роутер ставит ядро, и панели заводить свой больше не нужно. `basename` он
 * берёт из `import.meta.env.BASE_URL` — Vite подставляет туда `base` из конфига
 * сборки, то есть ровно тот префикс, под которым панель задеплоена. Панель
 * настраивает деплой в одном месте, а не в двух.
 *
 * Именно `BrowserRouter`: адреса панели должны быть обычными адресами, которые
 * открываются по ссылке и переживают перезагрузку. Нужен hash или memory —
 * такой панели придётся собирать цепочку провайдеров у себя, из отдельных
 * `StoreProvider`, `I18nProvider`, `ThemeProvider` и `ApiProvider`: они
 * экспортируются по отдельности как раз для этого.
 *
 * @example
 * ```tsx
 * // src/App.tsx
 * export const App = () => (
 *   <PapiProvider i18n={{ default: 'ru', locales: [ru, en] }} theme={appTheme}>
 *     <PapiRouter routes={routes} navItems={navItems} />
 *   </PapiProvider>
 * );
 * ```
 */
export const PapiProvider = (props: PapiProviderProps) => {
  const { children, i18n, theme } = props;

  return (
    <StoreProvider>
      {/* Знак во вкладку: провайдерам он не нужен, но и на экране его нет —
          стоит там, где до него точно доходит рендер. */}
      <PanelFavicon />

      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <ApiProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>{children}</BrowserRouter>
          </ApiProvider>
        </ThemeProvider>
      </I18nProvider>
    </StoreProvider>
  );
};
