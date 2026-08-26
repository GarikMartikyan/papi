import { theme } from 'antd';

/**
 * Токены текущей темы.
 *
 * Отдаёт сам `token`, а не результат `theme.useToken()` целиком: `hashId` и
 * `theme` из него нужны css-in-js самой antd, а не коду панели. Заодно избавляет
 * от импорта `theme` там, где из antd больше ничего не нужно.
 *
 * @returns Токены активной темы antd — цвета, отступы, радиусы, шрифты, — уже
 * с поправкой на светлую или тёмную схему и на то, что панель передала
 * `ThemeProvider` пропом `theme`.
 * @example
 * ```tsx
 * const token = useThemeToken();
 *
 * return <div style={{ padding: token.paddingLG, color: token.colorTextSecondary }} />;
 * ```
 */
export const useThemeToken = () => {
  const { token } = theme.useToken();

  return token;
};
