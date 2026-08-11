import type { PapiMessageKey } from '../i18n/messages';

import { useTranslation } from './useTranslation';

/**
 * `t` для строк самого ядра — с проверкой его собственных ключей.
 *
 * Ядро подставляет свой union один раз здесь, ровно тем же приёмом, каким это
 * делает у себя панель (`src/hooks/useTranslation.ts`). Без обёртки каждый
 * компонент ядра звал бы `useTranslation<PapiMessageKey>()`, а забывший
 * параметр получал бы `string` — и опечатка в ключе доехала бы до интерфейса.
 *
 * Наружу не выходит: в барель `hooks/index.ts` файл не включён. Панели он ни к
 * чему — её ключи ядру неизвестны, и сузить их этим хуком нельзя.
 */
export const usePapiTranslation = () => useTranslation<PapiMessageKey>();
