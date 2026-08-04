import { Menu, type MenuProps } from 'antd';

import type { AsideLink } from '../MainLayout';

type MenuItem = NonNullable<MenuProps['items']>[number];

/**
 * `AsideLink` → элемент меню antd.
 *
 * Подпись оборачивается в настоящий `<a href>`, а не открывается обработчиком
 * через `window.open`: только у ссылки работают средний клик, «открыть в новом
 * окне», копирование адреса и наведение с адресом в строке состояния. Клик по
 * пункту попадает в неё же — antd растягивает подпись на всю строку.
 *
 * `rel` обязателен при `target="_blank"`: `noopener` не даёт открытой странице
 * добраться до нашей через `window.opener`, `noreferrer` вдобавок не отдаёт ей
 * адрес, с которого пришли.
 */
const toMenuItem = (item: AsideLink): MenuItem => ({
  key: item.href,
  icon: item.icon,
  label: (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {item.label}
    </a>
  ),
});

export interface MainLayoutLinksProps {
  items: readonly AsideLink[];
  theme?: MenuProps['theme'];
}

/**
 * Список внешних ссылок правой колонки.
 *
 * Меню, а не просто список тегов `<a>`: колонка сворачивается, и в свёрнутом
 * виде antd сам оставляет от пункта одну иконку и вешает на неё подпись
 * подсказкой. Свой список пришлось бы учить этому заново.
 *
 * `selectedKeys` намеренно пуст и не меняется: подсвечивать нечего — ссылка
 * уводит на чужой сайт, а панель остаётся на той же странице. Без этого antd
 * оставил бы последний нажатый пункт залитым, как будто мы на нём и находимся.
 */
export const MainLayoutLinks = (props: MainLayoutLinksProps) => {
  const { items, theme } = props;

  return (
    <Menu
      items={items.map(toMenuItem)}
      mode="inline"
      selectedKeys={[]}
      /*
       * Прозрачный фон и снятая правая граница — ровно как у меню маршрутов:
       * это одна и та же колонка, и различаться они здесь не должны. Почему
       * именно так — см. `MainLayoutNav`.
       */
      style={{ background: 'transparent', borderInlineEnd: 'none' }}
      theme={theme}
    />
  );
};
