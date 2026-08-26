import { useEffect, useRef } from 'react';

import { setFavicon } from '../../utils/favicon.util';

import { PAPI_LOGO_COLOR } from './LogoTemplate';
import { getPanelBrand } from './PanelLogo';

/** Скрытый слот: иконка нужна отрисованной, но не на экране. */
const SLOT_STYLE = { display: 'none' } as const;

/**
 * Знак панели во вкладке браузера: иконка из каталога `panelLogos` на круге её
 * цвета.
 *
 * Компонент, а не эффект в провайдере, потому что иконка в каталоге — JSX, а во
 * вкладку она уходит строкой. Отрисовать её один раз скрытой и снять разметку с
 * DOM (`setFavicon`) дешевле, чем тянуть в бандл серверный рендер React: тот
 * прибавляет к панели полсотни килобайт ради одной строки.
 *
 * Ставит его `PapiProvider`. Панели, которой в каталоге нет, ставить нечего:
 * компонент не рисует ничего, а во вкладке остаются буквы из `index.html`.
 *
 * Один раз на загрузку: знак собирается из окружения и от стейта не зависит.
 *
 * На экране его нет — компонент рисует скрытый узел, из которого снимается
 * разметка иконки.
 *
 * @example
 * ```tsx
 * // Нужен только там, где панель собирает провайдеры сама:
 * <StoreProvider>
 *   <PanelFavicon />
 *   <I18nProvider i18n={i18n}>{children}</I18nProvider>
 * </StoreProvider>
 * ```
 */
export const PanelFavicon = () => {
  const ref = useRef<HTMLSpanElement>(null);

  const brand = getPanelBrand();

  useEffect(() => {
    /* Сначала разметка иконки, а если её нет — сам узел: файловая иконка стоит
       маской на пустом `<span>`, и `<svg>` внутри у неё не будет. */
    const icon = ref.current?.querySelector('svg') ?? ref.current?.firstElementChild;

    if (icon === null || icon === undefined) return;

    /* Без ожидания: файловая иконка дочитывается с сервера, но ставить её
       некуда торопиться — во вкладке до тех пор стоят буквы из `index.html`. */
    void setFavicon(icon, brand?.color ?? PAPI_LOGO_COLOR);
  }, [brand?.color]);

  if (brand === undefined) return null;

  return (
    <span ref={ref} aria-hidden style={SLOT_STYLE}>
      {brand.icon}
    </span>
  );
};
