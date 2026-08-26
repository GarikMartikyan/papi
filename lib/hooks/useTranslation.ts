import { type MessageDescriptor, type PrimitiveType, useIntl } from 'react-intl';

import type { MessageId } from '../types/types/i18n.type';

/**
 * Значения для подстановки в ICU-строку: `{count}`, `{name}`.
 *
 * @example
 * ```ts
 * const values: MessageValues = { count: 3, name: 'Аня' };
 * ```
 */
export type MessageValues = Record<string, PrimitiveType>;

/**
 * `formatMessage` — с проверкой ключей.
 *
 * Ключи приходят параметром типа, а не берутся из ядра: ядро о каталоге панели
 * не знает и знать не должно — зависимость между ними односторонняя. Панель
 * подставляет свой union один раз в собственной обёртке — тем же приёмом, что и
 * `useAppSelector`, и тем же, каким ядро сужает свои ключи в
 * `usePapiTranslation`.
 *
 * Без параметра типа ключ — обычная строка, то есть хук остаётся рабочим и до
 * того, как панель заведёт обёртку.
 *
 * Вторым видом аргумента принимается дескриптор — объект с `id`. Так ключ едет
 * там, где его выбрали вне React и донесли до показа данными: разобранная
 * ошибка запроса, настройки тостов у эндпоинта. Рядом с ним в тех местах лежит
 * готовый текст от бэкенда, который переводить нечем, — объект отличает одно от
 * другого. Собираются такие дескрипторы через `papiMessage`, там же ключ и
 * сверяется с каталогом.
 *
 * Одно `Key | MessageDescriptor` вместо двух хуков: строка сверяется с union
 * панели, объект в `Key` не пролезает, поэтому проверка ключей от соседства с
 * дескрипторами не страдает.
 *
 * Возвращает саму функцию, а не объект с ней: сущность здесь одна, и обёртка
 * заставляла бы разворачивать её на каждом вызове.
 *
 * Параметр ограничен `MessageId`, а не `string`: этим же типом объявлен `id` у
 * дескриптора, и без ограничения ключ не пролез бы в `formatMessage`. Он же
 * стоит умолчанием, так что панель, объявившая свои ключи в `FormatjsIntl`,
 * получает проверку и без собственной обёртки — та остаётся ради имени.
 *
 * @typeParam Key — union ключей каталога панели. Не задан — любой `MessageId`.
 * @returns `t(message, values?)`: `message` — ключ каталога или дескриптор от
 * `papiMessage`, `values` — подстановки в ICU-строку; на выходе готовая строка
 * на активном языке.
 * @example
 * ```tsx
 * const t = useTranslation<AppMessageKey>();
 *
 * return <h1>{t('users', { count: users.length })}</h1>;
 * ```
 * @example Своя обёртка панели — чтобы не повторять параметр типа:
 * ```ts
 * export const useAppTranslation = () => useTranslation<AppMessageKey>();
 * ```
 */
export const useTranslation = <Key extends MessageId = MessageId>() => {
  const intl = useIntl();

  return (message: Key | MessageDescriptor, values?: MessageValues) => {
    return typeof message === 'string'
      ? intl.formatMessage({ id: message }, values)
      : intl.formatMessage(message, values);
  };
};
