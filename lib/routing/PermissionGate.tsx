import type { ReactNode } from 'react';

import { usePermissions } from '../hooks/usePermissions';
import { ForbiddenPage } from '../pages/ForbiddenPage/ForbiddenPage';
import type { PapiPermission } from '../types/types/permission.type';

export interface PermissionGateProps {
  /** Право, без которого содержимое не показывается. Не указано — показывается всем. */
  permission?: PapiPermission;
  children: ReactNode;
  /** Что вместо содержимого, когда права нет. По умолчанию — `ForbiddenPage`. */
  fallback?: ReactNode;
}

/**
 * Содержимое, закрытое правом.
 *
 * Этим `PapiRouter` заворачивает страницу раздела, но привязки к маршруту у
 * компонента нет: панель закрывает им и кнопку, и колонку таблицы, и целую
 * секцию — передав `fallback`, вплоть до пустого.
 *
 * Отказ, а не пустое место, по умолчанию: у раздела есть адрес, по нему ходят
 * из закладок и по ссылкам от коллег, и человек должен понять, что страница
 * существует, просто закрыта. Пустой экран на её месте выглядит поломкой.
 *
 * Прятать пункт в меню — забота `PapiRouterLayout`: этот компонент про
 * содержимое, а не про навигацию к нему.
 */
export const PermissionGate = (props: PermissionGateProps) => {
  const { permission, children, fallback } = props;

  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) return <>{fallback ?? <ForbiddenPage />}</>;

  return <>{children}</>;
};
