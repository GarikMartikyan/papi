import { Typography } from 'antd';

import { useTranslation } from '../../hooks';

/**
 * Единственная страница скелета.
 *
 * TODO: заглушка — существует, чтобы у каркаса было что показать сразу после
 * форка. Панель заменяет её своей первой страницей.
 */
export const HomePage = () => {
  const t = useTranslation();

  return (
    <>
      <Typography.Title level={3}>{t('home.title')}</Typography.Title>
      <Typography.Paragraph>{t('home.text')}</Typography.Paragraph>
    </>
  );
};
