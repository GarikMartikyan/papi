import { Card, type CardProps, Divider, Space, Typography } from 'antd';

import {
  LogoTemplate,
  type LogoTemplateSize,
  PanelLogo,
  panelLogos,
  type PanelName,
} from '@papi/components';
import { useThemeToken } from '@papi/hooks';

import { BallIcon } from '../../components/BallIcon';

const SIZES: LogoTemplateSize[] = ['large', 'middle', 'small'];

/** Одной высоты хватает: размер тянется пропорционально, и лишние ряды ничего не добавят. */
const ROW_HEIGHT = 48;

const PANELS = Object.keys(panelLogos) as PanelName[];

export type LogoShowcaseProps = CardProps;

/**
 * TODO: витрина логотипа — панели из каталога через `PanelLogo` и три варианта
 * пропсов `LogoTemplate`: своя иконка, без иконки, цветом темы. Убрать, когда
 * логотип выбран и встал на своё место.
 */
export const LogoShowcase = (props: LogoShowcaseProps) => {
  const { ...rest } = props;

  const token = useThemeToken();

  return (
    <Card title="Логотип" {...rest}>
      <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
        {PANELS.map((panel) => (
          <Space key={panel} orientation="vertical" size="middle" style={{ display: 'flex' }}>
            <Typography.Text strong>
              {`<PanelLogo panel="${panel}" />`} — {panelLogos[panel].name}
            </Typography.Text>

            <Space size="large" align="center" wrap>
              {SIZES.map((size) => (
                <PanelLogo key={size} panel={panel} size={size} height={ROW_HEIGHT} />
              ))}
            </Space>
          </Space>
        ))}

        <Divider style={{ margin: 0 }} />

        <Space orientation="vertical" size="small">
          <Typography.Text type="secondary">
            LogoTemplate со своей иконкой — {'<BallIcon />'}
          </Typography.Text>
          <Space size="large" align="center" wrap>
            {SIZES.map((size) => (
              <LogoTemplate
                key={size}
                abbr="RMP"
                name="Risk Management Panel"
                icon={<BallIcon />}
                size={size}
                height={ROW_HEIGHT}
              />
            ))}
          </Space>
        </Space>

        <Space orientation="vertical" size="small">
          <Typography.Text type="secondary">
            Без иконки и без записи в каталоге — имя и буквы из .env
          </Typography.Text>
          <Space size="large" align="center" wrap>
            {SIZES.map((size) => (
              <LogoTemplate key={size} size={size} height={ROW_HEIGHT} />
            ))}
          </Space>
        </Space>

        <Space orientation="vertical" size="small">
          <Typography.Text type="secondary">color={token.colorPrimary} — цвет темы</Typography.Text>
          <Space size="large" align="center" wrap>
            {SIZES.map((size) => (
              <PanelLogo
                key={size}
                panel="rmp"
                size={size}
                height={ROW_HEIGHT}
                color={token.colorPrimary}
              />
            ))}
          </Space>
        </Space>
      </Space>
    </Card>
  );
};
