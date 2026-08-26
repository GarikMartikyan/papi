import type { ThemeConfig } from 'antd';

import { BLOCK_BG, BLOCK_RADIUS } from '../constants/theme.constants';

/**
 * Полный радиус. Значение заведомо больше половины высоты любого контрола,
 * поэтому браузер обрезает его до идеальной пилюли на всех размерах сразу —
 * подбирать число под каждую высоту не нужно.
 */
const PILL = 999;

/** Радиусы для всех размеров контрола: default, small и large. */
const PILL_RADII = {
  borderRadius: PILL,
  borderRadiusSM: PILL,
  borderRadiusLG: PILL,
};

/**
 * То же, но без `borderRadiusLG`: у Select и DatePicker на нём держится не
 * контрол, а всплывающая панель — списки и календарь. Сделав его пилюлей, мы
 * скруглили бы выпадашку в овал.
 */
const PILL_RADII_WITH_POPUP = {
  borderRadius: PILL,
  borderRadiusSM: PILL,
};

/** Карточки, диалоги и всплывающие панели: мягкий прямоугольник, не пилюля. */
const CONTAINER_RADIUS = 16;

/**
 * Базовая тема ядра.
 *
 * `ThemeProvider` кладёт её под тему панели, поэтому панель передаёт только то,
 * что меняет, — свой `colorPrimary`, например, а не всю тему целиком.
 *
 * Скругления заданы по компонентам, а не одним глобальным `borderRadius`:
 * глобальный ушёл бы и в карточки, таблицы и диалоги, где пилюля не нужна.
 * antd применяет токен компонента поверх глобального, поэтому контейнеры
 * остаются на своих значениях.
 *
 * Руками её подключать не нужно: `ThemeProvider` кладёт её под тему панели сам.
 * Наружу она выходит ради панели, которой нужно прочитать значение ядра или
 * собрать свою тему поверх — для второго есть `createTheme`.
 *
 * @example
 * ```ts
 * const theme = mergeThemes(BASE_THEME, { token: { colorPrimary: '#7c3aed' } });
 * ```
 */
export const BASE_THEME: ThemeConfig = {
  token: {
    colorPrimary: '#4f46e5',
    borderRadius: 10,
    borderRadiusLG: CONTAINER_RADIUS,
    borderRadiusSM: 8,
    borderRadiusXS: 6,
    colorBgLayout: 'light-dark(rgba(238, 238, 238, 1), rgba(0, 0, 0, 1))',
  },
  components: {
    Button: PILL_RADII,
    Input: PILL_RADII,
    InputNumber: PILL_RADII,
    Select: PILL_RADII_WITH_POPUP,
    DatePicker: PILL_RADII_WITH_POPUP,
    Tag: { borderRadiusSM: PILL },
    Segmented: PILL_RADII,
    /*
     * Оба токена — про строки одного и того же списка: `itemBorderRadius` про
     * обычный пункт, `subMenuItemBorderRadius` про тот, что раскрывает подменю.
     * Порознь они дают в одном столбце пилюлю и прямоугольник, поэтому значение
     * одно на оба. Всплывающей панели подменю это не касается — у неё свой
     * `borderRadiusLG`.
     */
    Menu: { itemBorderRadius: PILL, subMenuItemBorderRadius: PILL },
    Card: { colorBgContainer: BLOCK_BG, borderRadiusLG: BLOCK_RADIUS },
  },
};
