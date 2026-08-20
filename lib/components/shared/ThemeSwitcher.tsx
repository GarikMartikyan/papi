import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, type ButtonProps, Switch, type SwitchProps } from 'antd';

import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useThemeToken } from '../../hooks/useThemeToken';

export type ThemeSwitcherVariant = 'switch' | 'button';

/**
 * Объединение по `variant`, а не один плоский интерфейс: базы разные, и
 * `extends ButtonProps, SwitchProps` не собирается — `size`, `loading`,
 * `value`, `onChange` и `onClick` объявлены у них по-разному (TS2320).
 * Объединение заодно и честнее плоского типа: в тумблер не пролезет `href`, а в
 * кнопку — `checkedChildren`.
 *
 * `variant` — то, что выбирает базу:
 *
 * - `button` — кнопка с иконкой, `switch` — тумблер солнце/луна;
 * - у кнопки показана иконка текущей темы, а не будущей: пользователь читает её
 *   как индикатор состояния, а стрелка «куда переключит» на одной иконке не
 *   выражается.
 *
 * Из `ButtonProps` он вырезан: имя занято. Вид самой кнопки задаётся через
 * `type` и `color`.
 */
export type ThemeSwitcherProps =
  (Omit<ButtonProps, 'variant'> & { variant?: 'button' }) | (SwitchProps & { variant: 'switch' });

/**
 * Переключатель светлой и тёмной темы.
 *
 * Про стор и localStorage не знает: `useThemeMode` отдаёт состояние и
 * переключение, а запись выбора в хранилище делает слайс ядра.
 *
 * `aria-label` берёт из строк ядра сам: видимого текста нет ни у одного из
 * вариантов, а пропом подпись передавать больше не нужно. Панели, которой нужна
 * своя, остаётся `aria-label` — он приходит через `...rest` и встаёт поверх.
 *
 * `MainLayout` ставит его в шапку сам, поэтому отдельно этот компонент нужен
 * только там, где переключатель хочется показать ещё раз — например на
 * странице настроек.
 */
export const ThemeSwitcher = (props: ThemeSwitcherProps) => {
  const token = useThemeToken();
  const t = usePapiTranslation();

  const { isDark, toggleMode } = useThemeMode();

  const handleToggle = () => {
    toggleMode();
  };

  /*
   * Деструктуризация не первой строкой тела, а внутри веток, в отличие от
   * остальных компонентов: `...rest` у веток разный, и собрать его до сужения по
   * `variant` нельзя — тогда в `Switch` полетели бы пропсы кнопки.
   */
  if (props.variant === 'switch') {
    // `_variant` вынимается только чтобы не попасть в `rest`: у `Switch` такого пропа нет.
    const { variant: _variant, ...rest } = props;

    /*
     * Фон блока тумблеру не ставится, в отличие от кнопки: у него заливка
     * дорожки — это само состояние (включённая идёт `colorPrimary`), и общий
     * фон читался бы как «включено».
     */
    return (
      <Switch
        aria-label={t('toggle colour scheme')}
        checked={isDark}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        onChange={handleToggle}
        {...rest}
      />
    );
  }

  const { style, variant: _variant, ...rest } = props;

  return (
    // Локальным провайдером, а не токенами в теме: иначе плашкой стали бы все
    // обычные кнопки панели, а нужна она одной этой — в шапке.
    <Button
      style={{ background: token.colorBgLayout, ...style }}
      type="text"
      aria-label={t('toggle colour scheme')}
      icon={isDark ? <MoonOutlined /> : <SunOutlined />}
      onClick={handleToggle}
      {...rest}
    />
  );
};
