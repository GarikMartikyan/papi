import { type ReactNode, useEffect } from 'react';

import { App as AntdApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';

import { useAppSelector } from '../hooks/useAppSelector';
import { selectThemeMode } from '../store/slices/config.slice';
import { ThemeMode } from '../types/enums/global.enum';
import { createTheme } from '../utils/theme.util';

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * antd theme config, merged over papi's `BASE_THEME`. Panels pass antd's own
   * `token` and `components` objects and only what they change; the algorithm
   * always comes from the store, so it cannot be overridden here.
   */
  theme?: ThemeConfig;
}

/**
 * Applies papi's theme and the active colour scheme to antd.
 *
 * `AntdApp` is included so `message`, `notification` and `Modal.confirm` render
 * with the theme instead of falling outside the ConfigProvider.
 */
export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props;

  const mode = useAppSelector(selectThemeMode);
  const isDark = mode === ThemeMode.DARK;

  const config = createTheme(theme);

  useEffect(() => {
    /*
     * Native controls and scrollbars follow this, not antd's tokens. The theme
     * leans on it too: `light-dark()` in its colours reads this very property.
     */
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <ConfigProvider
      theme={{
        ...config,
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
};
