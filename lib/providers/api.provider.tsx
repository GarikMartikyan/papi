import { type ReactNode, useEffect } from 'react';

import { App as AntdApp } from 'antd';

import { setApiErrorNotifier } from '../api/errorNotifier';
import { useTranslation } from '../hooks/useTranslation';

export interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Показывает ошибки запросов тостом antd.
 *
 * Существует ради одного: `message` приходится брать из `App.useApp()`, а он
 * доступен только внутри React, — тогда как ошибка рождается в `baseQuery`, в
 * обычном модуле. Провайдер кладёт готовый показыватель в реестр ядра, откуда
 * его и берёт `baseQuery`.
 *
 * Статический `message` из antd избавил бы от мостика, но он живёт вне
 * `ConfigProvider`: тост шёл бы без темы панели и без локали antd, и в консоли
 * бы на это ругались.
 *
 * Ставится внутри `ThemeProvider` — там смонтирован `AntdApp`. Отдельно панель
 * его не подключает: он входит в `PapiProvider`.
 */
export const ApiProvider = (props: ApiProviderProps) => {
  const { children } = props;

  const { message } = AntdApp.useApp();
  const t = useTranslation();

  useEffect(() => {
    /*
     * Текст от бэкенда идёт как есть: он уже на языке пользователя, и
     * переводить его нечем. Своя строка — только когда бэкенд ничего не
     * прислал: на сетевом сбое или на пустом теле ответа.
     */
    setApiErrorNotifier((error) => {
      void message.error(error.message ?? t(error.descriptor));
    });

    return () => {
      setApiErrorNotifier(null);
    };
  }, [message, t]);

  return <>{children}</>;
};
