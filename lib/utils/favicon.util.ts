/**
 * Сторона холста. 64 — с запасом на любую вкладку: уменьшать иконку браузер
 * умеет, а увеличивать ему тут нечего.
 */
const CANVAS_SIZE = 64;

/**
 * Сторона иконки на холсте; остальное — поля вокруг неё.
 *
 * Почти во весь круг: на 16 пикселях вкладки иконка и так у предела
 * различимости, и поля там — чистая потеря. Больше 45 не поставить: в круг
 * радиусом 32 вписан квадрат стороной 45,2, и на большем углы иконки полезли бы
 * за края.
 */
const ICON_SIZE = 54;

/**
 * Цвет иконки — белый, как и всё поверх заливки в `LogoTemplate`.
 *
 * Задаётся явно, потому что иконки нарисованы через `currentColor`, а в
 * отдельном документе фавикона наследовать цвет неоткуда: там он чёрный.
 * Свойством `color` и заодно атрибутом `stroke` — первое покрывает иконки,
 * которые красятся заливкой, второе те, что нарисованы обводкой.
 */
const ICON_COLOR = '#fff';

const FAVICON_SELECTOR = 'link[rel="icon"]';

/** Ссылка на маску внутри знака — сам знак одноразовый, так что имя фиксировано. */
const MASK_ID = 'papi-favicon-icon';

/** Адрес внутри `url("…")` — тем и заканчивается вычисленная маска. */
const MASK_URL = /url\("(.+)"\)/;

const SVG_DATA_PREFIX = 'data:image/svg+xml';

/**
 * Адрес файла, которым нарисована иконка, или `null`, если иконка не файловая.
 *
 * Читается из вычисленного стиля, потому что файл в разметке не виден: `Icon`
 * ставит его маской, а не картинкой, — иначе цвет ему было бы не задать.
 */
const readSource = (icon: Element): string | null => {
  if (icon instanceof HTMLImageElement) return icon.src;

  const style = getComputedStyle(icon);

  return MASK_URL.exec(style.maskImage || style.webkitMaskImage)?.[1] ?? null;
};

/**
 * Вписывает `<svg>` иконки в холст: своя система координат у неё остаётся, а
 * `x`, `y`, `width` и `height` вложенного `<svg>` переносят её на место.
 *
 * `viewBox` подставляется из размеров, если его нет: без него вложенный `<svg>`
 * не масштабируется вовсе — иконка обрезалась бы своим левым верхним углом.
 */
const fitIcon = (icon: Element): void => {
  const inset = (CANVAS_SIZE - ICON_SIZE) / 2;

  if (!icon.hasAttribute('viewBox')) {
    const width = parseFloat(icon.getAttribute('width') ?? '');
    const height = parseFloat(icon.getAttribute('height') ?? '');

    if (!isNaN(width) && !isNaN(height)) icon.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  icon.setAttribute('x', String(inset));
  icon.setAttribute('y', String(inset));
  icon.setAttribute('width', String(ICON_SIZE));
  icon.setAttribute('height', String(ICON_SIZE));
};

/** Заливка круга, а на ней — переданная разметка. */
const wrapInCircle = (content: string, color: string): string => {
  const half = CANVAS_SIZE / 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">`,
    `<circle cx="${half}" cy="${half}" r="${half}" fill="${color}"/>`,
    content,
    '</svg>',
  ].join('');
};

/**
 * Знак из иконки набора: она нарисована через `currentColor`, поэтому просто
 * перекрашивается атрибутами и кладётся на круг.
 *
 * Копия, а не сам элемент со страницы: атрибуты тут проставляются под фавикон, и
 * на оригинале они испортили бы логотип, из которого иконку взяли.
 */
const buildFromNode = (icon: SVGSVGElement, color: string): string => {
  const copy = icon.cloneNode(true) as SVGSVGElement;

  fitIcon(copy);
  copy.setAttribute('color', ICON_COLOR);
  copy.setAttribute('stroke', ICON_COLOR);

  return wrapInCircle(new XMLSerializer().serializeToString(copy), color);
};

/**
 * Знак из файла: от файла берётся форма, цвет задаём мы — ровно то же, что
 * делает с ним маска в `Icon`, только средствами SVG.
 *
 * `mask-type: alpha` берёт в маску непрозрачные места файла, а не светлые: цвета
 * в нём свои, и по яркости чёрный мяч дал бы пустую маску. Под маской лежит
 * прямоугольник в цвет знака — он и виден сквозь неё.
 *
 * `null`, если файл не SVG: маску из png не собрать, и такой знак ставится во
 * вкладку как есть.
 */
const buildFromFile = (file: string, color: string): string | null => {
  const parsed = new DOMParser().parseFromString(file, 'image/svg+xml');
  const icon = parsed.documentElement;

  if (icon.tagName !== 'svg') return null;

  fitIcon(icon);

  return wrapInCircle(
    [
      `<mask id="${MASK_ID}" style="mask-type:alpha">`,
      new XMLSerializer().serializeToString(icon),
      '</mask>',
      `<rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${ICON_COLOR}" mask="url(#${MASK_ID})"/>`,
    ].join(''),
    color,
  );
};

/**
 * Адрес знака для вкладки. Файл ради него дочитывается с сервера — из разметки
 * его не собрать: внутри data-URI внешние ссылки не загружаются, поэтому иконка
 * должна попасть в знак содержимым.
 *
 * Не дочитался или оказался не вектором — ставим сам файл: знак без круга лучше,
 * чем буквы вместо иконки, которую панель себе нарисовала.
 */
const buildHref = async (icon: Element, color: string): Promise<string | null> => {
  if (icon instanceof SVGSVGElement) {
    return `${SVG_DATA_PREFIX},${encodeURIComponent(buildFromNode(icon, color))}`;
  }

  const source = readSource(icon);

  if (source === null) return null;

  const file = await fetch(source)
    .then((response) => response.text())
    .catch(() => null);

  if (file === null) return source;

  const markup = buildFromFile(file, color);

  return markup === null ? source : `${SVG_DATA_PREFIX},${encodeURIComponent(markup)}`;
};

/**
 * Ставит во вкладку знак: иконку на круге — тот же логотип, что `LogoTemplate`
 * рисует в размере `small`.
 *
 * Иконка приходит уже отрисованным узлом, а не элементом React: нарисована она
 * один раз, в каталоге `panelLogos`, и там это JSX — превратить его в строку
 * можно либо сервером React в бандле панели, либо вот так, со страницы. Второе
 * дешевле на полсотни килобайт, поэтому знак сначала рисуется скрытым (см.
 * `PanelFavicon`), а сюда приходит из DOM.
 *
 * Буквы из `index.html` этим не отменяются: они стоят во вкладке сразу, до
 * загрузки скриптов, а знак заменяет их, когда панели есть что показать.
 */
export const setFavicon = async (icon: Element, color: string): Promise<void> => {
  const href = await buildHref(icon, color);

  if (href === null) return;

  const link =
    document.querySelector<HTMLLinkElement>(FAVICON_SELECTOR) ?? document.createElement('link');

  link.rel = 'icon';
  link.href = href;

  /* Тип объявляем только своей разметке: у файла он свой, и `image/svg+xml` за
     него врал бы про png. */
  if (href.startsWith(SVG_DATA_PREFIX)) link.type = 'image/svg+xml';
  else link.removeAttribute('type');

  if (link.parentNode === null) document.head.append(link);
};
