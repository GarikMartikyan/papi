import { Layout, type SiderProps } from 'antd';
import type { ReactNode } from 'react';

import { BLOCK_RADIUS } from '../../../../constants/theme.constants';
import { useThemeToken } from '../../../../hooks/useThemeToken';

import { MainLayoutTrigger } from './MainLayoutTrigger';

/**
 * Насколько приглушена кнопка сворачивания на светлой навигации.
 *
 * Своё число, а не альфа из `colorTextTertiary`: там прозрачность вшита в цвет,
 * а иконке она нужна отдельно от него — см. `MainLayoutTriggerProps.opacity`.
 * Значение совпадает с альфой того токена, чтобы кнопка была приглушена
 * ровно так же, как второстепенный текст рядом.
 */
const MUTED_TRIGGER_OPACITY = 0.45;

/**
 * `collapsed`, `collapsedWidth`, `theme` и `width` есть и у `SiderProps`, но
 * объявлены заново обязательными: колонка ничего из этого не решает сама —
 * ширины и тему считает `MainLayout`, а состояние свёрнутости держит он же.
 * Дефолты antd тут дали бы колонку, которая выглядит собранной, а на деле не
 * знает, куда её поставили.
 */
export interface MainLayoutSiderProps extends SiderProps {
  collapsed: boolean;
  collapsedWidth: number;
  /**
   * Содержимое колонки под кнопкой — меню маршрутов слева, список ссылок
   * справа. Приходит готовым узлом, потому что колонка отвечает только за сам
   * блок: фон, скругление, отступы и кнопку. Знай она про оба вида списков, её
   * пришлось бы править при появлении третьего.
   */
  children?: ReactNode;
  /**
   * Отступ до соседних блоков. Приходит сверху, а не считается здесь: тем же
   * значением `MainLayout` отбивает контент, и разойдись они — просветы вокруг
   * колонок стали бы разной ширины.
   */
  gutter: number;
  /**
   * Не передан — кнопки сворачивания нет вовсе, и колонка показывает только
   * содержимое: так стоит колонка, которой управляют снаружи.
   */
  onToggle?: () => void;
  /**
   * С какого края страницы стоит колонка. От этого зависит только угол, в
   * который встаёт кнопка сворачивания: она держится внешнего края — у левой
   * колонки это правый угол, у правой левый. Прижатая к внутреннему краю, она
   * оказалась бы вплотную к контенту.
   */
  side: 'start' | 'end';
  theme: 'light' | 'dark';
  width: number;
}

/**
 * Колонка навигации — блок, лежащий на странице сбоку от контента.
 *
 * Один компонент на обе стороны: левая и правая колонки различаются только
 * содержимым, шириной и тем, есть ли у них кнопка. Собранные порознь, они
 * разъезжались бы при первой же правке фона или скругления.
 *
 * Состояние свёрнутости компонент не хранит — только показывает. Левой колонкой
 * управляет `config`-слайс, правой локальный стейт `MainLayout`. Оттуда же
 * приходит и то, как колонка стоит на странице: правая лежит поверх контента, и
 * позиционирует её `MainLayout` через `style`.
 */
export const MainLayoutSider = (props: MainLayoutSiderProps) => {
  const {
    children,
    collapsed,
    collapsedWidth,
    gutter,
    onToggle,
    side,
    style,
    theme,
    width,
    ...rest
  } = props;

  const token = useThemeToken();

  /*
   * Свёрнутая колонка узкая, и прижатая к краю кнопка в ней выглядит случайной,
   * поэтому там она встаёт по центру. Развёрнутая держит внешний край страницы —
   * см. `MainLayoutSiderProps.side`.
   */
  const isSideEnd = side === 'end';
  const expandedTriggerAlign = isSideEnd ? 'flex-start' : 'flex-end';
  const triggerAlign = collapsed ? 'center' : expandedTriggerAlign;

  /*
   * Фон колонки — `colorBgLayout`, то есть намеренно не дефолт antd: страница и
   * контент берут цвет контейнера, а колонки остаются на фоне сайдбара из темы
   * панели. Так страница читается как лист бумаги, на котором лежат блоки.
   */
  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      collapsedWidth={collapsedWidth}
      style={{
        overflow: 'auto',
        /*
         * Колонка не прилегает к краям, а лежит на фоне страницы отдельным
         * блоком. Отсюда и скругление — то же, что у карточек на той же
         * странице: см. `BLOCK_RADIUS`.
         */
        borderRadius: BLOCK_RADIUS,
        /*
         * Отступ с обеих сторон: блок не должен прилипать ни к краю окна, ни к
         * контенту — скругление у прижатого к краю блока не читается.
         */
        marginInlineStart: isSideEnd ? 0 : gutter,
        marginInlineEnd: !isSideEnd ? 0 : gutter,
        marginBottom: gutter,
        background: token.colorBgLayout,
        paddingBlock: token.paddingSM,
        ...style,
      }}
      theme={theme}
      trigger={null}
      width={width}
      {...rest}
    >
      {onToggle !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: triggerAlign,
            gap: token.paddingXS,
            paddingInline: collapsed ? 0 : token.paddingSM,
          }}
        >
          {/* Приглушённый цвет: кнопка служебная и не должна спорить за внимание
              с пунктами меню под ней. На тёмной навигации иконка остаётся в
              полную силу — там она и так на пределе контраста.

              Цвет непрозрачный, приглушает его `opacity`: почему прозрачность
              нельзя вшивать в цвет — см. `MainLayoutTrigger`. */}
          <MainLayoutTrigger
            collapsed={collapsed}
            color={theme === 'dark' ? token.colorTextLightSolid : token.colorTextBase}
            opacity={theme === 'dark' ? 1 : MUTED_TRIGGER_OPACITY}
            onToggle={onToggle}
          />
        </div>
      )}

      {children}
    </Layout.Sider>
  );
};
