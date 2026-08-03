import { theme } from 'antd';

/**
 * Токены текущей темы.
 *
 * Отдаёт сам `token`, а не результат `theme.useToken()` целиком: `hashId` и
 * `theme` из него нужны css-in-js самой antd, а не коду панели. Заодно избавляет
 * от импорта `theme` там, где из antd больше ничего не нужно.
 */
export const useToken = () => {
  const { token } = theme.useToken();

  return token;
};
