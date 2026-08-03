import type { ThemeMode } from '../enums/global.enum';
import type { Locale } from '../types/i18n.type';

/**
 * Panel-wide preferences owned by the `config` slice.
 *
 * Тема и язык переживают перезагрузку — см. `services/localStorage.service`.
 * Сайдбар оттуда только читается на старте.
 */
export interface ConfigState {
  /** Active colour scheme. Seeded from the browser, then from the user's choice. */
  themeMode: ThemeMode;
  /**
   * Active locale. Drives react-intl, antd and dayjs.
   *
   * Здесь может лежать язык, которого нет в списке панели: догадка о языке
   * браузера на старте или значение, оставшееся в localStorage после смены
   * набора языков. Сверяет и правит `I18nProvider`.
   *
   * В хранилище уходит только явный выбор пользователя — подбор ядра идёт через
   * `syncLocale` и не сохраняется.
   */
  locale: Locale;
  /**
   * Текущее состояние сайдбара. На старте берётся из localStorage, дальше
   * меняется кнопкой и в хранилище не пишется.
   */
  sidebarCollapsed: boolean;
}
