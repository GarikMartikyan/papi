import { Button, type ButtonProps, Dropdown, type MenuProps, Select, type SelectProps } from 'antd';
import type { CSSProperties } from 'react';

import { getLocaleFlag } from '../../assets/icons/flags/flags';
import { useThemeToken } from '../../hooks';
import { useLocale } from '../../hooks/useLocale';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import type { LocaleDefinition } from '../../types/interfaces/localeDefinition.interface';
import type { Locale } from '../../types/types/i18n.type';

const DEFAULT_WIDTH = 140;

/** Флаги нарисованы 3:2, поэтому высота считается от ширины, а не задаётся. */
const FLAG_WIDTH = 18;
const FLAG_HEIGHT = 12;

/**
 * Углы у флага острые — и в списке, и внутри круглой кнопки: скругление
 * читается как чужая рамка поверх рисунка, а по форме самой кнопки флаг не
 * обрезать — у него есть верх и низ, и круг съел бы полосы по краям.
 */
const FLAG_STYLE: CSSProperties = { display: 'block', borderRadius: 1 };

const LABEL_STYLE: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8 };

/**
 * Флаг языка картинкой; `null` — флага для такого языка в карте нет.
 *
 * alt пустой намеренно: название языка всегда рядом — в списке текстом, у
 * кнопки в `aria-label`, — и скринридеру флаг был бы вторым и бесполезным
 * упоминанием того же самого.
 */
const renderFlag = (locale: Locale) => {
  const flag = getLocaleFlag(locale);

  if (flag === undefined) return null;

  return <img src={flag} alt="" width={FLAG_WIDTH} height={FLAG_HEIGHT} style={FLAG_STYLE} />;
};

/** Флаг и название языка одной строкой — общая начинка списка и меню. */
const renderLabel = (definition: LocaleDefinition) => (
  <span style={LABEL_STYLE}>
    {renderFlag(definition.code)}
    {definition.label ?? definition.code}
  </span>
);

const toOption = (definition: LocaleDefinition) => ({
  value: definition.code,
  label: renderLabel(definition),
});

const toMenuItem = (definition: LocaleDefinition) => ({
  key: definition.code,
  label: renderLabel(definition),
});

/**
 * Объединение по `variant`, а не один плоский интерфейс: базы у вариантов
 * разные — `Select` и `Button`, — и одноимённые пропсы объявлены у них
 * по-разному (`size`, `value`, `onChange`), так что `extends` обеих не
 * собирается. Объединение заодно честнее: в кнопку не пролезет `options`, а в
 * список — `shape`.
 *
 * `variant` — то, что выбирает базу:
 *
 * - `select` — обычный список: флаг и название, во всю ширину поля;
 * - `button` — круглая кнопка с одним флагом, а флаг и название остаются в
 *   выпадающем меню. Место под неё нужно там, где ширины нет вовсе, — в углу
 *   экрана входа.
 *
 * Из обеих баз имя вырезано через `Omit`: `variant` занят и у `Select`
 * (`outlined`/`filled`/`borderless`), и у `Button`. Вид самого списка при этом
 * фиксирован — см. комментарий у ветки.
 */
export type LocaleSelectProps =
  | (Omit<SelectProps, 'variant'> & { variant?: 'select' })
  | (Omit<ButtonProps, 'variant'> & { variant: 'button' });

/**
 * Переключатель языка панели: флаг и название на самом этом языке.
 *
 * Список берёт из `useLocale`, то есть из `I18nConfig` панели, — своих языков у
 * ядра нет. Языка нет в карте флагов — покажется один текст.
 *
 * `aria-label` берёт из строк ядра сам: видимой подписи нет ни у одного из
 * вариантов, а пропом его передавать больше не нужно. Панели, которой нужна
 * своя подпись, остаётся `aria-label` — он приходит через `...rest` и встаёт
 * поверх.
 *
 * `MainLayout` ставит его в шапку сам, поэтому отдельно компонент нужен только
 * там, где переключатель хочется показать ещё раз.
 */
export const LocaleSelect = (props: LocaleSelectProps) => {
  const token = useThemeToken();
  const t = usePapiTranslation();

  const { locale, locales, setLocale } = useLocale();

  const handleChange = (next: Locale) => {
    setLocale(next);
  };

  const handleSelect: MenuProps['onClick'] = ({ key }) => {
    setLocale(key);
  };

  // Один язык — выбирать не из чего, и список только занимает место в шапке.
  if (locales.length < 2) return null;

  /*
   * Деструктуризация не первой строкой тела, а внутри веток, в отличие от
   * остальных компонентов: `...rest` у веток разный, и собрать его до сужения по
   * `variant` нельзя — тогда в `Button` полетели бы пропсы списка.
   */
  if (props.variant === 'button') {
    const { style, variant: _variant, ...rest } = props;

    /*
     * `Dropdown` с меню, а не `Select` без подписи: списку пришлось бы гасить
     * стрелку и держать ширину под один флаг, а выбранное он всё равно рисует
     * внутри поля. Кнопка же несёт ровно флаг, а название языка остаётся там,
     * где его читают, — в раскрытом меню.
     *
     * Выбранный язык подсвечивает `selectedKeys` — иначе у меню не было бы
     * признака текущего значения, который у списка даёт само поле.
     */
    return (
      <Dropdown
        menu={{ items: locales.map(toMenuItem), onClick: handleSelect, selectedKeys: [locale] }}
        placement="bottomRight"
        trigger={['click']}
      >
        {/* Фон плашкой локально, как у `ThemeSwitcher`: в теме этого делать
            нельзя — плашкой стали бы все обычные кнопки панели. */}
        <Button
          style={{ background: token.colorBgLayout, ...style }}
          shape="circle"
          type="text"
          aria-label={t('change language')}
          {...rest}
        >
          {/* Флага нет — остаётся код языка: `shape="circle"` задаёт минимальную
              ширину, а не жёсткую, поэтому длинный тег растянет кнопку в
              пилюлю, а не вылезет за её край. */}
          {renderFlag(locale) ?? locale}
        </Button>
      </Dropdown>
    );
  }

  const { style, variant: _variant, ...rest } = props;

  return (
    /*
     * Убрана только рамка — фон поля остаётся.
     *
     * Не `variant="borderless"`: он снимает и фон, и поле растворяется в шапке.
     * Поэтому вариант остаётся `outlined`, а прозрачными делаются сами цвета
     * рамки — все три, иначе она возвращалась бы при наведении и в фокусе.
     *
     * Локальным провайдером, а не токенами в теме: иначе так выглядели бы все
     * списки панели, а плашка нужна только этому — в шапке.
     */
    <Select
      variant="filled"
      aria-label={t('change language')}
      options={locales.map(toOption)}
      style={{ width: DEFAULT_WIDTH, background: token.colorBgLayout, ...style }}
      value={locale}
      onChange={handleChange}
      {...rest}
    />
  );
};
