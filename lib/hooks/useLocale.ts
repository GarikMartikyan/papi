import { getLocales } from '../services/locales.service';
import { selectLocale, setLocale as setLocaleAction } from '../store/slices/config.slice';
import type { Locale } from '../types/types/i18n.type';

import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';

/**
 * Активный язык, языки панели и смена языка. Запись в localStorage делает сам
 * слайс, поэтому здесь достаточно задиспатчить экшен.
 *
 * `setLocale` принимает любой `Locale`: поддерживается ли он — решает
 * `I18nProvider`, он один сверяет язык со списком и заменит незнакомый на
 * запасной из `I18nConfig.default`.
 *
 * В сторе — только выбранный язык. Весь список приходит из реестра ядра, куда
 * его кладёт `I18nProvider`: набор языков задан панелью на этапе сборки, он не
 * меняется, и ни контекст, ни слайс ему не нужны — см. `locales.service`.
 * Вне `I18nProvider` список пустой.
 *
 * @returns `locale` — активный язык; `locales` — все языки панели из
 * `I18nConfig`; `setLocale(next)` — сменить язык.
 * @example
 * ```tsx
 * const { locale, locales, setLocale } = useLocale();
 *
 * return (
 *   <Select
 *     value={locale}
 *     options={locales.map(({ code, label }) => ({ value: code, label }))}
 *     onChange={setLocale}
 *   />
 * );
 * ```
 */
export const useLocale = () => {
  const locales = getLocales();

  const dispatch = useAppDispatch();
  const locale = useAppSelector(selectLocale);

  const setLocale = (next: Locale) => {
    dispatch(setLocaleAction(next));
  };

  return { locale, locales, setLocale };
};
