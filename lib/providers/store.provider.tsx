import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { store } from '../store/store';

export interface StoreProviderProps {
  children: ReactNode;
}

/**
 * Redux под приложением панели.
 *
 * Стора в пропсах нет намеренно: он один и живёт в papi. Свои слайсы панель
 * докладывает в него через `injectSlices`, а не подменяет стор целиком — иначе
 * пришлось бы заново регистрировать middleware api.
 */
export const StoreProvider = (props: StoreProviderProps) => {
  const { children } = props;

  return <Provider store={store}>{children}</Provider>;
};
