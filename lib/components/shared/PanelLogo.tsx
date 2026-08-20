import { CircleStar, Mail, ShieldAlert } from 'lucide-react';
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
  Pick<LogoTemplateProps, 'color'>;

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
 */
export const panelLogos = {
  papi: {
    abbr: 'PAPI',
    name: 'Platform Admin Panel Init',
    icon: <CircleStar />,
  },
  rmp: {
    abbr: 'RMP',
    name: 'Risk Management Panel',
    icon: <ShieldAlert />,
  },
  mmp: {
    abbr: 'MMP',
    name: 'Message Management Panel',
    icon: <Mail />,
  },
} as const satisfies Record<string, PanelLogoBrand>;

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
 */
export const getPanelBrand = (): PanelLogoBrand | undefined => {
  return panelLogosByAbbr[getPanelAbbr()];
};

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
 * Пропсы `LogoTemplate` проходят насквозь и перекрывают запись — так панель,
 * которой нужен свой цвет или своя иконка на одном экране, получает их, не
 * заводя вторую запись в каталоге.
 */
export const PanelLogo = (props: PanelLogoProps) => {
  const { panel, ...rest } = props;

  const brand = panel === undefined ? getPanelBrand() : panelLogos[panel];

  return <LogoTemplate {...brand} {...rest} />;
};
