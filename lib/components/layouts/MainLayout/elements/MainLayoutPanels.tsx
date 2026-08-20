import { Space, Tooltip } from 'antd';

import { type PanelEntry, PanelLogo } from '../../../shared/PanelLogo';

/**
 * Высота знака. Ниже дефолтных 32 у `small`: полоса узкая, и круг во всю её
 * ширину читался бы кнопкой, а не значком в списке.
 */
const LOGO_HEIGHT = 28;

export interface MainLayoutPanelsProps {
  items: readonly PanelEntry[];
}

/**
 * Соседние панели правой колонки — логотипами, а не пунктами меню.
 *
 * Логотип тут и есть подпись: панели различают по знаку, а не по названию, а
 * размер `small` — как раз знак без слов, круг с одной иконкой.
 *
 * Ссылки настоящие, с `href`: только у них работают средний клик, «открыть в
 * новом окне» и копирование адреса. `rel` обязателен при `target="_blank"` —
 * `noopener` не даёт открытой странице добраться до нашей через `window.opener`,
 * `noreferrer` вдобавок не отдаёт ей адрес, с которого пришли.
 *
 * Подсказка с полным именем нужна тем более: в круге видна одна иконка, и по ней
 * панель узнаёт только тот, кто в ней уже был.
 */
export const MainLayoutPanels = (props: MainLayoutPanelsProps) => {
  const { items } = props;

  return (
    <Space
      orientation="vertical"
      size="small"
      /* Своих полей у списка нет: сверху и снизу их даёт сама колонка. */
      style={{ alignItems: 'center', display: 'flex' }}
    >
      {items.map((item) => (
        <Tooltip key={item.panel} title={item.name} placement="left">
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
            <PanelLogo panel={item.panel} size="small" height={LOGO_HEIGHT} />
          </a>
        </Tooltip>
      ))}
    </Space>
  );
};
