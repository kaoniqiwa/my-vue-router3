import { createMatcher } from './create-matcher';
import { HashHistory } from './history/hash';
import { History } from './history/base';
import { install } from './install';
import {
  Matcher,
  RawLocation,
  Route,
  RouterMode,
  RouterOptions,
  Location,
} from './types';
import { warn, assert } from './util/warn';
import { HTML5History } from './history/html5';
import { AbstractHistory } from './history/abstract';
import { normalizeLocation } from './util/location';
import { cleanPath } from './util/path';

export default class VueRouter {
  static install = install;
  /**声明为字符串值，即使 @rollup/plugin-replace 插件替换失败，也不会报错 */
  static version = '__VERSION__';

  app: Vue | null = null;
  apps: Array<Vue> = [];
  mode: RouterMode = RouterMode.Hash;
  beforeHooks: Array<Function> = [];
  afterHooks: Array<Function> = [];
  matcher: Matcher;
  history?: History;

  constructor(public options: RouterOptions = {}) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        new.target === VueRouter,
        `Router must be called with the new operator.`
      );
    }

    /**创建 路由-组件 映射表 */
    this.matcher = createMatcher(options.routes || [], this);

    /**默认 hash 路由 */
    this.mode = this.options.mode || RouterMode.Hash;

    /**创建历史记录管理器 */
    switch (this.mode) {
      case RouterMode.Hash:
        this.history = new HashHistory(this, this.options.base);
        break;
      case RouterMode.History:
        this.history = new HTML5History(this, this.options.base);
        break;
      case RouterMode.Abstract:
        this.history = new AbstractHistory(this, this.options.base);
        break;
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${this.mode}`);
        }
    }
  }
  /**
   * app:vue根实例
   * Vue 内部会根据 _router 实例调用 init 方法，在调用前必须先通过 Vue.use(VueRouter) 调用 install 方法，注册router
   */
  init(app: Vue) {
    /**没有使用 Vue.use(VueRouter) 调用 install 方法时报错 */
    process.env.NODE_ENV !== 'production' &&
      assert(
        install.installed,
        `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
          `before creating root instance.`
      );
    this.apps.push(app);

    /**
     * 全局Vue.mixin(beforeCreate(){...}) 中会自动调用 router.init(),
     * 如果组件自身beforeCreate(){...}也调用 router.init()时，不需要重复调用
     */
    if (this.app) {
      return;
    }
    this.app = app;

    const history = this.history;
    if (history instanceof HashHistory || history instanceof HTML5History) {
      const setupListeners = (routeOrError: Route | Error) => {
        history.setupListeners();
      };

      /**初次根据浏览器上的路径匹配路由,匹配成功后添加事件监听，监听浏览器操作 */
      history.transitionTo(
        history.getCurrentLocation(),
        setupListeners,
        setupListeners
      );
    }
    /**
     * 更新 vm 上的_route
     * 响应式添加:
     * vm.$set(this,'_route',current)
     * current = route2;并不会触发响应式
     * 应该 vm._route = route2;
     */
    history?.listen((route) => {
      /**路径的变化交给 router 内部处理，视图层只监听 app._route 的值,_route改变时，获取 _route.matched ,重新渲染 */
      this.apps.forEach((app) => (app._route = route));
    });
  }
  match(raw: RawLocation, current?: Route, redirectedFrom?: Location) {
    return this.matcher.match(raw, current, redirectedFrom);
  }
  getRoutes() {
    return this.matcher.getRoutes();
  }
  onError(cb: Function) {
    this.history?.onError(cb);
  }
  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this?.history?.push(location, onComplete, onAbort);
  }
  replace(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this?.history?.replace(location, onComplete, onAbort);
  }
  resolve(to: RawLocation, current?: Route, append?: boolean) {
    current = current || this.history?.current;
    const location = normalizeLocation(to, current, append, this);
    const route = this.match(location, current);
    const fullPath = route.fullPath;
    const base = this.history?.base || '/';
    const href = createHref(base, fullPath, this.mode);

    return {
      location,
      route,
      href,
      // for backwards compat
      normalizedTo: location,
      resolved: route,
    };
  }
  /**钩子函数 */
  beforeEach() {}
  beforeResolve() {}
  afterEach() {}
}

function createHref(base: string, fullPath: string, mode: RouterMode) {
  var path = mode === 'hash' ? '#' + fullPath : fullPath;
  return base ? cleanPath(base + '/' + path) : path;
}
