import { Button, Card, DatePicker, Descriptions, Space, Typography } from 'antd';

import { LocaleSelect, ThemeSwitcher } from '@papi/components';
import { useLocale, useThemeMode } from '@papi/hooks';
import { removeAccessTokenLS, setAccessTokenLS } from '@papi/services';
import { getProjectId } from '@papi/utils';

import { useGetSessionQuery } from '../../api/endpoints/users.api';
import { useTranslation } from '../../hooks';

const FAKE_TOKEN = 'example-panel-demo-token';

/**
 * Экран, на котором видно работу ядра: тема, язык, токен в заголовке и
 * локаль dayjs в календаре.
 */
export const SettingsPage = () => {
  const t = useTranslation();

  const { locale } = useLocale();
  const { mode } = useThemeMode();

  const { data: session, refetch } = useGetSessionQuery();

  const projectId = getProjectId();

  const handleSetToken = () => {
    setAccessTokenLS(FAKE_TOKEN);
    // Заголовок собирается в момент запроса, поэтому достаточно перезапросить.
    void refetch();
  };

  const handleClearToken = () => {
    removeAccessTokenLS();
    void refetch();
  };

  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Card title={t('settings.appearance')}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('settings.theme')}>
            <Space>
              {/* Вариант `switch`: в шапке стоит тот же переключатель кнопкой —
                  здесь видно, что оба варианта живут от одного состояния. */}
              <ThemeSwitcher variant="switch" />
              <Typography.Text code>{mode}</Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.language')}>
            <Space>
              <LocaleSelect />
              <Typography.Text code>{locale}</Typography.Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('settings.session')}>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('settings.session.header')}>
              {session?.authorization === null || session?.authorization === undefined ? (
                <Typography.Text type="secondary">{t('settings.session.none')}</Typography.Text>
              ) : (
                <Typography.Text code>{session.authorization}</Typography.Text>
              )}
            </Descriptions.Item>
            {session !== undefined && (
              <Descriptions.Item label="projectId">
                <Typography.Text code>{projectId ?? '—'}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          {session !== undefined && (
            <Typography.Text type="secondary">
              {t('settings.session.at', { time: new Date(session.receivedAt) })}
            </Typography.Text>
          )}

          <Space wrap>
            <Button onClick={handleSetToken}>{t('settings.session.setToken')}</Button>
            <Button onClick={handleClearToken}>{t('settings.session.clearToken')}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('settings.session')}>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('settings.session.header')}>
              {session?.authorization === null || session?.authorization === undefined ? (
                <Typography.Text type="secondary">{t('settings.session.none')}</Typography.Text>
              ) : (
                <Typography.Text code>{session.authorization}</Typography.Text>
              )}
            </Descriptions.Item>
            {session !== undefined && (
              <Descriptions.Item label="projectId">
                <Typography.Text code>{projectId ?? '—'}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          {session !== undefined && (
            <Typography.Text type="secondary">
              {t('settings.session.at', { time: new Date(session.receivedAt) })}
            </Typography.Text>
          )}

          <Space wrap>
            <Button onClick={handleSetToken}>{t('settings.session.setToken')}</Button>
            <Button onClick={handleClearToken}>{t('settings.session.clearToken')}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('settings.session')}>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('settings.session.header')}>
              {session?.authorization === null || session?.authorization === undefined ? (
                <Typography.Text type="secondary">{t('settings.session.none')}</Typography.Text>
              ) : (
                <Typography.Text code>{session.authorization}</Typography.Text>
              )}
            </Descriptions.Item>
            {session !== undefined && (
              <Descriptions.Item label="projectId">
                <Typography.Text code>{projectId ?? '—'}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          {session !== undefined && (
            <Typography.Text type="secondary">
              {t('settings.session.at', { time: new Date(session.receivedAt) })}
            </Typography.Text>
          )}

          <Space wrap>
            <Button onClick={handleSetToken}>{t('settings.session.setToken')}</Button>
            <Button onClick={handleClearToken}>{t('settings.session.clearToken')}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('settings.session')}>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('settings.session.header')}>
              {session?.authorization === null || session?.authorization === undefined ? (
                <Typography.Text type="secondary">{t('settings.session.none')}</Typography.Text>
              ) : (
                <Typography.Text code>{session.authorization}</Typography.Text>
              )}
            </Descriptions.Item>
            {session !== undefined && (
              <Descriptions.Item label="projectId">
                <Typography.Text code>{projectId ?? '—'}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          {session !== undefined && (
            <Typography.Text type="secondary">
              {t('settings.session.at', { time: new Date(session.receivedAt) })}
            </Typography.Text>
          )}

          <Space wrap>
            <Button onClick={handleSetToken}>{t('settings.session.setToken')}</Button>
            <Button onClick={handleClearToken}>{t('settings.session.clearToken')}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('settings.dates')}>
        <Space orientation="vertical">
          <DatePicker />
          <Typography.Text type="secondary">{t('settings.dates.hint')}</Typography.Text>
        </Space>
      </Card>
    </Space>
  );
};
