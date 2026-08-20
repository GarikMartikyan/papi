import { ShieldAlert } from 'lucide-react';

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
 * Панели, собранные на papi, и их логотипы. Ключ — короткое имя панели.
 *
 * В ядре, а не в каждой панели: имя, аббревиатура и иконка — ровно то, чем
 * панели отличаются друг от друга, и собранные в одном месте они не расходятся
 * между клонами. Новая панель дописывается сюда и приезжает к остальным обычным
 * `git merge upstream/main`.
 *
 * Рядом с компонентом, а не в `constants/`: иконка — это разметка, и в `.ts`
 * её не написать. Здесь же она пишется как обычно — `<TriangleAlert />`.
 *
 * Цвет у записи можно опустить: без него `LogoTemplate` берёт `PAPI_LOGO_COLOR`.
 * У RMP он и опущен — красный ядра и есть её цвет.
 */
export const panelLogos = {
  rmp: {
    abbr: 'RMP',
    name: 'Risk Management Panel',
    icon: <ShieldAlert />,
  },
} as const satisfies Record<string, PanelLogoBrand>;

/** Короткие имена панелей из каталога — то, что принимает проп `panel`. */
export type PanelName = keyof typeof panelLogos;

export interface PanelLogoProps extends LogoTemplateProps {
  /** Чей логотип показать. Запись берётся из `panelLogos`. */
  panel: PanelName;
}

/**
 * Логотип панели из каталога: `<PanelLogo panel="rmp" size="middle" />`.
 *
 * Тонкая обёртка над `LogoTemplate`: вся геометрия и все размеры — там, здесь
 * только подстановка имени, аббревиатуры и иконки по короткому имени панели.
 * Смысл в том, чтобы места вызова не таскали за собой брендовые строки: панель
 * называется один раз, в каталоге выше.
 *
 * Пропсы `LogoTemplate` проходят насквозь и перекрывают запись — так панель,
 * которой нужен свой цвет или своя иконка на одном экране, получает их, не
 * заводя вторую запись в каталоге.
 */
export const PanelLogo = (props: PanelLogoProps) => {
  const { panel, ...rest } = props;

  return <LogoTemplate {...panelLogos[panel]} {...rest} />;
};
