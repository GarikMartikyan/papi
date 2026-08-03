import { createContext } from 'react';

import type { LocaleDefinition } from '../types/interfaces/localeDefinition.interface';

/**
 * Языки панели — для тех, кому нужен весь список, а не только активный язык.
 *
 * Через контекст, а не через стор: в сторе лежит выбор пользователя, а список
 * приходит пропсом `I18nProvider` и живёт ровно столько, сколько смонтирован
 * провайдер. Класть в стор то, что задано на этапе сборки панели, значило бы
 * дублировать источник истины.
 *
 * Пустой массив по умолчанию — значит, компонент оказался вне `I18nProvider`.
 * Не бросаем: `LocaleSelect` в этом случае просто не покажет себя.
 */
export const LocalesContext = createContext<readonly LocaleDefinition[]>([]);
