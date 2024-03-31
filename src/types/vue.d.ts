/**一定要导入，否则就是覆盖原声明 */
import Vue, { VueConstructor, ComponentOptions, VNodeData } from 'vue';
import VueRouter from '..';
import { Route } from './router';

declare module 'vue' {
  export default interface Vue {
    [key: string]: any;
    _routerRoot: Vue;
    _route: Route;
    _router: VueRouter;
    $router: VueRouter;
    $route: Route;
  }
  export interface VueConstructor {}

  export interface ComponentOptions {
    router: VueRouter;
  }
  export interface VNodeData {
    routerView?: boolean;
  }
}
