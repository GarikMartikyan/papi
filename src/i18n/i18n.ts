import antdEnUS from 'antd/locale/en_US';
import antdRuRU from 'antd/locale/ru_RU';
import dayjsEn from 'dayjs/locale/en';
import dayjsRu from 'dayjs/locale/ru';

import type { I18nConfig, LocaleDefinition } from '@papi/types';

import enMessages from './en.json';
import ruMessages from './ru.json';

const EN: LocaleDefinition = {
  code: 'en',
  label: 'English',
  antd: antdEnUS,
  dayjs: dayjsEn,
  messages: enMessages,
};

const RU: LocaleDefinition = {
  code: 'ru',
  label: 'Русский',
  antd: antdRuRU,
  dayjs: dayjsRu,
  messages: ruMessages,
};

/*
 * TODO: заглушка — два языка взяты как пример устройства. Панель оставляет
 * нужные ей, добавляет свои каталоги и правит `default` под тот язык, который
 * переведён всегда.
 */
export const I18N: I18nConfig = {
  default: 'en',
  locales: [EN, RU],
};
