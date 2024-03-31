import { inBrowser } from './dom';
import { extend } from './misc';
import { saveScrollPosition } from './scroll';
import { genStateKey, getStateKey, setStateKey } from './state-key';

export const supportsPushState =
  inBrowser &&
  (function () {
    const ua = window.navigator.userAgent;

    if (
      (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1
    ) {
      return false;
    }
    return window.history && typeof window.history.pushState === 'function';
  })();

/**
 * url为 undefined 时,history API 什么也不做,location API 会跳转 undefined 地址
 */
export function pushState(url?: string, replace?: boolean) {
  /**跳转页面前，保存当前页面滚动地址 */
  saveScrollPosition();
  const history = window.history;
  try {
    if (replace) {
      const stateCopy = extend({}, history.state);
      stateCopy.key = getStateKey();
      history.replaceState(stateCopy, '', url);
    } else {
      history.pushState({ key: setStateKey(genStateKey()) }, '', url);
    }
  } catch (e) {
    url && window.location[replace ? 'replace' : 'assign'](url);
  }
}

export function replaceState(url?: string) {
  pushState(url, true);
}
