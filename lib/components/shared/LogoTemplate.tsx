import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';

import { useThemeToken } from '../../hooks/useThemeToken';
import { getAppAbbr, getAppName } from '../../services/env.service';

/**
 * Пропорции трёх композиций — доли от высоты пилюли. Сняты с макета, где
 * `large` была 36 единиц высотой, `middle` — 30, и переведены в доли, чтобы
 * одна и та же геометрия держалась на любой высоте: в шапке 48, на входе 52,
 * на экране ожидания 64.
 *
 * Правое поле шире левого: слева стоит круглая иконка, и её собственный
 * контур уже повторяет дугу пилюли, а справа текст с прямыми краями упирался
 * бы в скругление — ему нужен запас.
 */
const LARGE = {
  iconRatio: 0.75,
  padStartRatio: 0.125,
  padEndRatio: 0.4,
  gapRatio: 0.18,
  abbrRatio: 0.58,
  nameRatio: 0.17,
  linesGapRatio: 0.045,
};

const MIDDLE = {
  iconRatio: 0.63,
  padStartRatio: 0.18,
  padEndRatio: 0.32,
  gapRatio: 0.18,
  abbrRatio: 0.57,
};

/** Буквы в `small` показываются только без иконки — мельче, чтобы влезть в круг. */
const SMALL = { iconRatio: 0.66, abbrRatio: 0.34 };

/** Высота по умолчанию для каждой композиции, если место её не задало. */
const DEFAULT_HEIGHT: Record<LogoTemplateSize, number> = { large: 48, middle: 40, small: 32 };

/**
 * Цвет пилюли по умолчанию — красный из `assets/images/logo-large.svg`.
 *
 * Он, а не `colorPrimary` темы: логотип — это лицо, и оно не должно меняться
 * вслед за акцентом интерфейса. Выходит наружу, чтобы панель могла взять тот же
 * красный для чего-то ещё, не переписывая его по памяти.
 */
export const PAPI_LOGO_COLOR = '#db3e3f';

/** Разрядка капители в имени — в долях кегля, как в макете (0.9 при кегле 6.2). */
const NAME_LETTER_SPACING = '0.14em';

const PILL_STYLE: CSSProperties = {
  alignItems: 'center',
  borderRadius: 999,
  boxSizing: 'border-box',
  display: 'inline-flex',
  lineHeight: 1,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const TEXT_COLUMN_STYLE: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
};

export type LogoTemplateSize = 'large' | 'middle' | 'small';

export interface LogoTemplateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Аббревиатура в пилюле — две-четыре буквы, как `RMP`. По умолчанию `VITE_APP_ABBR`. */
  abbr?: string;
  /**
   * Полное имя панели: вторая строка в `large`, подпись для читающих с экрана
   * в остальных размерах. По умолчанию `VITE_APP_NAME`.
   */
  name?: string;
  /**
   * Иконка панели в круглом слоте слева — готовый элемент: `<TriangleAlert />`,
   * `<Icon name="shield" />`, `<img src={…} />`. Слот растягивает её на себя
   * (см. `.papi-logo-template-icon` в `styles.css`), а цвет она берёт из
   * `currentColor` — внутри пилюли это белый.
   *
   * Без иконки слот не рисуется, пилюля начинается с букв; `small` тогда
   * показывает в круге буквы.
   */
  icon?: ReactElement;
  /**
   * Заливка пилюли. Не задана — `PAPI_LOGO_COLOR`. Иконка, буквы и имя поверх
   * заливки всегда белые.
   */
  color?: string;
  /**
   * Композиция: `large` — иконка, буквы и имя второй строкой; `middle` —
   * иконка и буквы; `small` — круг с одной иконкой.
   */
  size?: LogoTemplateSize;
  /** Высота пилюли в пикселях; всё внутри считается от неё. */
  height?: number;
}

/**
 * Шаблон логотипа: красная пилюля с иконкой, буквами и именем.
 *
 * Шаблон, а не файл, потому что `lib/` в панелях read-only, а лицо у каждой
 * панели своё: имя и буквы она задаёт в `.env`, иконку передаёт пропом — и
 * получает логотип, не рисуя его. Каркасы ядра его не ставят: у них своя
 * картинка и проп `logo` под чужую; этот компонент панель ставит сама.
 *
 * Панели из каталога показываются через `PanelLogo` — он берёт отсюда
 * геометрию, а имя с иконкой подставляет по короткому имени панели.
 *
 * Три композиции — одна и та же пилюля, от которой отрезают по части:
 *
 * ```
 * large   (● RMP             )   middle  (● RMP)   small  (●)
 *         (  RISK MANAGEMENT )
 * ```
 *
 * Так один логотип живёт в трёх местах: `large` — вход и экран ожидания,
 * `middle` — шапка, `small` — свёрнутая навигация и фавикон-подобные места.
 *
 * Заливка — красный из логотипа ядра, и меняется пропом `color`, а не темой:
 * лицо панели не должно переезжать вслед за акцентом интерфейса. Всё поверх
 * заливки — `colorWhite` темы. Шрифт тоже темы: буквы в 800, имя капителью в
 * 700 — вес есть у любого гротеска, а гарнитуру панель задаёт в
 * `token.fontFamily`, если системной мало.
 *
 * Вёрстка CSS-ом, а не SVG: иконка — слот под любой узел, а буквы и имя —
 * настоящий текст, который масштабируется кеглем от высоты и читается с
 * экрана. `aria-label` стоит там, где имени на экране нет, — в `middle` и
 * `small`; в `large` оно и так написано.
 */
export const LogoTemplate = (props: LogoTemplateProps) => {
  const {
    abbr = getAppAbbr(),
    color = PAPI_LOGO_COLOR,
    height: heightProp,
    icon,
    name = getAppName(),
    size = 'large',
    style,
    ...rest
  } = props;

  const token = useThemeToken();

  const height = heightProp ?? DEFAULT_HEIGHT[size];
  const hasIcon = icon !== undefined && icon !== null;

  const pillStyle: CSSProperties = {
    ...PILL_STYLE,
    background: color,
    color: token.colorWhite,
    fontFamily: token.fontFamily,
    height,
    ...style,
  };

  const iconSlot = (ratio: number) => {
    if (!hasIcon) return null;

    const box = { height: height * ratio, width: height * ratio };

    return (
      <span className="papi-logo-template-icon" style={box}>
        {icon}
      </span>
    );
  };

  if (size === 'small') {
    return (
      <div
        role="img"
        aria-label={name}
        /* Круг: ширину задаёт пропорция, а не вторая копия высоты — так у
           размера остаётся один источник. */
        style={{ ...pillStyle, aspectRatio: '1 / 1', justifyContent: 'center' }}
        {...rest}
      >
        {iconSlot(SMALL.iconRatio) ?? (
          <span style={{ fontSize: height * SMALL.abbrRatio, fontWeight: 800 }}>{abbr}</span>
        )}
      </div>
    );
  }

  if (size === 'middle') {
    return (
      <div
        role="img"
        aria-label={name}
        style={{
          ...pillStyle,
          gap: height * MIDDLE.gapRatio,
          paddingInlineEnd: height * MIDDLE.padEndRatio,
          paddingInlineStart: height * (hasIcon ? MIDDLE.padStartRatio : MIDDLE.padEndRatio),
        }}
        {...rest}
      >
        {iconSlot(MIDDLE.iconRatio)}
        <span style={{ fontSize: height * MIDDLE.abbrRatio, fontWeight: 800 }}>{abbr}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...pillStyle,
        gap: height * LARGE.gapRatio,
        paddingInlineEnd: height * LARGE.padEndRatio,
        paddingInlineStart: height * (hasIcon ? LARGE.padStartRatio : LARGE.padEndRatio),
      }}
      {...rest}
    >
      {iconSlot(LARGE.iconRatio)}
      <span style={{ ...TEXT_COLUMN_STYLE, gap: height * LARGE.linesGapRatio }}>
        <span style={{ fontSize: height * LARGE.abbrRatio, fontWeight: 800 }}>{abbr}</span>
        <span
          style={{
            fontSize: height * LARGE.nameRatio,
            fontWeight: 700,
            letterSpacing: NAME_LETTER_SPACING,
            textTransform: 'uppercase',
          }}
        >
          {name}
        </span>
      </span>
    </div>
  );
};
