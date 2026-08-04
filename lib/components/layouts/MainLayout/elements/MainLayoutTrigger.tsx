import { Button } from 'antd';

import { PAPI_MESSAGES } from '../../../../constants/messages.constants';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Icon } from '../../../shared/Icon';

/**
 * Иконка одна на оба состояния: она обозначает саму колонку навигации, а не
 * направление, в котором та поедет. Меняющаяся стрелка обещала бы, что кнопка
 * делает разное, — а она делает одно.
 */
const ICON_NAME = 'columns-2';

export interface MainLayoutTriggerProps {
  /** Свёрнута ли колонка, которой управляет кнопка. Уходит в `aria-expanded`. */
  collapsed: boolean;
  onToggle: () => void;
  /**
   * Цвет иконки: на тёмной навигации кнопка antd по умолчанию не видна. Цвет
   * нужен непрозрачный — приглушает иконку `opacity`.
   */
  color?: string;
  /**
   * Приглушённость иконки, 0..1.
   *
   * Отдельным числом, а не альфой в `color`: иконка нарисована двумя штрихами,
   * и перекладина упирается концами в рамку. Полупрозрачная обводка в этих
   * местах складывается сама с собой, и стыки выходят темнее остальной линии.
   * `opacity` же браузер применяет к отрисованной иконке целиком, поэтому
   * перекрытий в ней не видно.
   */
  opacity?: number;
}

/**
 * Кнопка сворачивания навигации.
 *
 * Живёт в самой навигации, а не в шапке: сворачивает она её, и рядом с ней же
 * понятнее, к чему относится.
 *
 * Состояние приходит пропсами, а не читается из стора: колонок с такой кнопкой
 * две, и хранятся они по-разному — левая в `config`-слайсе, правая в локальном
 * стейте `MainLayout`. Кнопка, знающая про стор, умела бы сворачивать только
 * первую.
 *
 * А вот `aria-label` пропом не приходит: видимого текста у кнопки нет, и подпись
 * она берёт из строк ядра сама — панели передавать её больше не нужно.
 */
export const MainLayoutTrigger = (props: MainLayoutTriggerProps) => {
  const { collapsed, color, onToggle, opacity } = props;

  const t = useTranslation();

  return (
    <Button
      type="text"
      aria-label={t(PAPI_MESSAGES.layoutToggleSidebar)}
      aria-expanded={!collapsed}
      // `opacity` на иконке, а не на кнопке: на кнопке она приглушила бы заодно
      // и подсветку фона под курсором.
      icon={<Icon name={ICON_NAME} style={{ opacity }} />}
      style={{ color }}
      onClick={onToggle}
    />
  );
};
