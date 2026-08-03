import * as antdIcons from '@ant-design/icons';
import * as lucideIcons from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

import { warn } from '../../utils/logger.util';

/**
 * Наборы иконок берутся целиком, а не по одной.
 *
 * Плата за выбор по имени: бандлер не может выбросить неиспользуемые иконки —
 * какая понадобится, известно только в рантайме. Для админки за логином это
 * обычно приемлемо; если вес станет важен, набор придётся сузить до явного
 * реестра нужных иконок.
 */
const ANTD_ICONS = antdIcons as unknown as Record<
  string,
  ComponentType<{ className?: string; style?: CSSProperties }> | undefined
>;

const LUCIDE_ICONS = lucideIcons as unknown as Record<
  string,
  | ComponentType<{
      className?: string;
      color?: string;
      size?: number | string;
      style?: CSSProperties;
      'aria-hidden'?: boolean;
    }>
  | undefined
>;

/**
 * Размер по умолчанию — от размера шрифта, как у иконок antd. Иначе lucide
 * рисовал бы свои 24px рядом с 14px antd, и в одной строке они разъезжались бы.
 */
const DEFAULT_SIZE = '1em';

/** `columns-2` → `Columns2`. lucide экспортирует PascalCase, а пишут обычно kebab. */
const toPascalCase = (name: string): string =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Об одном и том же неизвестном имени сообщаем один раз, а не на каждый рендер. */
const reportedNames = new Set<string>();

const reportUnknown = (name: string): void => {
  if (reportedNames.has(name)) return;

  reportedNames.add(name);
  warn(`Unknown icon "${name}" — no such name in @ant-design/icons or lucide-react.`);
};

export interface IconProps {
  /**
   * Имя иконки — из любого набора: `UserOutlined` (antd), `Columns2` или
   * `columns-2` (lucide).
   *
   * Наборы не пересекаются: у antd все имена оканчиваются на `Outlined`,
   * `Filled` или `TwoTone`, поэтому одно имя всегда попадает ровно в один
   * набор.
   */
  name: string;
  className?: string;
  color?: string;
  /** Число — пиксели. По умолчанию иконка наследует размер шрифта. */
  size?: number | string;
  style?: CSSProperties;
}

/**
 * Иконка по имени — из antd или lucide.
 *
 * Нужна, чтобы иконку можно было задать данными: в конфиге, в ответе API, в
 * списке пунктов меню — там, где импортировать компонент неоткуда.
 *
 * Имени нет ни в одном наборе — вернёт `null` и напишет в консоль: иконка не то,
 * ради чего стоит ронять экран.
 */
export const Icon = (props: IconProps) => {
  const { className, color, name, size = DEFAULT_SIZE, style } = props;

  const AntdIcon = ANTD_ICONS[name];

  if (AntdIcon !== undefined) {
    // antd рисует иконку шрифтом, поэтому размер и цвет идут стилями.
    return <AntdIcon className={className} style={{ fontSize: size, color, ...style }} />;
  }

  const LucideIcon = LUCIDE_ICONS[name] ?? LUCIDE_ICONS[toPascalCase(name)];

  if (LucideIcon !== undefined) {
    return (
      // aria-hidden: иконка декоративная, подпись несёт кнопка вокруг неё.
      <LucideIcon aria-hidden className={className} color={color} size={size} style={style} />
    );
  }

  reportUnknown(name);

  return null;
};
