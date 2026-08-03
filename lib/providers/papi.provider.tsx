import type { ThemeConfig } from 'antd';
import type { ReactNode } from 'react';

import type { I18nConfig } from '../types/interfaces/i18nConfig.interface';

import { I18nProvider } from './i18n.provider';
import { StoreProvider } from './store.provider';
import { ThemeProvider } from './theme.provider';

export interface PapiProviderProps {
  children: ReactNode;
  /** Языки панели и запасной среди них — см. `I18nProviderProps.i18n`. */
  i18n: I18nConfig;
  /**
   * antd-тема панели: `token` и `components`. Ложится поверх темы ядра, поэтому
   * здесь только отличия, а не тема целиком. Алгоритм задаёт ядро.
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
 * — роутер сюда не входит: выбор между history, hash и memory остаётся за
 *   панелью, а `basename` ядру неизвестен.
 */
export const PapiProvider = (props: PapiProviderProps) => {
  const { children, i18n, theme } = props;

  return (
    <StoreProvider>
      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </I18nProvider>
    </StoreProvider>
  );
};
