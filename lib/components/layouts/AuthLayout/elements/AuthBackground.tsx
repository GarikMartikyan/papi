import type { CSSProperties, HTMLAttributes } from 'react';

import loginFirst from '../../../../assets/images/login-1.jpg';
import loginSecond from '../../../../assets/images/login-2.jpg';

/** Доля экрана под кадр, %. Пополам: кадров два, и оба одинаково важны. */
const HALF = 50;

/**
 * Насколько кадры заходят друг на друга, % ширины экрана.
 *
 * Стык двух картинок — это встык бликующий газон и тёмный стол, и никакое
 * затемнение поверх такую границу не прячет: оно гасит обе стороны, сохраняя
 * разницу между ними. Поэтому кадры перекрываются, а верхний проявляется из
 * прозрачности — на месте шва получается плавный переход.
 */
const OVERLAP = 8;

/** Где кончается левый кадр и начинается правый, % ширины экрана. */
const SEAM = `${HALF - OVERLAP}%`;

/**
 * Маска верхнего кадра: прозрачная у левого края и полностью непрозрачная за
 * зоной наезда. Доля считается от ширины самого слоя, а не экрана.
 */
const FADE = Math.round(((OVERLAP * 2) / (HALF + OVERLAP)) * 100);
const SEAM_MASK = `linear-gradient(90deg, transparent 0%, #000 ${FADE}%)`;

/** Общая подложка: слой занимает весь родитель. */
const LAYER_STYLE: CSSProperties = {
  inset: 0,
  position: 'absolute',
};

/** Кадр во всю высоту. Обрезка небольшая: доля экрана близка к форме картинок. */
const HALF_STYLE: CSSProperties = {
  ...LAYER_STYLE,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
};

/**
 * Затемнение поверх кадров.
 *
 * Полоса по центру — главный слой: на ней стоит карточка, а кадрам по краям от
 * неё она даёт отступить на задний план.
 *
 * По краям затемнение слабое намеренно: кадры брендовые, и ровный плотный тон
 * убил бы и зелень газона, и красный фишки. Второй слой добавляет лёгкую рамку
 * сверху и снизу, чтобы кадр не обрывался по краю экрана.
 *
 * В светлой теме те же слои вдвое слабее: под тёмной карточкой полоса работает
 * подложкой, а под светлой — ямой, из которой карточка торчит. Контраст там
 * держит сама карточка, и фону остаётся быть светлее.
 *
 * `light-dark()`, а не два значения по режимам и хук: режим браузер берёт из
 * `color-scheme` на <html>, его ставит `ThemeProvider`, — так стили остаются
 * статичными константами, а смена темы не гонит компонент на ререндер. Та же
 * причина, что и у `BLOCK_BG` в `theme.constants`.
 */
const SCRIM =
  'linear-gradient(90deg,' +
  ' light-dark(rgba(3, 6, 14, 0.12), rgba(3, 6, 14, 0.22)) 0%,' +
  ' light-dark(rgba(3, 6, 14, 0.14), rgba(3, 6, 14, 0.24)) 30%,' +
  ' light-dark(rgba(3, 6, 14, 0.42), rgba(3, 6, 14, 0.8)) 50%,' +
  ' light-dark(rgba(3, 6, 14, 0.14), rgba(3, 6, 14, 0.24)) 70%,' +
  ' light-dark(rgba(3, 6, 14, 0.12), rgba(3, 6, 14, 0.22)) 100%),' +
  'linear-gradient(180deg,' +
  ' light-dark(rgba(3, 6, 14, 0.24), rgba(3, 6, 14, 0.4)) 0%,' +
  ' light-dark(rgba(3, 6, 14, 0.05), rgba(3, 6, 14, 0.1)) 45%,' +
  ' light-dark(rgba(3, 6, 14, 0.28), rgba(3, 6, 14, 0.45)) 100%)';

export type AuthBackgroundProps = HTMLAttributes<HTMLDivElement>;

/**
 * Фон входных экранов: две брендовые картинки, поделившие экран пополам.
 *
 * Обе видны всегда — ни смены, ни жребия: доля экрана по форме почти совпадает
 * с самими картинками, поэтому от каждой видно её целиком, а не вырезанный
 * кусок середины.
 *
 * Слои абсолютом, а не колонками флекса: колонки встают встык, а этим нужен
 * наезд друг на друга — см. `OVERLAP`.
 */
export const AuthBackground = (props: AuthBackgroundProps) => {
  const { style, ...rest } = props;

  return (
    <div
      aria-hidden
      style={{ ...LAYER_STYLE, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, ...style }}
      {...rest}
    >
      <div style={{ ...HALF_STYLE, backgroundImage: `url(${loginFirst})`, insetInlineEnd: SEAM }} />

      {/* `WebkitMaskImage` рядом со стандартным свойством нужен Safari. */}
      <div
        style={{
          ...HALF_STYLE,
          WebkitMaskImage: SEAM_MASK,
          backgroundImage: `url(${loginSecond})`,
          insetInlineStart: SEAM,
          maskImage: SEAM_MASK,
        }}
      />

      <div style={{ ...LAYER_STYLE, background: SCRIM }} />
    </div>
  );
};
