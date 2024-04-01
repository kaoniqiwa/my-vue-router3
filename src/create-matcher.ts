import VueRouter from '.';
import { createRouteMap } from './create-route-map';
import {
  Matcher,
  RawLocation,
  Route,
  RouteConfig,
  Location,
  RouteRecord,
  RouteRegExp,
  Dictionary,
} from './types';
import { normalizeLocation } from './util/location';
import { createRoute } from './util/route';

export function createMatcher(
  routes: Array<RouteConfig>,
  router: VueRouter
): Matcher {
  const { pathList, pathMap, nameMap } = createRouteMap(routes);

  function match(
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
    /**将字符串地址转成对象形式 */
    const location = normalizeLocation(raw, currentRoute, false, router);
    const { name } = location;
    if (name) {
    } else if (location.path) {
      location.params = {};
      for (let i = 0; i < pathList.length; i++) {
        const path = pathList[i];
        const record = pathMap[path];
        /**如果 location 满足record 的正则匹配，则路径匹配成功,创建一条路由 route */
        if (matchRoute(record.regex, location.path, location.params)) {
          return _createRoute(record, location);
        }
      }
    }
    /**
     * location 未匹配到任何 RouteRecord,则当前 location 的 matched 为 []
     * 未匹配到静态设置的路由，以后动态添加路由可能匹配到，所以即使匹配失败，也创建一份 Route
     */
    return _createRoute(null, location);
  }

  /**动态添加的路由拼接到静态路由上 */
  function addRoutes(routes: Array<RouteConfig>) {
    createRouteMap(routes, pathList, pathMap, nameMap);
  }

  /**返回 RouteConfig[] 处理成 RouteRecord[] */
  function getRoutes() {
    return pathList.map((path) => pathMap[path]);
  }

  function _createRoute(
    record: RouteRecord | null,
    location: Location,
    redirectedFrom?: Location
  ) {
    return createRoute(record, location, redirectedFrom, router);
  }

  return {
    match,
    addRoutes,
    getRoutes,
  };
}

function matchRoute(
  regex: RouteRegExp,
  path: string,
  params: Record<string, any>
) {
  const m = path.match(regex);
  if (!m) {
    return false;
  } else if (!params) {
    return true;
  }
  return true;
}
