import { Card, DatePicker, Descriptions, Space, Typography } from 'antd';

import { LocaleSelect, ThemeSwitcher } from '@papi/components';
import { useLocale, useThemeMode } from '@papi/hooks';

import { useTranslation } from '../../hooks/useTranslation';

export const SettingsPage = () => {
  const t = useTranslation();

  const { locale } = useLocale();
  const { mode } = useThemeMode();

  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Card title={t('appearance')}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('dark theme')}>
            <Space>
              <ThemeSwitcher variant="switch" />
              <Typography.Text code>{mode}</Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('language')}>
            <Space>
              <LocaleSelect />
              <Typography.Text code>{locale}</Typography.Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('dates')}>
        <Space orientation="vertical">
          <DatePicker />
          <Typography.Text type="secondary">{t('dates hint')}</Typography.Text>
        </Space>
      </Card>
    </Space>
  );
};
