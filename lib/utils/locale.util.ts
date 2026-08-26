import { getLocaleLS } from '../services/localStorage.service';
import type { Locale } from '../types/types/i18n.type';

import { warn } from './logger.util';

/**
 * «Язык ещё не известен»: стор создаётся при импорте, а список языков приходит
 * позже, из `I18nConfig`. Пустая строка не совпадёт ни с одним тегом, поэтому
 * провайдер гарантированно заменит её на запасной язык панели.
 */
export const UNKNOWN_LOCALE = '';

/** `ru-RU` → `ru`. */
const getPrimarySubtag = (tag: Locale): string => {
  return tag.split('-')[0]?.toLowerCase() ?? '';
};

/**
 * Языки браузера в порядке предпочтения, полными тегами.
 *
 * Тег не обрезается: регион отличает `pt-PT` от `pt-BR`, а есть ли такая пара у
 * панели, решает `matchSupportedLocale`. Список отдаётся целиком — первого языка
 * у панели может не быть, а второй может найтись.
 *
 * @returns Теги вроде `['ru-RU', 'ru', 'en-US']`; пустой список — окружение без
 * `navigator` (сборка вне браузера).
 */
export const getSystemLocales = (): readonly Locale[] => {
  if (typeof navigator === 'undefined') return [];

  // `languages` объявлен обязательным в типах, но отсутствует в части окружений.
  const preferred = navigator.languages ?? [];
  const tags: readonly (string | undefined)[] =
    preferred.length > 0 ? preferred : [navigator.language];

  return tags.filter((tag): tag is Locale => tag !== undefined && tag !== '');
};

/**
 * Первый язык браузера — догадка на момент создания стора.
 *
 * Сверять её не с чем: список языков приносит панель, а стор ядра создаётся
 * раньше. Проверит догадку `resolveSupportedLocale` — там список уже известен,
 * и там же дочитываются остальные предпочтения браузера.
 *
 * @returns Первый язык браузера; `null` — узнать его неоткуда.
 */
export const getSystemLocale = (): Locale | null => {
  return getSystemLocales()[0] ?? null;
};

/**
 * Язык на момент создания стора: localStorage → браузер → «неизвестно».
 *
 * Своего значения по умолчанию у ядра нет: какой язык запасной, знает только
 * панель. Результат ещё не обязан быть поддерживаемым — это лучшая догадка до
 * того, как панель передала `I18nConfig`.
 *
 * @returns Выбор пользователя, язык браузера или `UNKNOWN_LOCALE`.
 */
export const resolveInitialLocale = (): Locale => {
  return getLocaleLS() ?? getSystemLocale() ?? UNKNOWN_LOCALE;
};

/**
 * Ближайший поддерживаемый язык: точное совпадение → совпадение по основному
 * субтегу (`pt` ↔ `pt-BR`) → `null`.
 *
 * @param candidate Искомый язык. Регистр не важен.
 * @param supported Языки панели — коды из `I18nConfig.locales`.
 * @returns Код **из списка панели**, а не сам `candidate`; `null` — ничего
 * похожего в списке нет.
 * @example
 * ```ts
 * matchSupportedLocale('pt-BR', ['en', 'pt']); // 'pt'
 * matchSupportedLocale('de', ['en', 'pt']); // null
 * ```
 */
export const matchSupportedLocale = (
  candidate: Locale,
  supported: readonly Locale[],
): Locale | null => {
  if (candidate === UNKNOWN_LOCALE) return null;

  const exact = supported.find((code) => code.toLowerCase() === candidate.toLowerCase());

  if (exact !== undefined) return exact;

  const primary = getPrimarySubtag(candidate);
  const byPrimary = supported.find((code) => getPrimarySubtag(code) === primary);

  return byPrimary ?? null;
};

/**
 * Язык, который панель действительно умеет показать.
 *
 * Запасной приходит аргументом, а не берётся из константы ядра: выделенного
 * языка у papi нет — ни английского, ни какого-либо другого. Вызывается
 * провайдером: в сторе может оказаться язык из localStorage, который панель
 * больше не поддерживает, или ещё не заполненное значение.
 *
 * Не подошедший кандидат — не конец подбора: дальше разбираются остальные языки
 * браузера. Стор везёт один тег, а у браузера их список, и сюда — в первую
 * точку, где известны языки панели, — он не доезжает, поэтому читается заново.
 *
 * @param candidate Язык из стора — выбор пользователя или догадка старта.
 * @param supported Языки панели — коды из `I18nConfig.locales`.
 * @param fallback Запасной язык панели — `I18nConfig.default`.
 * @returns Язык, который панель точно умеет показать. Про выбор, который панель
 * поддерживать перестала, в консоль уходит предупреждение.
 */
export const resolveSupportedLocale = (
  candidate: Locale,
  supported: readonly Locale[],
  fallback: Locale,
): Locale => {
  const matched = matchSupportedLocale(candidate, supported);

  if (matched !== null) return matched;

  const preferred = getSystemLocales();

  for (const tag of preferred) {
    const next = matchSupportedLocale(tag, supported);

    if (next !== null) return next;
  }

  /*
   * Предупреждаем только про выбор, который панель перестала поддерживать: про
   * «ещё не известен» и про догадку браузера говорить не о чем — обычный старт.
   */
  if (candidate !== UNKNOWN_LOCALE && !preferred.includes(candidate)) {
    warn(`Locale "${candidate}" is not supported by the panel — using "${fallback}".`);
  }

  return fallback;
};
