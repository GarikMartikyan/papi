import { useCallback } from 'react';

import { type PrimitiveType, useIntl } from 'react-intl';

/** Значения для подстановки в ICU-строку: `{count}`, `{name}`. */
export type MessageValues = Record<string, PrimitiveType>;

/**
 * `formatMessage` с проверкой ключей.
 *
 * Ключи приходят параметром типа, а не берутся из ядра: ядро о каталоге панели
 * не знает и знать не должно — зависимость между ними односторонняя. Панель
 * подставляет свой union один раз в собственной обёртке — тем же приёмом, что и
 * `useAppSelector`.
 *
 * Без параметра типа ключ — обычная строка, то есть хук остаётся рабочим и до
 * того, как панель заведёт обёртку.
 *
 * Возвращает саму функцию, а не объект с ней: сущность здесь одна, и обёртка
 * заставляла бы разворачивать её на каждом вызове.
 */
export const useTranslation = <Key extends string = string>() => {
  const intl = useIntl();

  return useCallback(
    (id: Key, values?: MessageValues) => {
      return intl.formatMessage({ id }, values);
    },
    [intl],
  );
};
