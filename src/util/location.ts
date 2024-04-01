import VueRouter from '..';
import { Location, RawLocation, Route } from '../types';
import { parsePath, resolvePath } from './path';

/** RawLocation类型收缩为 Location类型 */
export function normalizeLocation(
  raw: RawLocation,
  current?: Route,
  append?: boolean,
  router?: VueRouter
): Location {
  let next: Location = typeof raw === 'string' ? { path: raw } : raw;

  /**处理路径，路径上可能有查询参数和hash值 */
  const parsedPath = parsePath(next.path || '');
  /**初始时，浏览器地址可能没有匹配的路由 current 为undefined,则基路径为 '/' */
  const basePath = (current && current.path) || '';
  /** to='?a=1' 时，parsedPath.path 为 '',则地址变成  /?a=1  */
  const path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath;
  const query = {};
  const hash = '';
  return {
    _normalized: true,
    path,
    query,
    hash,
  };
}
