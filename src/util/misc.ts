import { Dictionary } from '../types';

/**将 source 上的属性赋值到 target 上 */
export function extend(target: Dictionary<string>, source: Dictionary<string>) {
  for (let key in source) {
    target[key] = source[key];
  }
  return target;
}
