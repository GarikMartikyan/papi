import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { papiRoutes } from '../../constants/routes.constants';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';

/**
 * Пропсы `ForbiddenPage` — пропсы `Result` из antd как есть: своих у страницы
 * нет, а заголовок, подпись и кнопку панель при желании перебивает ими.
 */
export type ForbiddenPageProps = ResultProps;

/**
 * Закрытый раздел.
 *
 * Стоит внутри каркаса — в отличие от 404: человек вошёл в панель и находится в
 * ней, просто попал туда, куда ему нельзя, и уйти оттуда он должен по
 * навигации, а не по кнопке «назад» в браузере.
 *
 * Ставит её `PermissionGate` — им же `PapiRouter` заворачивает каждый раздел с
 * правом. Панель ставит её и сама, когда закрывает правом что-то своё.
 *
 * Ведёт на корень, а не на конкретный раздел: какой раздел у панели первый,
 * знает `PapiRouter`, и с корня он уводит туда сам.
 *
 * @example
 * ```tsx
 * <PermissionGate permission={Permission.REPORTS} fallback={<ForbiddenPage />}>
 *   <ReportsSection />
 * </PermissionGate>
 * ```
 */
export const ForbiddenPage = (props: ForbiddenPageProps) => {
  const t = usePapiTranslation();

  return (
    <Result
      status="403"
      title={t('access denied')}
      subTitle={t('you have no access to this')}
      extra={
        <Link to={papiRoutes.home}>
          <Button type="primary">{t('back to the panel')}</Button>
        </Link>
      }
      {...props}
    />
  );
};
