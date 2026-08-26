import { type ReactNode, useEffect } from 'react';

import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { type IntlConfig, IntlProvider } from 'react-intl';

import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { PAPI_CATALOGS } from '../i18n/messages';
import { setLocales } from '../services/locales.service';
import { selectLocale, syncLocale } from '../store/slices/config.slice';
import type { I18nConfig } from '../types/interfaces/i18nConfig.interface';
import type { LocaleDefinition } from '../types/interfaces/localeDefinition.interface';
import type { Locale, MessageId } from '../types/types/i18n.type';
import { resolveSupportedLocale } from '../utils/locale.util';
import { warn } from '../utils/logger.util';

/**
 * Строки языка — четырьмя слоями: чем ниже, тем запаснее.
 *
 * Верхние два — активный язык: каталог ядра, поверх него каталог панели. Порядок
 * именно такой, чтобы одноимённый ключ панели перекрывал строку ядра: панель,
 * которой не нравится формулировка ядра, пишет свою у себя и не трогает `lib/`.
 *
 * Нижние два — те же каталоги на запасном языке, и без них теперь нельзя.
 * Ключ у нас — сам английский текст, поэтому ненайденную строку react-intl
 * возвращает как id, то есть в интерфейс попадает английский в нижнем регистре:
 * `sign in` вместо «Войти», а у ключа с уточнением — и вовсе
 * `sign in (page title)`. Раньше на это же место приезжал `defaultMessage`, но
 * он держал вторую копию каждой строки ядра. Слой запасного языка делает то же
 * самое одной ссылкой на уже существующий каталог.
 *
 * Ядро подкладывает именно `en`: это язык его исходных строк. Панели —
 * `I18nConfig.default`, тот, который она обещала переводить всегда.
 *
 * Ссылку на результат держит стабильной React Compiler: новый объект на каждый
 * рендер пересоздавал бы `intl`, а с ним и `t`, — а `t` лежит в зависимостях
 * эффектов, вплоть до регистрации тостов в `ApiProvider`.
 */
const resolveMessages = (
  definition: LocaleDefinition | undefined,
  fallbackDefinition: LocaleDefinition | undefined,
  locale: Locale,
) => ({
  ...PAPI_CATALOGS.en,
  ...fallbackDefinition?.messages,
  ...PAPI_CATALOGS[locale],
  ...definition?.messages,
});

/**
 * По умолчанию react-intl пишет о пропущенных переводах через `console.error`.
 * Это не ошибка приложения, а недоделанный перевод, поэтому уровень снижен и
 * добавлен префикс `[papi]`.
 *
 * Смысл у сообщения теперь другой, и он уже. Слои `resolveMessages` склеены в
 * один объект до того, как react-intl что-либо ищет, поэтому ключ, найденный на
 * запасном языке, для него ничем не отличается от переведённого. Ругань
 * означает «ключа нет ни в одном каталоге» — то есть опечатку или забытую
 * строку, а не отставший перевод.
 *
 * За отставшими переводами этот канал больше не следит: непереведённый ключ
 * молча показывается по-английски. Замечать такое должна сверка каталогов, а не
 * консоль рантайма.
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

/** Пропсы `I18nProvider`. */
export interface I18nProviderProps {
  /** Приложение панели — всё, что говорит на активном языке. */
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
 *
 * Каталог ядра он подкладывает под каталог панели сам, поэтому строки входа и
 * ошибок переведены и без её участия — а одноимённый ключ в её `messages`
 * перекрывает строку ядра.
 *
 * @example
 * ```tsx
 * <I18nProvider i18n={{ default: 'ru', locales: [ru, en] }}>
 *   <App />
 * </I18nProvider>
 * ```
 */
export const I18nProvider = (props: I18nProviderProps) => {
  const { children, i18n } = props;

  const dispatch = useAppDispatch();
  const storedLocale = useAppSelector(selectLocale);

  const { definitions, fallback } = resolveI18n(i18n);
  const locale = resolveSupportedLocale(storedLocale, [...definitions.keys()], fallback);
  const definition = definitions.get(locale);
  const fallbackDefinition = definitions.get(fallback);
  const messages = resolveMessages(definition, fallbackDefinition, locale);

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

  /*
   * Список языков — тем, кто рисует переключатель: активный язык лежит в сторе,
   * а весь набор известен только здесь.
   *
   * В теле рендера по той же причине, что и `dayjs.locale` выше: `useLocale`
   * читает реестр во время рендера, а дети рендерятся после родителя — так
   * первый же `LocaleSelect` видит список. Из эффекта список приехал бы вторым
   * кадром, и переключатель мигнул бы. Присваивание идемпотентно.
   */
  setLocales(i18n.locales);

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
        /* Утверждением, потому что доказать полноту набора компилятору нечем:
           объявив свои ключи в `FormatjsIntl`, панель требует здесь их все
           разом, а каталоги приезжают из JSON и склеиваются слоями — статически
           это `Record<string, string>`. Что ключ на месте, проверяет сверка
           каталогов; чего в них нет, покажет `handleIntlError`. */
        messages={messages as Record<MessageId, string>}
        onError={handleIntlError}
      >
        {children}
      </IntlProvider>
    </ConfigProvider>
  );
};
