import type { Locale } from '../../../types/types/i18n.type';
import { matchSupportedLocale } from '../../../utils/locale.util';

import en from './en.svg';
import hy from './hy.svg';
import ru from './ru.svg';

/**
 * Флаг по коду языка.
 *
 * Ключи — языки (`hy` — армянский), а не страны: подписывается язык, а не
 * регион. Отсюда и расхождения вроде `en` → флаг Великобритании: у языка своего
 * флага не бывает, поэтому берётся флаг страны происхождения.
 *
 * Список открытый — просто кладётся новый svg и дописывается сюда. Языка нет в
 * карте — `LocaleSelect` покажет один текст, без картинки.
 *
 * Значения — готовые URL: svg обрабатывает Vite. Мелкие файлы, включая эти
 * флаги, он инлайнит в бандл как data-URI, крупные кладёт отдельным ассетом с
 * хешем в имени — граница задаётся `build.assetsInlineLimit`. Настраивать
 * копирование ассетов панели при этом не нужно: импорт и есть настройка.
 */
const FLAGS: Record<Locale, string> = { en, hy, ru };

const FLAG_LOCALES = Object.keys(FLAGS);

/**
 * Флаг для языка панели. `undefined` — флага для такого языка нет.
 *
 * Подбор идёт тем же правилом, что и у самих языков: точное совпадение, затем
 * основной субтег, — поэтому `en-GB` и `ru-RU` находят свои флаги.
 */
export const getLocaleFlag = (locale: Locale): string | undefined => {
  const matched = matchSupportedLocale(locale, FLAG_LOCALES);

  return matched === null ? undefined : FLAGS[matched];
};
