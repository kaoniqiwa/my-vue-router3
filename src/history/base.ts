import VueRouter from '..';
import { RawLocation, Route } from '../types';
import { inBrowser } from '../util/dom';
import { START } from '../util/route';

export abstract class History {
  abstract go(n: number): void;
  abstract getCurrentLocation(): string;
  abstract setupListeners(): void;
  abstract push(
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ): void;
  abstract replace(
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ): void;

  base: string;
  /**收集事件监听，卸载时取消事件监听 */
  listeners: Array<Function> = [];
  /**路由失败时的调用列 */
  errorCbs: Array<Function> = [];

  /**路由发生变化时，通知更新 vm 实例上的 route 更新 */
  cb?: (r: Route) => void;
  /**初始化时路径为 '/',匹配项 matched 为空数组，等待 router.init()调用 */
  current: Route = START;

  constructor(public router: VueRouter, base?: string) {
    this.base = normalizeBase(base);
  }
  listen(cb: { (r: Route): void }) {
    this.cb = cb;
  }
  /** 将路径映射为路由 */
  transitionTo(
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ) {
    let route: Route;
    try {
      route = this.router.match(location, this.current);
      // console.log('route', route);
      // console.log('current', this.current);
    } catch (e) {
      /**路由导航失败，调用用户传入的 error 回调 */
      this.errorCbs.forEach((cb) => cb(e));

      /**控制台显示报错 */
      throw e;
    }
    this.updateRoute(route);
    const prev = this.current;
    onComplete && onComplete();
    confirmTransition(
      route,
      () => {},
      () => {}
    );
    function confirmTransition(
      route: Route,
      onComplete: Function,
      onAbort?: Function
    ) {}
  }
  /**注册路由导航时的错误回调 */
  onError(errorCb: Function) {
    this.errorCbs.push(errorCb);
  }
  updateRoute(route: Route) {
    this.current = route;
    this.cb?.(route);
  }
}

function normalizeBase(base?: string) {
  if (!base) {
    /**浏览器端获取 base 标签的 href 属性 */
    if (inBrowser) {
      const baseEl = document.querySelector('base');
      base = (baseEl && baseEl.getAttribute('href')) || '/';
      /**获取 URL 中的 path http://aaa.com/bbb/ => /bbb/ */
      base = base.replace(/https?:\/\/[^\/]+/, '');
    } else {
      /** http://xxx.com/ 的路径为 '/' */
      base = '/';
    }
  }
  /**
   * 浏览器地址:http://www.baidu.com/app/foo/
   *  1.在域名后面跟 '/' 表示后续内容为路径
   *  2.地址栏 foo 后面会浏览器自动加上 '/' 作为结尾,表示路径结束,后面的内部与路径无关
   */
  if (base.charAt(0) !== '/') {
    base = '/' + base;
  }

  /**
   * 返回适用 router 使用的路径
   * base:'/app/' 不需要最后的 '/',因为在路由配置中规定第一层路由的 path 必须以'/'开头，比如 {path:'/foo'}
   * 和 base 拼接上 => /app//foo,此为非法路径，所以剔除 base 中最后一个 '/'
   */
  return base.replace(/\/$/, '');
}
