import type { AntdLocale, DayjsLocale, Locale, LocaleMessages } from '../types/i18n.type';

/**
 * Язык, который поддерживает панель.
 *
 * Ядро не возит локали antd и dayjs ни для одного языка — включая английский, —
 * поэтому `antd` и `dayjs` обязательны. Без них язык переведён наполовину: текст
 * панели уже свой, а кнопки календаря и пагинация остаются английскими.
 * Обязательность делает такую полуготовую запись ошибкой компиляции.
 */
export interface LocaleDefinition {
  /** BCP-47 tag. Он же ключ, по которому papi ищет язык. */
  code: Locale;
  /** Подпись для переключателя языка — на самом этом языке. */
  label?: string;
  /** Локаль antd: `import ruRU from 'antd/locale/ru_RU'`. */
  antd: AntdLocale;
  /** Локаль dayjs: `import ru from 'dayjs/locale/ru'`. */
  dayjs: DayjsLocale;
  /** Строки панели для этого языка. Плоские ключи — см. `LocaleMessages`. */
  messages?: LocaleMessages;
}
