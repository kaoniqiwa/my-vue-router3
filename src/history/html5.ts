import VueRouter from '..';
import { RawLocation } from '../types';
import { cleanPath } from '../util/path';
import { History } from './base';

export class HTML5History extends History {
  constructor(router: VueRouter, base?: string) {
    super(router, base);
  }
  go() {}
  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('push');
    // this.history.push();
  }
  replace(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('replace');
  }
  getCurrentLocation() {
    return getLocation(this.base);
  }
  setupListeners() {
    if (this.listeners.length) return;
    const handleRoutingEvent = () => {
      console.log('html history');
    };

    window.addEventListener('popstate', handleRoutingEvent);

    this.listeners.push(() => {
      window.removeEventListener('popstate', handleRoutingEvent);
    });
  }
}

/**
 * URL: http://aaa.com/bbb/ccc/ddd/?a=1#foo
 * base:/bbb/ccc
 *
 *  1.path == /bbb/ccc/ddd/
 *  2.经过 if 处理后 path= /ddd/
 *  3.返回 /ddd/?a=1#foo
 *  4.后续路由地址会替换 /ddd/?a=1#foo
 * 比如: {path:'/bar'}，路由跳转时，路由中的地址相对于 base 地址,地址栏效果 http://aaa.com/bbb/ccc/bar
 *
 */
export function getLocation(base: string) {
  let path = window.location.pathname;
  const pathLowerCase = path.toLocaleLowerCase();
  const baseLowerCase = base.toLocaleLowerCase();
  if (
    base &&
    (pathLowerCase == baseLowerCase ||
      pathLowerCase.indexOf(cleanPath(baseLowerCase + '/')) === 0)
  ) {
    path = path.slice(base.length);
  }
  return (path || '/') + window.location.search + window.location.hash;
}
