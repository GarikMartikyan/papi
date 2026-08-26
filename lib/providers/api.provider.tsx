import { type ReactNode, useEffect } from 'react';

import { App as AntdApp } from 'antd';

import { setApiNotifiers } from '../api/notifier';
import { useTranslation } from '../hooks/useTranslation';

/** Пропсы `ApiProvider`. */
export interface ApiProviderProps {
  /** Приложение панели — всё, откуда уходят запросы. */
  children: ReactNode;
}

/**
 * Показывает тосты запросов — ошибки и подтверждения — через antd.
 *
 * Существует ради одного: `message` приходится брать из `App.useApp()`, а он
 * доступен только внутри React, — тогда как показать нужно то, что случилось в
 * `baseQuery`, в обычном модуле. Провайдер кладёт готовые показыватели в реестр
 * ядра, откуда их и берёт `baseQuery`.
 *
 * Статический `message` из antd избавил бы от мостика, но он живёт вне
 * `ConfigProvider`: тост шёл бы без темы панели и без локали antd, и в консоли
 * бы на это ругались.
 *
 * Ставится внутри `ThemeProvider` — там смонтирован `AntdApp`. Отдельно панель
 * его не подключает: он входит в `PapiProvider`.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <ApiProvider>
 *     <App />
 *   </ApiProvider>
 * </ThemeProvider>
 * ```
 */
export const ApiProvider = (props: ApiProviderProps) => {
  const { children } = props;

  const { message } = AntdApp.useApp();
  const t = useTranslation();

  useEffect(() => {
    setApiNotifiers({
      /*
       * Текст от бэкенда идёт как есть: он уже на языке пользователя, и
       * переводить его нечем. Своя строка — только когда бэкенд ничего не
       * прислал: на сетевом сбое или на пустом теле ответа.
       */
      error: (error) => {
        void message.error(error.message ?? t(error.descriptor));
      },
      /*
       * То же деление, только пришедшее одним значением: строка — уже готовый
       * текст бэкенда, объект — дескриптор, который здесь и переводится.
       */
      success: (text) => {
        void message.success(typeof text === 'string' ? text : t(text));
      },
    });

    return () => {
      setApiNotifiers(null);
    };
  }, [message, t]);

  return <>{children}</>;
};
