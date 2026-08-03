import { Select, type SelectProps } from 'antd';

import { getLocaleFlag } from '../../assets/icons/flags/flags';
import { useToken } from '../../hooks';
import { useLocale } from '../../hooks/useLocale';
import type { LocaleDefinition } from '../../types/interfaces/localeDefinition.interface';
import type { Locale } from '../../types/types/i18n.type';

/**
 * Английский тут — осознанный постоянный дефолт, а не заглушка: у списка нет
 * видимой подписи. Переведённую передаёт панель.
 */
const DEFAULT_LABEL = 'Change language';

const DEFAULT_WIDTH = 140;

/** Флаги нарисованы 3:2, поэтому высота считается от ширины, а не задаётся. */
const FLAG_WIDTH = 18;
const FLAG_HEIGHT = 12;

const toOption = (definition: LocaleDefinition) => {
  const flag = getLocaleFlag(definition.code);

  return {
    value: definition.code,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {flag !== undefined && (
          // alt пустой намеренно: флаг дублирует название языка рядом, и
          // скринридеру он был бы вторым и бесполезным упоминанием.
          <img
            src={flag}
            alt=""
            width={FLAG_WIDTH}
            height={FLAG_HEIGHT}
            style={{ display: 'block', borderRadius: 2 }}
          />
        )}
        {definition.label ?? definition.code}
      </span>
    ),
  };
};

export interface LocaleSelectProps extends SelectProps {
  /** `aria-label`: у списка нет видимой подписи. */
  label?: string;
}

/**
 * Переключатель языка панели: флаг и название на самом этом языке.
 *
 * Список берёт из `useLocale`, то есть из `I18nConfig` панели, — своих языков у
 * ядра нет. Языка нет в карте флагов — покажется один текст.
 *
 * `MainLayout` ставит его в шапку сам, поэтому отдельно компонент нужен только
 * там, где переключатель хочется показать ещё раз.
 */
export const LocaleSelect = (props: LocaleSelectProps) => {
  const { label = DEFAULT_LABEL, style, ...rest } = props;

  const token = useToken();

  const { locale, locales, setLocale } = useLocale();

  const handleChange = (next: Locale) => {
    setLocale(next);
  };

  // Один язык — выбирать не из чего, и список только занимает место в шапке.
  if (locales.length < 2) return null;

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
      aria-label={label}
      options={locales.map(toOption)}
      style={{ width: DEFAULT_WIDTH, background: token.colorBgLayout, ...style }}
      value={locale}
      onChange={handleChange}
      {...rest}
    />
  );
};
