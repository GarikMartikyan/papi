import { ThemeMode } from '../types/enums/global.enum';

/*
 * Языка по умолчанию здесь нет намеренно: выделенного языка у ядра не осталось.
 * Запасной задаёт панель — `I18nConfig.default`, см. types/interfaces.
 */

/** Colour scheme used before a preference is expressed. */
export const DEFAULT_THEME_MODE = ThemeMode.LIGHT;

/** Sider starts expanded. */
export const DEFAULT_SIDEBAR_COLLAPSED = false;

/** Ширина левого сайдбара в развёрнутом состоянии. */
export const DEFAULT_SIDER_WIDTH = 220;

/**
 * Ширина свёрнутой колонки — и левой, и правой. Уже, чем 80px по умолчанию у
 * antd: в свёрнутой колонке остаются одни иконки, и лишняя ширина вокруг них —
 * пустое место.
 *
 * Значение одно на обе: свёрнутая колонка — это столбик иконок, а они одного
 * размера с какой стороны ни поставь.
 */
export const DEFAULT_SIDER_COLLAPSED_WIDTH = 48;

/**
 * Ширина правой колонки в развёрнутом виде. Шире левой: её пункты чаще
 * оказываются длиннее — это не короткие названия разделов, а операции.
 */
export const DEFAULT_ASIDE_WIDTH = 280;
