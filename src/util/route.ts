import VueRouter from '..';
import { RouteRecord, Location, Route } from '../types';

export function createRoute(
  record: RouteRecord | null = null,
  location: Location,
  redirectedFrom?: Location,
  router?: VueRouter
) {
  const route: Route = {
    path: location.path || '/',
    fullPath: getFullPath(location),
    matched: formatMatch(record),
  };
  return route;
}

/**初始路径 */
export const START = createRoute(null, {
  path: '/',
});

function formatMatch(record?: RouteRecord | null) {
  const res: RouteRecord[] = [];
  /**处理嵌套路由,必须 unshift()，配合 router-view 的 depth 属性，先访问父组件，再访问子组件 */
  while (record) {
    res.unshift(record);
    record = record.parent;
  }
  return res;
}

function getFullPath(location: Location) {
  return location.path || '';
}
