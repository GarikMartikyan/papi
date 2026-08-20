import { Card, type CardProps, Space } from 'antd';
import type { CSSProperties } from 'react';

import logoLarge from '../../../assets/images/logo-large.svg';
import { LocaleSelect } from '../../shared/LocaleSelect';
import { PanelLogo } from '../../shared/PanelLogo';
import { ThemeSwitcher } from '../../shared/ThemeSwitcher';

import { AuthBackground } from './elements/AuthBackground';

/**
 * Ширина карточки. Вход, восстановление, смена пароля — это два-три поля, и
 * шире они только растягиваются впустую.
 */
const CARD_WIDTH = 360;

/**
 * Высота знака панели над карточкой: он на этом экране главный, поэтому заметно
 * крупнее картинки в углу.
 */
const PANEL_LOGO_HEIGHT = 40;

/**
 * Высота картинки в углу. Пропорции логотипа ядра — 124:49, поэтому от высоты
 * считается и ширина, а не задаётся вторым числом.
 */
const CORNER_LOGO_HEIGHT = 50;

/**
 * Отступ угловых блоков от края — картинки слева, языка с темой справа. Он же
 * поле страницы: в углу и в потоке содержимое стоит на одной линии.
 */
const CORNER_INSET = 24;

/**
 * Тень логотипов. И картинка в углу, и знак над карточкой стоят прямо на кадре,
 * без своей подложки, — на светлом участке фото без тени они теряются.
 */
const LOGO_SHADOW = 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.55))';

/**
 * Своя высота на весь экран: входные страницы стоят вне `MainLayout`, а тот
 * держит `100vh` сам. Без неё карточка прижалась бы к верхнему краю.
 *
 * `overflow: hidden` — ради фона: он лежит абсолютом на всю страницу, и на
 * коротком экране его нижний край дал бы прокрутку у пустого места.
 */
const PAGE_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  overflow: 'hidden',
  padding: CORNER_INSET,
  position: 'relative',
};

/**
 * Логотип и карточка одной колонкой.
 *
 * `position: relative` обязателен: фон позиционирован, и без своего слоя
 * содержимое ушло бы под него — абсолют рисуется поверх обычного потока.
 */
const CONTENT_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  maxWidth: CARD_WIDTH,
  position: 'relative',
  width: '100%',
};

/**
 * Матовое стекло: полупрозрачная заливка и размытие того, что под ней. Общее у
 * карточки и у контролов в углу.
 *
 * Заливка задаётся здесь, а не берётся из `colorBgContainer`: тот у карточек
 * непрозрачный, а стеклу нужна как раз просвечивающая — под ней кадр.
 *
 * `light-dark()` — по режиму документа: его ставит `ThemeProvider` в
 * `color-scheme` на <html>, и стиль остаётся статичной константой, без хука и
 * ререндера на смене темы. Та же причина, что и у `BLOCK_BG` в
 * `theme.constants`.
 *
 * `WebkitBackdropFilter` рядом со стандартным свойством нужен Safari — без него
 * там останется одна заливка, без размытия.
 */
const GLASS: CSSProperties = {
  WebkitBackdropFilter: 'blur(20px)',
  backdropFilter: 'blur(20px)',
  background: 'light-dark(rgba(255, 255, 255, 0.56), rgba(10, 12, 18, 0.55))',
  border: '1px solid light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.14))',
};

const CARD_STYLE: CSSProperties = {
  ...GLASS,
  boxShadow: '0 24px 60px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.45))',
  width: CARD_WIDTH,
};

/**
 * Верхняя полоса: картинка слева, язык с темой справа — там же, где их держит
 * шапка каркаса.
 *
 * Абсолютом, а не первой строкой колонки: карточка должна стоять по центру
 * экрана, а не съезжать вниз на высоту этой полосы.
 *
 * Полоса одна на оба угла, а не два абсолюта порознь: `align-items: center`
 * ставит кнопки по середине картинки сам, какой бы высоты та ни оказалась.
 * Прижатые каждый к своему углу, они разъезжались бы на разницу высот —
 * картинка 36, кнопки `controlHeight` темы.
 */
const HEADER_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  insetBlockStart: CORNER_INSET,
  insetInline: CORNER_INSET,
  justifyContent: 'space-between',
  position: 'absolute',
  zIndex: 1,
};

/**
 * Картинка в левом углу полосы.
 *
 * `display: block` убирает зазор под ней: строчной картинке остаётся место под
 * базовую линию, и по центру полосы она встала бы со сдвигом вверх.
 */
const CORNER_LOGO_STYLE: CSSProperties = {
  display: 'block',
  filter: LOGO_SHADOW,
};

/**
 * Знак над карточкой. Одна тень: `display` ему не задаётся — пилюля стоит на
 * своём `inline-flex`, и заменить его блоком значит разложить её содержимое.
 */
const PANEL_LOGO_STYLE: CSSProperties = {
  filter: LOGO_SHADOW,
};

export interface AuthLayoutProps extends CardProps {
  /**
   * Картинка в левом верхнем углу — путь к файлу. По умолчанию логотип ядра.
   *
   * Проп, а не жёстко зашитый файл: `lib/` в панелях read-only, поэтому
   * подменить сам ассет там нельзя, а бренд на входном экране у каждой панели
   * свой.
   */
  logo?: string;
}

/**
 * Каркас входных страниц: вход, восстановление пароля, приглашение.
 *
 * Кадры на весь экран, картинка и тема с языком по углам, знак панели и
 * стеклянная карточка по центру — странице остаётся её содержимое:
 *
 * ```
 * ┌──────────────────────────────────────────┐
 * │ ▄▄▄▄                       [тема] [язык] │
 * │                (● RMP)                   │
 * │              ┌─────────┐                 │
 * │              │  title  │                 │
 * │              │ children│                 │
 * │              └─────────┘                 │
 * └──────────────────────────────────────────┘
 * ```
 *
 * Знак над карточкой — `PanelLogo` без пропсов, то есть логотип панели этого
 * окружения: буквы, имя и иконку он находит сам по `VITE_APP_ABBR`. Настраивать
 * его тут нечем и незачем — панель, которой он не нужен, ставит свою страницу
 * входа без этого каркаса.
 *
 * Карточка входит в каркас, а не остаётся за страницей: у всех входных страниц
 * она одна и та же — те же стекло, ширина и тень, — и вынесенная наружу
 * повторялась бы в каждой. Поэтому база пропсов у каркаса — `CardProps`:
 * `title`, `styles`, `extra` и всё остальное уходит прямо в неё, а `children`
 * встают её содержимым.
 *
 * Каркас — обёртка, а не маршрут с `Outlet`: страница ставит его сама. Так своя
 * страница входа панели (`loginElement` у `PapiRouter`) не оказывается насильно
 * внутри обрамления ядра.
 *
 * Про вход ничего не знает: ни формы, ни запроса, ни редиректа — всё это
 * остаётся страницам.
 */
export const AuthLayout = (props: AuthLayoutProps) => {
  const { children, logo = logoLarge, style, ...rest } = props;

  return (
    <div style={PAGE_STYLE}>
      <AuthBackground />

      <div style={HEADER_STYLE}>
        {/* alt пустой намеренно: логотип декоративный, а своих строк ядро не
            возит — подпись на чужом языке была бы хуже её отсутствия. */}
        <img src={logo} alt="" height={CORNER_LOGO_HEIGHT} style={CORNER_LOGO_STYLE} />

        {/* Порядок как в шапке каркаса: сначала тема, следом язык.

            Язык кнопкой, а не списком: рядом стоит круглая кнопка темы, и поле в
            140px тянуло бы угол вширь ради названия, которое и так видно в меню. */}
        <Space size="middle">
          <ThemeSwitcher style={GLASS} />
          <LocaleSelect variant="button" style={GLASS} />
        </Space>
      </div>

      <div style={CONTENT_STYLE}>
        {/* `large` — со второй строкой: над карточкой знак читается как заголовок
            экрана, и имя панели в нём объясняет три буквы аббревиатуры. */}
        <PanelLogo size="large" height={PANEL_LOGO_HEIGHT} style={PANEL_LOGO_STYLE} />

        <Card style={{ ...CARD_STYLE, ...style }} {...rest}>
          {children}
        </Card>
      </div>
    </div>
  );
};
