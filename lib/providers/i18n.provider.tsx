import { type ReactNode, useEffect, useMemo } from 'react';

import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { type IntlConfig, IntlProvider } from 'react-intl';

import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectLocale, syncLocale } from '../store/slices/config.slice';
import type { I18nConfig } from '../types/interfaces/i18nConfig.interface';
import type { LocaleDefinition } from '../types/interfaces/localeDefinition.interface';
import type { Locale, LocaleMessages } from '../types/types/i18n.type';
import { resolveSupportedLocale } from '../utils/locale.util';
import { warn } from '../utils/logger.util';

import { LocalesContext } from './i18n.context';

/** Объявлен на уровне модуля: новый объект на каждый рендер пересоздавал бы `intl`, а с ним и `t`. */
const EMPTY_MESSAGES: LocaleMessages = {};

/**
 * По умолчанию react-intl пишет о пропущенных переводах через `console.error`.
 * Это не ошибка приложения, а недоделанный перевод, поэтому уровень снижен и
 * добавлен префикс `[papi]`.
 *
 * Приходят и на язык из `defaultLocale`: react-intl молчит только там, где в
 * `formatMessage` передан `defaultMessage`, а `useTranslation` его не передаёт.
 * Вместо ненайденной строки в интерфейс попадёт её id.
 */
const handleIntlError: NonNullable<IntlConfig['onError']> = (error) => {
  warn(error.message);
};

interface ResolvedI18n {
  definitions: Map<Locale, LocaleDefinition>;
  fallback: Locale;
}

/**
 * Раскладывает языки по коду и проверяет, что запасной среди них есть.
 *
 * Ошибку не бросаем: панель с опечаткой в `default` должна отрисоваться, пусть
 * и не на том языке, — иначе одна опечатка кладёт всё приложение.
 */
const resolveI18n = (config: I18nConfig): ResolvedI18n => {
  const definitions = new Map(config.locales.map((locale) => [locale.code, locale]));
  const first = config.locales[0];

  if (definitions.has(config.default)) {
    return { definitions, fallback: config.default };
  }

  if (first === undefined) {
    warn('Locale list is empty — antd and dayjs stay on their built-in English.');
    return { definitions, fallback: config.default };
  }

  warn(`Fallback locale "${config.default}" is not in locales — using "${first.code}".`);

  return { definitions, fallback: first.code };
};

export interface I18nProviderProps {
  children: ReactNode;
  /**
   * Языки панели и запасной среди них.
   *
   * Обязателен: своих локалей ядро не возит, поэтому без этого объекта не знает
   * ни одного языка.
   */
  i18n: I18nConfig;
}

/**
 * Активный язык — в react-intl, antd и dayjs одновременно.
 *
 * Все три источника строк переключаются вместе намеренно: разъехавшись, они
 * дают интерфейс, где текст панели уже переведён, а кнопки календаря — ещё нет.
 *
 * Здесь же язык сверяется со списком панели: в сторе он оказывается раньше, чем
 * этот список, — стор ядра создаётся при импорте. Здесь же дочитываются и
 * остальные языки браузера: в сторе лежит только первая догадка.
 */
export const I18nProvider = (props: I18nProviderProps) => {
  const { children, i18n } = props;

  const dispatch = useAppDispatch();
  const storedLocale = useAppSelector(selectLocale);

  const { definitions, fallback } = useMemo(() => resolveI18n(i18n), [i18n]);
  const locale = resolveSupportedLocale(storedLocale, [...definitions.keys()], fallback);
  const definition = definitions.get(locale);
  const messages = definition?.messages ?? EMPTY_MESSAGES;

  /*
   * Глобальная локаль dayjs — для дат самой панели, а не для antd.
   *
   * Календарь antd её не читает: antd отдаёт пикеру `locale.lang`, где лежит
   * собственный код языка, и @rc-component/picker применяет его к каждой дате
   * отдельно. Глобальная нужна ему только как запасная — если запрошенного
   * языка в dayjs не зарегистрировано.
   *
   * Регистрирует язык импорт `dayjs/locale/*` на стороне панели: модуль локали
   * сам зовёт `dayjs.locale(locale, null, true)`. Здесь остаётся переключение
   * активного языка — чтобы `dayjs(...)` в коде панели форматировал на нём же.
   *
   * В теле рендера, а не в эффекте: дата снимает язык с этой переменной в
   * момент создания, а эффекты идут после коммита и снизу вверх — дети успели
   * бы отрисовать даты на прежнем языке, и смена глобальной переменной их не
   * перерисовала бы. Вызов идемпотентен, повтор отсекается сравнением.
   */
  if (definition !== undefined && dayjs.locale() !== definition.dayjs.name) {
    dayjs.locale(definition.dayjs);
  }

  useEffect(() => {
    /*
     * В сторе мог остаться язык от другого набора языков — или ещё ничего.
     * Экшен без записи в хранилище: это подбор ядра, а не выбор пользователя.
     */
    if (locale !== storedLocale) dispatch(syncLocale(locale));
  }, [dispatch, locale, storedLocale]);

  return (
    // `locale={undefined}` — antd берёт свою встроенную локаль. Так бывает
    // только если панель прислала пустой список.
    <ConfigProvider locale={definition?.antd}>
      <IntlProvider
        locale={locale}
        defaultLocale={fallback}
        messages={messages}
        onError={handleIntlError}
      >
        {/* Список языков — тем, кто рисует переключатель: активный язык лежит в
            сторе, а весь набор известен только здесь. */}
        <LocalesContext.Provider value={i18n.locales}>{children}</LocalesContext.Provider>
      </IntlProvider>
    </ConfigProvider>
  );
};
