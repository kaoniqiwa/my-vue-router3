import { ComponentOptions, VueConstructor, AsyncComponent } from 'vue';
type Component = ComponentOptions<Vue> | VueConstructor | AsyncComponent;
// export type RouterMode = 'hash' | 'history' | 'abstract';

export enum RouterMode {
  Hash = 'hash',
  History = 'history',
  Abstract = 'abstract',
}
export type Dictionary<T> = { [key: string]: T };
export type RouteConfig = RouteConfigSingleView | RouteConfigMultipleViews;
export type Matcher = {
  match: (
    raw: RawLocation,
    current?: Route,
    redirectedFrom?: Location
  ) => Route;
  addRoutes: (routes: Array<RouteConfig>) => void;
  getRoutes: () => Array<RouteRecord>;
};
export type RawLocation = string | Location;
export type NavigationGuardNext<V extends Vue = Vue> = (
  to?: RawLocation | false | ((vm: V) => any)
) => void;
export type NavigationGuard = (
  to: Route,
  from: Route,
  next: NavigationGuardNext
) => any;

interface _RouteConfigBase {
  path: string;
  name?: string;
  children?: RouteConfig[];
  pathToRegexpOptions?: PathToRegexpOptions;
}
export interface RouteConfigSingleView extends _RouteConfigBase {
  component: Component;
}
export interface RouteConfigMultipleViews extends _RouteConfigBase {
  components: Dictionary<Component>;
}

export interface PathToRegexpOptions {
  sensitive?: boolean;
  strict?: boolean;
  end?: boolean;
}
export interface RouterOptions {
  routes?: RouteConfig[];
  mode?: RouterMode;
  base?: string;
  stringifyQuery?: (query: Object) => string;
  parseQuery?: (query: string) => Object;
}
export interface RouteRecord {
  path: string;
  regex: RegExp;
  components: Dictionary<Component>;
  parent?: RouteRecord;
}

export interface Route {
  path: string;
  fullPath: string;
  hash: string;
  matched: RouteRecord[];
  query: Dictionary<string | (string | null)[] | null | undefined>;
}
export interface Location {
  _normalized?: boolean;
  path?: string;
  name?: string;
  params?: Dictionary<string>;
  hash?: string;
  append?: boolean;
  query?: Dictionary<string | (string | null)[] | null | undefined>;
}

export interface RouteRegExp extends RegExp {}

export enum NavigationFailureType {
  redirected = 2,
  aborted = 4,
  cancelled = 8,
  duplicated,
}
