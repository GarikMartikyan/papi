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
 * Ширина колонки-столбика: свёрнутой левой и правой, которая другой и не
 * бывает. Уже, чем 80px по умолчанию у antd: в такой колонке остаются одни
 * иконки, и лишняя ширина вокруг них — пустое место.
 *
 * Значение одно на обе: столбик иконок с какой стороны ни поставь, а иконки в
 * нём одного размера.
 */
export const DEFAULT_SIDER_COLLAPSED_WIDTH = 48;
