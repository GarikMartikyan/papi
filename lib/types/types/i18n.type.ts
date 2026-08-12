import type { ConfigProviderProps } from 'antd';
import type dayjs from 'dayjs';
import type { MessageDescriptor } from 'react-intl';

/**
 * BCP-47 language tag: `'en'`, `'ru'`, `'pt-BR'`.
 *
 * Намеренно `string`, а не union: набор языков задаёт панель, а ядро не знает
 * ни одного — английского в том числе. Панель при желании сужает тип у себя.
 */
export type Locale = string;

/**
 * Message catalogue: message id → ICU string.
 *
 * Ключ — сам английский текст строки в нижнем регистре (`'sign out'`,
 * `'{count} users'`), а не путь вроде `'users.title'`. Плоские они при этом
 * по-прежнему: react-intl ищет id как есть и во вложенный объект не заглядывает.
 */
export type LocaleMessages = Record<string, string>;

/**
 * Ключ сообщения — тот, что знает react-intl.
 *
 * Обычный `string`, пока панель не объявила свои ключи в `FormatjsIntl.Message`
 * (см. `src/types/formatjs.d.ts`); объявила — union её каталога. Ядро берёт его
 * отсюда, а не из своего `PapiMessageKey`, там, где ключ приходит **снаружи**:
 * подпись маршрута пишет панель, и сверяться он должен с её каталогом.
 *
 * Через `MessageDescriptor`, а не через сам `FormatjsIntl`: у formatjs это
 * глобальный namespace, а вывод из него — внутренний тип, наружу не выходящий.
 */
export type MessageId = NonNullable<MessageDescriptor['id']>;

/** antd не экспортирует `Locale` из корня — берём тип из пропсов провайдера. */
export type AntdLocale = NonNullable<ConfigProviderProps['locale']>;

/**
 * dayjs-локаль: `import ru from 'dayjs/locale/ru'`.
 *
 * Выводится из самого dayjs, а не пишется как `ILocale`: `ILocale` — глобальный
 * ambient-тип, он существует лишь пока в проект подтянуты типы dayjs и обратной
 * ссылки на них не несёт. Через `Parameters` тип привязан к библиотеке явно и
 * поедет за ней при обновлении.
 */
export type DayjsLocale = Exclude<Parameters<typeof dayjs.locale>[0], string | undefined>;
