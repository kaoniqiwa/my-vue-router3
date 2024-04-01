import VueRouter from '..';
import { RawLocation, Route } from '../types';
import { pushState, replaceState, supportsPushState } from '../util/push-state';
import { History } from './base';

export class HashHistory extends History {
  constructor(router: VueRouter, base?: string, fallback?: boolean) {
    super(router, base);

    ensureSlash();
  }
  go(n: number) {}
  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('hash push');
    // this.history.push();
    // window.location.hash = location.toString();
  }
  replace(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('hash replace');
  }
  getCurrentLocation() {
    return getHash();
  }
  setupListeners() {
    if (this.listeners.length) return;

    const handleRoutingEvent = () => {
      if (!ensureSlash()) {
        return;
      }
      /**当地址栏改变时，重新获取 hash 值，映射新的路由 */
      this.transitionTo(getHash(), (route: Route) => {
        if (!supportsPushState) {
          // replaceHash()
        }
      });
    };

    /**浏览器前进后退或者地址栏回车会触发事件 */
    const eventType = supportsPushState ? 'popstate' : 'hashchange';
    window.addEventListener(eventType, handleRoutingEvent);

    this.listeners.push(() => {
      window.removeEventListener(eventType, handleRoutingEvent);
    });
  }
  ensureURL(push?: boolean) {
    const current = this.current.fullPath;

    if (getHash() !== current) {
      push ? pushHash(current) : replaceHash(current);
    }
  }
}

/** '#/foo' => '/foo' */
export function getHash() {
  const href = window.location.href;
  const index = href.indexOf('#');
  if (index == -1) {
    return '';
  }
  return href.slice(index + 1);
}
/** http:/aaa.com/ */
function ensureSlash() {
  const path = getHash();
  /**合法 hash 值 => /a/b#/c */
  if (path.charAt(0) === '/') return true;

  replaceHash('/' + path);
  return false;
}
function pushHash(path: string) {
  if (supportsPushState) {
    pushState(getUrl(path));
  } else {
    window.location.hash = path;
  }
}
function replaceHash(path: string) {
  if (supportsPushState) {
    replaceState(getUrl(path));
  } else {
    window.location.replace(getUrl(path));
  }
}

/**
 * http://aaa.com/bbb/ccc#foo
 *  转成
 * http://aaa.com/bbb/ccc + # + /foo
 */
function getUrl(path: string) {
  const href = window.location.href;
  const index = href.indexOf('#');
  const base = index >= 0 ? href.slice(0, index) : href;
  return `${base}#${path}`;
}
