import { useTranslation as usePapiTranslation } from '@papi/hooks';

import type enMessages from '../i18n/en.json';

/**
 * Ключи сообщений панели — из каталога языка по умолчанию.
 *
 * Именно `en.json`, потому что он объявлен в `I18nConfig.default`: этот язык
 * переведён всегда, остальные могут отставать. TS выводит из JSON литеральный
 * union, поэтому опечатка в ключе не доживёт до рантайма.
 */
export type MessageKey = keyof typeof enMessages;

/**
 * `t` с проверкой ключей. Ядро типизировать их само не может — см. `@papi/hooks`.
 *
 * Отдаёт саму функцию: `const t = useTranslation()`.
 */
export const useTranslation = () => usePapiTranslation<MessageKey>();
