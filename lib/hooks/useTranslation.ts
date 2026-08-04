import { type MessageDescriptor, type PrimitiveType, useIntl } from 'react-intl';

/** Значения для подстановки в ICU-строку: `{count}`, `{name}`. */
export type MessageValues = Record<string, PrimitiveType>;

/**
 * `formatMessage` — с проверкой ключей для строк панели и с запасным текстом для
 * строк ядра.
 *
 * Ключи приходят параметром типа, а не берутся из ядра: ядро о каталоге панели
 * не знает и знать не должно — зависимость между ними односторонняя. Панель
 * подставляет свой union один раз в собственной обёртке — тем же приёмом, что и
 * `useAppSelector`.
 *
 * Без параметра типа ключ — обычная строка, то есть хук остаётся рабочим и до
 * того, как панель заведёт обёртку.
 *
 * Вторым видом аргумента принимается дескриптор — `id` вместе с
 * `defaultMessage`. Так описаны строки самого ядра (`PAPI_MESSAGES`): каталога
 * языков у ядра нет, его задаёт панель целиком, и без запасного текста панель,
 * не переведшая ключ, увидела бы на кнопке `papi.login.submit`. В ядре свои
 * строки форматируются только так — голым ключом строка ядра уедет без
 * запасного текста.
 *
 * Одно `Key | MessageDescriptor` вместо двух хуков: строка сверяется с union
 * панели, объект в `Key` не пролезает, поэтому проверка ключей от соседства с
 * дескрипторами не страдает.
 *
 * Возвращает саму функцию, а не объект с ней: сущность здесь одна, и обёртка
 * заставляла бы разворачивать её на каждом вызове.
 */
export const useTranslation = <Key extends string = string>() => {
  const intl = useIntl();

  return (message: Key | MessageDescriptor, values?: MessageValues) => {
    return typeof message === 'string'
      ? intl.formatMessage({ id: message }, values)
      : intl.formatMessage(message, values);
  };
};
