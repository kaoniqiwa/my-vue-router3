import {
  Dictionary,
  PathToRegexpOptions,
  RouteConfig,
  RouteConfigMultipleViews,
  RouteRecord,
  RouteRegExp,
} from './types';
import { cleanPath } from './util/path';
import { assert, warn } from './util/warn';
import { pathToRegexp } from 'path-to-regexp';

export function createRouteMap(
  routes: Array<RouteConfig>,
  oldPathList?: Array<string>,
  oldPathMap?: Dictionary<RouteRecord>,
  oldNameMap?: Dictionary<RouteRecord>,
  parentRoute?: RouteRecord
) {
  /**提取 routeConfig 中的路径['/','/foo','/bar'] */
  const pathList: Array<string> = oldPathList || [];

  /**对象形式 {"/":组件a,"/foo":组件b,"/bar":组件c},方便根据路径查找对应的组件 */
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null);

  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null);

  /**将用户配置项格式化为方便内部使用的结构 */
  routes.forEach((route) => {
    addRouteRecord(pathList, pathMap, nameMap, route, parentRoute);
  });
  return {
    pathList,
    pathMap,
    nameMap,
  };
}

function addRouteRecord(
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {
  const { path, name } = route;

  if (process.env.NODE_ENV !== 'production') {
    assert(path != null, `"path" is required in a route configuration.`);
    assert(
      isMultipleViews(route) ? '' : typeof route.component !== 'string',
      `route config "component" for path: ${String(
        path || name
      )} cannot be a ` + `string id. Use an actual component instead.`
    );
    /**path不能为控制字符，或者无效的字符(1,2,3,_,$) */
    warn(
      !/[^\u0000-\u007F]+/.test(path),
      `Route with path "${path}" contains unencoded characters, make sure ` +
        `your path is correctly encoded before passing it to the router. Use ` +
        `encodeURI to encode static segments of your path.`
    );
  }
  /**path-to-regexp 的配置 */
  const pathToRegexpOptions = route.pathToRegexpOptions || {};
  const normalizedPath = normalizePath(
    path,
    parent,
    pathToRegexpOptions.strict
  );

  /**用户数据格式化 */
  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: isMultipleViews(route)
      ? route.components
      : { default: route.component },
    parent,
  };

  if (route.children) {
    route.children.forEach((child) => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined;
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
    });
  }

  /**重复定义，不能覆盖 */
  if (!pathMap[record.path]) {
    pathMap[record.path] = record;
    pathList.push(record.path);
  }
}

/** ts 类型收缩 */
function isMultipleViews(
  route: RouteConfig
): route is RouteConfigMultipleViews {
  return Reflect.ownKeys(route).includes('components');
}

function normalizePath(path: string, parent?: RouteRecord, strict?: boolean) {
  /**非严格模式 /xxx/a 和 /xxx/a/ 都能匹配 a 路由 */
  if (!strict) path = path.replace(/\/$/, '');
  /** "/foo" 路径表示根路由 */
  if (path[0] === '/') return path;
  if (parent == null) return path;

  /**嵌套路由时: 拼接父子路由 /bar/user */
  return cleanPath(`${parent.path}/${path}`);
}

/**生成与路径匹配的正则,以后浏览器上的路径匹配正则，则渲染 record 中的 components */
function compileRouteRegex(
  path: string,
  pathToRegexpOptions: PathToRegexpOptions
): RouteRegExp {
  const regex = pathToRegexp(path, [], pathToRegexpOptions);
  return regex;
}
