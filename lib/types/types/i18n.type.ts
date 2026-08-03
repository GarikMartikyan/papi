import type { ConfigProviderProps } from 'antd';
import type dayjs from 'dayjs';

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
 * Ключи плоские (`'users.title'`), потому что react-intl ищет id как есть и во
 * вложенный объект не заглядывает.
 */
export type LocaleMessages = Record<string, string>;

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
