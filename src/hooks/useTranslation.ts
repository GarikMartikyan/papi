import { useTranslation as usePapiTranslation } from '@papi/hooks';
import type { PapiMessageKey } from '@papi/i18n';

import type enMessages from '../i18n/en.json';

export type MessageKey = keyof typeof enMessages | PapiMessageKey;

export const useTranslation = () => usePapiTranslation<MessageKey>();
