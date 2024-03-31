import { VueConstructor, ComponentOptions } from 'vue';
import View from './components/view';
import Link from './components/link';

export let _Vue: VueConstructor;
interface Install {
  installed?: boolean;
  (Vue: VueConstructor): void;
}

export const install: Install = function (Vue: VueConstructor) {
  if (!!install.installed && _Vue === Vue) return;
  install.installed = true;

  _Vue = Vue;

  const isDef = (v: any) => v !== undefined;

  Vue.mixin({
    beforeCreate(this: Vue) {
      /**router 参数必须配置在根实例上 */
      if (isDef(this.$options.router)) {
        this._routerRoot = this;
        this._router = this.$options.router;
        /**把vue根实例传入 router 中 */
        this._router.init(this);
        /**
         * 添加响应式 Vue.set()方法需要等到 vm 实例初始化完成，直接在 beforeCreate 中使用报错
         * 必须在 init()之后，解析地址栏的 path,history.current 处理完之后
         */
        (Vue.util as any).defineReactive(
          this,
          '_route',
          this._router.history?.current
        );
      } else {
        /**所有子组件的 _routerRoot 指向根实例 */
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
    },
    destroyed() {},
  } as ComponentOptions<Vue>);

  /**vm.$route 访问路由器 */
  Reflect.defineProperty(Vue.prototype, '$router', {
    get(this: Vue) {
      return this._routerRoot._router;
    },
  });

  /**vm.$route 访问当前路由 */
  Reflect.defineProperty(Vue.prototype, '$route', {
    get(this: Vue) {
      return this._routerRoot._route;
    },
  });
  /**注册全局组件 */
  Vue.component('RouterView', View);
  Vue.component('RouterLink', Link);
};
