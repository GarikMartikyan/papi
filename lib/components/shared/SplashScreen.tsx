import { Spin } from 'antd';
import type { CSSProperties, HTMLAttributes } from 'react';

import { useToken } from '../../hooks/useToken';

/**
 * Своя высота на весь экран: экран стоит вместо каркаса, а `100vh` держит тот.
 * Без неё содержимое прижалось бы к верхнему краю.
 *
 * Отступ — на случай содержимого пошире крутилки: у сообщения об ошибке есть
 * текст, и на узком экране он не должен упираться в края.
 */
const PAGE_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 24,
};

export type SplashScreenProps = HTMLAttributes<HTMLDivElement>;

/**
 * Экран на всё окно с содержимым по центру: панели ещё нечего показать.
 *
 * Так выглядит ожидание до каркаса — пока гард `PapiRouter` спрашивает у
 * бэкенда, жива ли сессия. Каркас в это время не рисуется намеренно: шапка с
 * меню, мелькнувшие перед уходом на вход, читаются сбоем, а не загрузкой.
 *
 * Без содержимого это крутилка по центру, поэтому обычному ожиданию хватает
 * `<SplashScreen />`. Переданные `children` встают вместо неё — так же
 * посередине пустого экрана; тем же местом пользуется экран ошибки гарда.
 *
 * Панели он пригодится под `Suspense` вокруг лениво подгружаемых страниц: там
 * нужен ровно такой экран — ничего, кроме признака, что идёт загрузка.
 */
export const SplashScreen = (props: SplashScreenProps) => {
  const { children, style, ...rest } = props;

  const token = useToken();

  return (
    <div style={{ ...PAGE_STYLE, background: token.colorBgContainer, ...style }} {...rest}>
      {children ?? <Spin size="large" />}
    </div>
  );
};
