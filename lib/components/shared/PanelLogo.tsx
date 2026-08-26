import { CircleStar, Mail, ShieldAlert } from 'lucide-react';
import { Link, useInRouterContext } from 'react-router';

import { getPanelAbbr } from '../../services/env.service';

import { LogoTemplate, type LogoTemplateProps } from './LogoTemplate';

/**
 * Лицо панели: то, чем логотип одной панели отличается от логотипа другой.
 *
 * Поля взяты у пропсов `LogoTemplate`, а не перечислены заново: перечисленные, они
 * разошлись бы с ним молча. Обязательны здесь имя, аббревиатура и иконка — без
 * них запись бессмысленна; цвет необязателен, без него логотип красный.
 *
 * Размеров в записи нет: одна и та же панель показывается и в шапке, и на
 * входе, поэтому `size` с `height` задаются в месте вызова.
 */
export type PanelLogoBrand = Required<Pick<LogoTemplateProps, 'abbr' | 'icon' | 'name'>> &
  Pick<LogoTemplateProps, 'color'> & {
    /**
     * Где панель живёт. Нужен колонке соседей: логотип там — ссылка, и вести ей
     * некуда, если адреса в записи нет.
     */
    url: string;
  };

/**
 * Панели, собранные на papi, и их логотипы. Ключ — короткое имя панели, оно же
 * аббревиатура из `.env` строчными: `VITE_APP_ABBR=RMP` — запись `rmp`.
 *
 * В ядре, а не в каждой панели: имя, аббревиатура и иконка — ровно то, чем
 * панели отличаются друг от друга, и собранные в одном месте они не расходятся
 * между клонами. Новая панель дописывается сюда и приезжает к остальным обычным
 * `git merge upstream/main`.
 *
 * Рядом с компонентом, а не в `constants/`: иконка — это разметка, и в `.ts`
 * её не написать. Здесь же она пишется как обычно — `<TriangleAlert />`.
 * Нарисованная своя ставится тем же `Icon`: `<Icon src={ball} />`, где `ball` —
 * импорт файла из `assets/icons/panels/`.
 *
 * Цвет у записи можно опустить: без него `LogoTemplate` берёт `PAPI_LOGO_COLOR`.
 * У RMP он и опущен — красный ядра и есть её цвет.
 *
 * Адреса пока заглушки: панели ещё не задеплоены, а поле обязательное — пустая
 * строка вместо адреса дала бы ссылку в никуда, и молча.
 *
 * @example
 * ```tsx
 * // Своя запись дописывается сюда же, в репозитории papi:
 * ep: { abbr: 'EP', name: 'Example Panel', icon: <Icon src={ball} />, url: '…' }
 * ```
 */
export const panelLogos = {
  papi: {
    abbr: 'PAPI',
    name: 'Platform Admin Panel Init',
    icon: <CircleStar />,
    url: 'https://papi.example.com',
  },
  rmp: {
    abbr: 'RMP',
    name: 'Risk Management Panel',
    icon: <ShieldAlert />,
    url: 'https://rmp.example.com',
  },
  mmp: {
    abbr: 'MMP',
    name: 'Message Management Panel',
    icon: <Mail />,
    url: 'https://mmp.example.com',
  },
} as const satisfies Record<string, PanelLogoBrand>;

/** Куда ведёт свой логотип: корень панели, он же её первая страница. */
const ROOT_ROUTE = '/';

/** Короткие имена панелей из каталога — то, что принимает проп `panel`. */
export type PanelName = keyof typeof panelLogos;

/**
 * Тот же каталог, открытый для чтения по любому ключу.
 *
 * Ключ по умолчанию приходит из `.env`, а там аббревиатура своя у каждой панели:
 * `EP` даст `ep`, которого в каталоге нет. Через эту запись промах виден типам —
 * чтение возвращает `undefined`, и обработать его приходится здесь, а не
 * встретить на рендере.
 */
const panelLogosByAbbr: Record<string, PanelLogoBrand | undefined> = panelLogos;

/**
 * Запись каталога для панели этого окружения — по `VITE_APP_ABBR`. Панели в
 * каталоге нет — `undefined`.
 *
 * Наружу, потому что лицо панели нужно не одному логотипу: иконку отсюда берёт
 * и знак во вкладке (`setFavicon` зовёт `PapiProvider`), а нарисовать её второй
 * раз картинкой значило бы завести второй источник правды.
 *
 * @returns Запись своей панели или `undefined`, если её аббревиатуры в каталоге
 * нет.
 */
export const getPanelBrand = (): PanelLogoBrand | undefined => {
  return panelLogosByAbbr[getPanelAbbr()];
};

/** Запись каталога вместе с её ключом — так список панелей знает, чей знак рисует. */
export interface PanelEntry extends PanelLogoBrand {
  /** Короткое имя панели — ключ записи в `panelLogos`. */
  panel: PanelName;
}

/**
 * Панели каталога, кроме этой, — список для колонки соседей.
 *
 * Своя из него убрана: человек уже в ней, и ссылка вела бы туда, где он стоит.
 * Панели, которой в каталоге нет, это не мешает — тогда в списке просто все.
 *
 * @returns Записи каталога вместе с ключами — имя, аббревиатура, иконка, цвет и
 * адрес каждой соседней панели.
 * @example
 * ```tsx
 * // Так собрана правая колонка каркаса:
 * getOtherPanels().map(({ panel, url }) => (
 *   <a key={panel} href={url}>
 *     <PanelLogo panel={panel} size="small" />
 *   </a>
 * ));
 * ```
 */
export const getOtherPanels = (): readonly PanelEntry[] => {
  const current = getPanelAbbr();

  return (Object.keys(panelLogos) as PanelName[])
    .filter((panel) => panel !== current)
    .map((panel) => ({ panel, ...panelLogos[panel] }));
};

/**
 * Пропсы `PanelLogo`: выбор панели плюс все пропсы `LogoTemplate` — они
 * перекрывают запись каталога.
 */
export interface PanelLogoProps extends LogoTemplateProps {
  /**
   * Чей логотип показать. Запись берётся из `panelLogos`.
   *
   * Не передан — панель определяется по `VITE_APP_ABBR`, то есть своя. Проп
   * нужен там, где показывается чужой логотип: витрина, список панелей.
   */
  panel?: PanelName;
}

/**
 * Логотип панели из каталога: `<PanelLogo size="middle" />`.
 *
 * Тонкая обёртка над `LogoTemplate`: вся геометрия и все размеры — там, здесь
 * только подстановка имени, аббревиатуры и иконки по короткому имени панели.
 * Смысл в том, чтобы места вызова не таскали за собой брендовые строки: панель
 * называется один раз, в каталоге выше.
 *
 * Своё имя панель не называет и в вызове: без пропа `panel` запись ищется по
 * `VITE_APP_ABBR` — по тому же `.env`, откуда логотип берёт буквы и имя, когда
 * записи нет. Так `<PanelLogo />` в шапке панели показывает её же логотип, и
 * менять вызовы при переезде ядра в новую панель не приходится.
 *
 * Записи под аббревиатуру может и не быть — панель новая или буквы у неё свои.
 * Подставлять тогда нечего, и `LogoTemplate` рисует пилюлю с буквами и именем
 * из окружения, без иконки.
 *
 * Свой логотип ведёт на корень панели — туда, куда ведёт логотип на любом сайте.
 * Чужой не ведёт никуда: он показывает, а куда по нему идти, решает место
 * вызова — колонка соседей, например, оборачивает его ссылкой на чужой адрес.
 *
 * Пропсы `LogoTemplate` проходят насквозь и перекрывают запись — так панель,
 * которой нужен свой цвет или своя иконка на одном экране, получает их, не
 * заводя вторую запись в каталоге.
 *
 * @example
 * ```tsx
 * <PanelLogo size="middle" height={32} />
 * <PanelLogo panel="rmp" size="small" />
 * ```
 */
export const PanelLogo = (props: PanelLogoProps) => {
  const { panel, ...rest } = props;

  /* Роутер ставит `PapiProvider`, но панель вправе собрать провайдеры сама и без
     него — вне роутера `Link` бросается, поэтому логотип там остаётся картинкой. */
  const inRouter = useInRouterContext();

  const isOwn = panel === undefined;
  const brand = isOwn ? getPanelBrand() : panelLogos[panel];

  /* Адрес — про панель, а не про её знак: оставленный в записи, он ушёл бы через
     `LogoTemplate` прямо в разметку атрибутом `url`. */
  const { url: _url, ...logo } = brand ?? {};

  const logoTemplate = <LogoTemplate {...logo} {...rest} />;

  if (!isOwn || !inRouter) return logoTemplate;

  /* `inline-flex`, а не строчная ссылка по умолчанию: под текстовой строкой у
     логотипа осталось бы место под нижние выносные, и в шапке он встал бы выше
     середины. */
  return (
    <Link to={ROOT_ROUTE} style={{ display: 'inline-flex' }}>
      {logoTemplate}
    </Link>
  );
};
