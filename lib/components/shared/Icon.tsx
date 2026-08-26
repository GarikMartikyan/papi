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
  ComponentType<{ className?: string; style?: CSSProperties; 'aria-hidden'?: boolean }> | undefined
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
 * Своя иконка ставится маской, а не картинкой: файл задаёт форму, цвет даёт CSS
 * — заливка под маской. Так `color` и `currentColor` работают на ней ровно как
 * на именованных иконках: белой внутри пилюли логотипа, цвета текста в меню.
 *
 * Цена — цвета самого файла: от него остаётся силуэт. Для иконки это правильный
 * размен, она и должна краситься по месту; картинку, которая обязана сохранить
 * свои цвета, ставят обычным `<img>`, а не иконкой.
 *
 * Свойства парами с `-webkit-`: Safari до 15.4 знает только префиксную запись, а
 * в остальном они совпадают.
 */
const MASK_STYLE: CSSProperties = {
  display: 'inline-block',
  WebkitMaskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskPosition: 'center',
  maskRepeat: 'no-repeat',
  maskSize: 'contain',
};

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

/** Общая часть обоих видов `IconProps`. */
interface IconOwnProps {
  /** Класс на корневом узле иконки. */
  className?: string;
  /** Цвет иконки — любой, хоть из набора, хоть своей: см. `MASK_STYLE`. */
  color?: string;
  /**
   * Число — пиксели.
   *
   * @defaultValue `'1em'` — иконка наследует размер шрифта, как у antd.
   */
  size?: number | string;
  /** Стили на корневом узле — они ложатся поверх вычисленных. */
  style?: CSSProperties;
}

/**
 * Иконка задаётся одним из двух: именем из набора или файлом.
 *
 * Объединением, а не двумя необязательными полями: так `<Icon />` без того и
 * другого не собирается, а `<Icon name="mail" src={ball} />` не притворяется
 * осмысленным.
 *
 * @example
 * ```tsx
 * <Icon name="UserOutlined" />
 * <Icon name="columns-2" size={20} color="var(--accent)" />
 * <Icon src={ball} />
 * ```
 */
export type IconProps =
  | (IconOwnProps & {
      /**
       * Имя иконки — из любого набора: `UserOutlined` (antd), `Columns2` или
       * `columns-2` (lucide).
       *
       * Наборы не пересекаются: у antd все имена оканчиваются на `Outlined`,
       * `Filled` или `TwoTone`, поэтому одно имя всегда попадает ровно в один
       * набор.
       */
      name: string;
      /** Занят именем: иконка задаётся чем-то одним. */
      src?: never;
    })
  | (IconOwnProps & {
      /**
       * Своя иконка файлом — то, что вернул его импорт: `import ball from
       * './ball.svg'`, дальше `<Icon src={ball} />`.
       *
       * Для иконки, которой нет ни в одном наборе, — у панели она обычно
       * нарисована своя. От файла берётся форма, цвет задаётся снаружи, как и
       * у именованных: рядом с ними такая иконка ведёт себя так же.
       */
      src: string;
      /** Занят файлом: иконка задаётся чем-то одним. */
      name?: never;
    });

/**
 * Иконка по имени — из antd или lucide — либо своя, файлом через `src`.
 *
 * Нужна, чтобы иконку можно было задать данными: в конфиге, в ответе API, в
 * списке пунктов меню — там, где импортировать компонент неоткуда. `src`
 * добавляет к этому свою картинку: одна запись каталога рисуется `<Icon
 * name="shield-alert" />`, соседняя — `<Icon src={ball} />`, и место вызова
 * разницы не замечает.
 *
 * Имени нет ни в одном наборе — вернёт `null` и напишет в консоль: иконка не то,
 * ради чего стоит ронять экран.
 *
 * Декоративная: `aria-hidden` стоит на ней всегда, подпись несёт кнопка или
 * пункт меню вокруг неё.
 *
 * @example
 * ```tsx
 * // Иконка раздела приходит данными — именем в `PapiRoute.iconName`:
 * { path: '/users', element: <UsersPage />, iconName: 'Users' }
 * ```
 */
export const Icon = (props: IconProps) => {
  const { className, color, size = DEFAULT_SIZE, style } = props;

  /* Ветками по `props`, а не по разобранным полям: деструктуризация теряет связь
     между `src` и `name`, и после неё TypeScript не знает, что второе есть,
     когда первого нет. */
  if (props.src !== undefined) {
    /* Адрес в кавычках: в разработке импорт файла возвращает не путь, а data-URI
       с разметкой внутри, и без них `url()` разорвался бы на первом же символе,
       который в адресе не ждут. */
    const mask = `url("${props.src}")`;

    return (
      // aria-hidden — как у lucide ниже: иконка декоративная.
      <span
        aria-hidden
        className={className}
        style={{
          ...MASK_STYLE,
          WebkitMaskImage: mask,
          backgroundColor: color ?? 'currentColor',
          height: size,
          maskImage: mask,
          width: size,
          ...style,
        }}
      />
    );
  }

  const { name } = props;

  const AntdIcon = ANTD_ICONS[name];

  if (AntdIcon !== undefined) {
    /* antd рисует иконку шрифтом, поэтому размер и цвет идут стилями. aria-hidden
       здесь ещё и перебивает `aria-label` с именем иконки, который antd ставит сам:
       без него иконка в кнопке без текста читалась бы вслух дважды. */
    return (
      <AntdIcon aria-hidden className={className} style={{ fontSize: size, color, ...style }} />
    );
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
