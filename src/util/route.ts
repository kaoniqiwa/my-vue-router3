import VueRouter from '..';
import { RouteRecord, Location, Route } from '../types';

export function createRoute(
  record: RouteRecord | null = null,
  location: Location,
  redirectedFrom?: Location,
  router?: VueRouter
) {
  /**用户传入的自定义解析查询参数，比如 ?a=1&a=2,是合并成 a=[1,2] 还是 a=2 */
  const stringifyQuery = router && router.options.stringifyQuery;

  let query = location.query || {};
  try {
    query = clone(query);
  } catch (e) {}

  const route: Route = {
    path: location.path || '/',
    fullPath: getFullPath(location),
    hash: location.hash || '',
    matched: formatMatch(record),
    query,
  };
  if (redirectedFrom) {
  }
  /**用户可以外部访问 route，冻结 route,不让瞎搞 */
  return Object.freeze(route);
}

/**初始路径 */
export const START = createRoute(null, {
  path: '/',
});
export function isSameRoute(a: Route, b: Route, onlyPath?: boolean) {
  if (b === START) {
    return a === b;
  }
}

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

function clone(val: any): any {
  if (Array.isArray(val)) {
    return val.map(clone);
  } else if (Object.prototype.toString.call(val) === '[object Object]') {
    const res: Record<string, any> = {};
    for (let key in val) {
      res[key] = clone(val[key]);
    }
    return res;
  } else {
    return val;
  }
}
