import type { LocaleDefinition } from '../types/interfaces/localeDefinition.interface';

/**
 * Языки панели — реестр для тех, кому нужен весь список, а не активный язык.
 *
 * Обычный модуль, а не контекст и не слайс. Набор языков панель задаёт на этапе
 * сборки, и за жизнь приложения он не меняется — подписываться не на что.
 *
 * В сторе ему тем более не место: `LocaleDefinition` несёт локаль dayjs, а она
 * наполовину состоит из функций (`months`, `relativeTime`, `meridiem`), то есть
 * состояние перестало бы быть сериализуемым и `serializableCheck` ругался бы на
 * каждый диспатч. В сторе лежит только выбранный язык.
 *
 * Заполняет `I18nProvider` — в теле рендера, до того как отрисуются дети,
 * поэтому первый же `LocaleSelect` видит список целиком, без промежуточного
 * кадра с пустым переключателем.
 *
 * Пустой список по умолчанию — значит, `I18nProvider` не смонтирован. Не
 * бросаем: `LocaleSelect` в этом случае просто не покажет себя.
 */
let panelLocales: readonly LocaleDefinition[] = [];

export const setLocales = (next: readonly LocaleDefinition[]) => {
  panelLocales = next;
};

export const getLocales = () => panelLocales;
