import { useCallback, useContext } from 'react';

import { LocalesContext } from '../providers/i18n.context';
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
 * `locales` приходит из контекста провайдера, а не из стора: набор языков задан
 * панелью на этапе сборки, и в сторе он оказался бы вторым источником истины.
 * Вне `I18nProvider` список пустой.
 */
export const useLocale = () => {
  const locales = useContext(LocalesContext);

  const dispatch = useAppDispatch();
  const locale = useAppSelector(selectLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      dispatch(setLocaleAction(next));
    },
    [dispatch],
  );

  return { locale, locales, setLocale };
};
