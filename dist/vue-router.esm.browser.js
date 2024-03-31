/*!
  * vue-router v1.0.0
  * (c) 2024 Kaoniqiwa
  * @license ISC
  */
/**
 * \s:匹配空白符
 * (?:aaa):匹配 aaa，但不会捕获,不要和动态路由 /user/:id 混淆
 * // => /
 * /// => /
 * /  / => /
 * /  /   / => /
 * /   /aaa/   / => /aaa/
 */
function cleanPath(path) {
    return path.replace(/\/(?:\s*\/)+/g, '/');
}
/**
 * path:'/foo?a=1&b=2#bbb'
 */
function parsePath(path) {
    let hash = '';
    let query = '';
    /**
     * 提取hash
     *  =>
     * hash:'#bbb'
     * path:'/foo?a=1&b=2'
     */
    const hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
        hash = path.slice(hashIndex);
        path = path.slice(0, hashIndex);
    }
    /**
     * 提取query
     *  =>
     * query:''a=1&b=2'
     * path:'/foo'
     */
    const queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
        query = path.slice(queryIndex + 1);
        path = path.slice(0, queryIndex);
    }
    return {
        path,
        query,
        hash,
    };
}
function resolvePath(relative, base, append) {
    const firstChar = relative.charAt(0);
    /** to='/foo'已经是绝对路径 */
    if (firstChar === '/')
        return relative;
    if (firstChar === '?' || firstChar === '#') {
        return base + relative;
    }
    const stack = base.split('/');
    if (!append) {
        stack.pop();
    }
    stack.push(relative);
    return stack.join('/');
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`[vue-router] ${message}`);
    }
}
function warn(condition, message) {
    if (!condition) {
        typeof console !== 'undefined' && console.warn(`[vue-router] ${message}`);
    }
}

/**
 * Tokenize input string.
 */
function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
        if (char === "\\") {
            tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
            continue;
        }
        if (char === "{") {
            tokens.push({ type: "OPEN", index: i, value: str[i++] });
            continue;
        }
        if (char === "}") {
            tokens.push({ type: "CLOSE", index: i, value: str[i++] });
            continue;
        }
        if (char === ":") {
            var name = "";
            var j = i + 1;
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name)
                throw new TypeError("Missing parameter name at ".concat(i));
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at ".concat(j));
                    }
                }
                pattern += str[j++];
            }
            if (count)
                throw new TypeError("Unbalanced pattern at ".concat(i));
            if (!pattern)
                throw new TypeError("Missing pattern at ".concat(i));
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
    };
    var consumeText = function () {
        var result = "";
        var value;
        while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
            result += value;
        }
        return result;
    };
    while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
/**
 * Escape a regular expression string.
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */
function flags(options) {
    return options && options.sensitive ? "" : "i";
}
/**
 * Pull out keys from a regexp.
 */
function regexpToRegexp(path, keys) {
    if (!keys)
        return path;
    var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
    var index = 0;
    var execResult = groupsRegex.exec(path.source);
    while (execResult) {
        keys.push({
            // Use parenthesized substring match if available, index otherwise
            name: execResult[1] || index++,
            prefix: "",
            suffix: "",
            modifier: "",
            pattern: "",
        });
        execResult = groupsRegex.exec(path.source);
    }
    return path;
}
/**
 * Transform an array into a regexp.
 */
function arrayToRegexp(paths, keys, options) {
    var parts = paths.map(function (path) { return pathToRegexp(path, keys, options).source; });
    return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
/**
 * Create a path regexp from string input.
 */
function stringToRegexp(path, keys, options) {
    return tokensToRegexp(parse(path, options), keys, options);
}
/**
 * Expose a function for taking tokens and returning a RegExp.
 */
function tokensToRegexp(tokens, keys, options) {
    if (options === void 0) { options = {}; }
    var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function (x) { return x; } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
    var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
    var delimiterRe = "[".concat(escapeString(delimiter), "]");
    var route = start ? "^" : "";
    // Iterate over the tokens and create our regexp string.
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
            route += escapeString(encode(token));
        }
        else {
            var prefix = escapeString(encode(token.prefix));
            var suffix = escapeString(encode(token.suffix));
            if (token.pattern) {
                if (keys)
                    keys.push(token);
                if (prefix || suffix) {
                    if (token.modifier === "+" || token.modifier === "*") {
                        var mod = token.modifier === "*" ? "?" : "";
                        route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
                    }
                    else {
                        route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
                    }
                }
                else {
                    if (token.modifier === "+" || token.modifier === "*") {
                        route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
                    }
                    else {
                        route += "(".concat(token.pattern, ")").concat(token.modifier);
                    }
                }
            }
            else {
                route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
            }
        }
    }
    if (end) {
        if (!strict)
            route += "".concat(delimiterRe, "?");
        route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
    }
    else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string"
            ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
            : endToken === undefined;
        if (!strict) {
            route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
        }
        if (!isEndDelimited) {
            route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
        }
    }
    return new RegExp(route, flags(options));
}
/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */
function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp)
        return regexpToRegexp(path, keys);
    if (Array.isArray(path))
        return arrayToRegexp(path, keys, options);
    return stringToRegexp(path, keys, options);
}

function createRouteMap(routes, oldPathList, oldPathMap, oldNameMap, parentRoute) {
    /**提取 routeConfig 中的路径['/','/foo','/bar'] */
    const pathList = oldPathList || [];
    /**对象形式 {"/":组件a,"/foo":组件b,"/bar":组件c},方便根据路径查找对应的组件 */
    const pathMap = oldPathMap || Object.create(null);
    const nameMap = oldNameMap || Object.create(null);
    /**将用户配置项格式化为方便内部使用的结构 */
    routes.forEach((route) => {
        addRouteRecord(pathList, pathMap, nameMap, route, parentRoute);
    });
    return {
        pathList,
        pathMap,
        nameMap,
    };
}
function addRouteRecord(pathList, pathMap, nameMap, route, parent, matchAs) {
    const { path, name } = route;
    {
        assert(path != null, `"path" is required in a route configuration.`);
        assert(isMultipleViews(route) ? '' : typeof route.component !== 'string', `route config "component" for path: ${String(path || name)} cannot be a ` + `string id. Use an actual component instead.`);
        /**path不能为控制字符，或者无效的字符(1,2,3,_,$) */
        warn(!/[^\u0000-\u007F]+/.test(path), `Route with path "${path}" contains unencoded characters, make sure ` +
            `your path is correctly encoded before passing it to the router. Use ` +
            `encodeURI to encode static segments of your path.`);
    }
    /**path-to-regexp 的配置 */
    const pathToRegexpOptions = route.pathToRegexpOptions || {};
    const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict);
    /**用户数据格式化 */
    const record = {
        path: normalizedPath,
        regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
        components: isMultipleViews(route)
            ? route.components
            : { default: route.component },
        parent,
    };
    if (route.children) {
        route.children.forEach((child) => {
            const childMatchAs = matchAs
                ? cleanPath(`${matchAs}/${child.path}`)
                : undefined;
            addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
        });
    }
    /**重复定义，不能覆盖 */
    if (!pathMap[record.path]) {
        pathMap[record.path] = record;
        pathList.push(record.path);
    }
}
/** ts 类型收缩 */
function isMultipleViews(route) {
    return Reflect.ownKeys(route).includes('components');
}
function normalizePath(path, parent, strict) {
    /**非严格模式 /xxx/a 和 /xxx/a/ 都能匹配 a 路由 */
    if (!strict)
        path = path.replace(/\/$/, '');
    /** "/foo" 路径表示根路由 */
    if (path[0] === '/')
        return path;
    if (parent == null)
        return path;
    /**嵌套路由时: 拼接父子路由 /bar/user */
    return cleanPath(`${parent.path}/${path}`);
}
/**生成与路径匹配的正则,以后浏览器上的路径匹配正则，则渲染 record 中的 components */
function compileRouteRegex(path, pathToRegexpOptions) {
    const regex = pathToRegexp(path, [], pathToRegexpOptions);
    return regex;
}

/** RawLocation类型收缩为 Location类型 */
function normalizeLocation(raw, current, append, router) {
    let next = typeof raw === 'string' ? { path: raw } : raw;
    /**处理路径，路径上可能有查询参数和hash值 */
    const parsedPath = parsePath(next.path || '');
    /**初始时，浏览器地址可能没有匹配的路由,则基路径为 '/' */
    const basePath = (current && current.path) || '';
    /** to='?a=1' 时，parsedPath.path 为 ''  */
    const path = parsedPath.path
        ? resolvePath(parsedPath.path, basePath, append)
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

function createRoute(record = null, location, redirectedFrom, router) {
    const route = {
        path: location.path || '/',
        fullPath: getFullPath(location),
        matched: formatMatch(record),
    };
    return route;
}
/**初始路径 */
const START = createRoute(null, {
    path: '/',
});
function formatMatch(record) {
    const res = [];
    /**处理嵌套路由,必须 unshift()，配合 router-view 的 depth 属性，先访问父组件，再访问子组件 */
    while (record) {
        res.unshift(record);
        record = record.parent;
    }
    return res;
}
function getFullPath(location) {
    return location.path || '';
}

function createMatcher(routes, router) {
    const { pathList, pathMap, nameMap } = createRouteMap(routes);
    function match(raw, currentRoute, redirectedFrom) {
        const location = normalizeLocation(raw, currentRoute, false);
        const { name } = location;
        if (name) ;
        else if (location.path) {
            location.params = {};
            for (let i = 0; i < pathList.length; i++) {
                const path = pathList[i];
                const record = pathMap[path];
                /**如果 location 满足record 的正则匹配，则路径匹配成功,创建一条路由 route */
                if (matchRoute(record.regex, location.path, location.params)) {
                    return _createRoute(record, location);
                }
            }
        }
        /**location 未匹配到任何 RouteRecord */
        return _createRoute(null, location);
    }
    /**动态添加的路由拼接到静态路由上 */
    function addRoutes(routes) {
        createRouteMap(routes, pathList, pathMap, nameMap);
    }
    /**返回 RouteConfig[] 处理成 RouteRecord[] */
    function getRoutes() {
        return pathList.map((path) => pathMap[path]);
    }
    function _createRoute(record, location, redirectedFrom) {
        return createRoute(record, location);
    }
    return {
        match,
        addRoutes,
        getRoutes,
    };
}
function matchRoute(regex, path, params) {
    const m = path.match(regex);
    if (!m) {
        return false;
    }
    else if (!params) {
        return true;
    }
    return true;
}

const inBrowser = typeof window !== 'undefined';

/**将 source 上的属性赋值到 target 上 */
function extend(target, source) {
    for (let key in source) {
        target[key] = source[key];
    }
    return target;
}

const Time = inBrowser && window.performance ? window.performance : Date;
function genStateKey() {
    return Time.now().toFixed(3);
}
let _key = genStateKey();
function getStateKey() {
    return _key;
}
function setStateKey(key) {
    return (_key = key);
}

const supportsPushState = inBrowser &&
    (function () {
        const ua = window.navigator.userAgent;
        if ((ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
            ua.indexOf('Mobile Safari') !== -1 &&
            ua.indexOf('Chrome') === -1 &&
            ua.indexOf('Windows Phone') === -1) {
            return false;
        }
        return window.history && typeof window.history.pushState === 'function';
    })();
/**
 * url为 undefined 时,history API 什么也不做,location API 会跳转 undefined 地址
 */
function pushState(url, replace) {
    const history = window.history;
    try {
        if (replace) {
            const stateCopy = extend({}, history.state);
            stateCopy.key = getStateKey();
            history.replaceState(stateCopy, '', url);
        }
        else {
            history.pushState({ key: setStateKey(genStateKey()) }, '', url);
        }
    }
    catch (e) {
        url && window.location[replace ? 'replace' : 'assign'](url);
    }
}
function replaceState(url) {
    pushState(url, true);
}

class History {
    constructor(router, base) {
        this.router = router;
        /**收集事件监听，卸载时取消事件监听 */
        this.listeners = [];
        /**路由失败时的调用列 */
        this.errorCbs = [];
        /**初始化时路径为 '/',匹配项 matched 为空数组，等待 router.init()调用 */
        this.current = START;
        this.base = normalizeBase(base);
    }
    listen(cb) {
        this.cb = cb;
    }
    /** 将路径映射为路由 */
    transitionTo(location, onComplete, onAbort) {
        let route;
        try {
            route = this.router.match(location, this.current);
            // console.log('route', route);
            // console.log('current', this.current);
        }
        catch (e) {
            /**路由导航失败，调用用户传入的 error 回调 */
            this.errorCbs.forEach((cb) => cb(e));
            /**控制台显示报错 */
            throw e;
        }
        this.updateRoute(route);
        this.current;
        onComplete && onComplete();
    }
    /**注册路由导航时的错误回调 */
    onError(errorCb) {
        this.errorCbs.push(errorCb);
    }
    updateRoute(route) {
        var _a;
        this.current = route;
        (_a = this.cb) === null || _a === void 0 ? void 0 : _a.call(this, route);
    }
}
function normalizeBase(base) {
    if (!base) {
        /**浏览器端获取 base 标签的 href 属性 */
        if (inBrowser) {
            const baseEl = document.querySelector('base');
            base = (baseEl && baseEl.getAttribute('href')) || '/';
            /**获取 URL 中的 path http://aaa.com/bbb/ => /bbb/ */
            base = base.replace(/https?:\/\/[^\/]+/, '');
        }
        else {
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

class HashHistory extends History {
    constructor(router, base, fallback) {
        super(router, base);
        ensureSlash();
    }
    go(n) { }
    push(location, onComplete, onAbort) {
        console.log('hash push');
        // this.history.push();
        window.location.hash = location.toString();
    }
    replace(location, onComplete, onAbort) {
        console.log('hash replace');
    }
    getCurrentLocation() {
        return getHash();
    }
    setupListeners() {
        if (this.listeners.length)
            return;
        const handleRoutingEvent = () => {
            if (!ensureSlash()) {
                return;
            }
            /**当地址栏改变时，重新获取 hash 值，映射新的路由 */
            this.transitionTo(getHash(), (route) => {
            });
        };
        /**浏览器前进后退或者地址栏回车会触发事件 */
        const eventType = supportsPushState ? 'popstate' : 'hashchange';
        window.addEventListener(eventType, handleRoutingEvent);
        this.listeners.push(() => {
            window.removeEventListener(eventType, handleRoutingEvent);
        });
    }
}
/** '#/foo' => '/foo' */
function getHash() {
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
    if (path.charAt(0) === '/')
        return true;
    replaceHash('/' + path);
    return false;
}
function replaceHash(path) {
    if (supportsPushState) {
        replaceState(getUrl(path));
    }
    else {
        window.location.replace(getUrl(path));
    }
}
/**
 * http://aaa.com/bbb/ccc#foo
 *  转成
 * http://aaa.com/bbb/ccc + # + /foo
 */
function getUrl(path) {
    const href = window.location.href;
    const index = href.indexOf('#');
    const base = index >= 0 ? href.slice(0, index) : href;
    return `${base}#${path}`;
}

var View = {
    name: 'RouterView',
    /**函数式组件不用管理任何状态，渲染就完事了 */
    functional: true,
    props: {
        /**命名视图 */
        name: {
            type: String,
            default: 'default',
        },
    },
    render(_, context) {
        var _a;
        let { props, parent, data, children } = context;
        const createElement = parent.$createElement;
        /**
         * 标识当前组件是通过 router-view 渲染的，当前组件有子组件时，根据父组件的 routerView 属性
         * 从 record.matched[++depth] 中获取子组件，而不是 record.matched[depth]
         */
        data.routerView = true;
        /**命名视图，默认为 defualt  */
        const name = props.name;
        /**函数式组件中无 this,无法通过 this.$route 访问到路由 */
        const route = parent.$route;
        let depth = 0;
        /** while 循环停止的条件是 parent 为根实例,即当前组件为第一层 router-view*/
        while (parent && parent._routerRoot !== parent) {
            const vnodeData = parent.$vnode
                ? (_a = parent.$vnode.data) !== null && _a !== void 0 ? _a : {}
                : {};
            if (vnodeData.routerView) {
                depth++;
            }
            parent = parent.$parent;
        }
        const matched = route.matched[depth];
        const component = matched && matched.components[name];
        /**
         * matched 未匹配到:比如 path='/',但未配置{path:'/',component:xxx}
         * component 未匹配到:比如路由配置 {path:'/',components:{foo:xxx}},但 router-view 为默认视图时，匹配失败
         */
        if (!matched || !component) {
            return createElement();
        }
        return createElement(component, data, children);
    },
};

const noop = () => { };
var Link = {
    name: 'RouterLink',
    props: {
        tag: {
            type: String,
            default: 'a',
        },
        /**目标路由链接 */
        to: {
            type: [String, Object],
        },
        /**是否替换历史记录 */
        replace: {
            type: Boolean,
            default: false,
        },
        /**
         * 是否将当前路径加到父路径上
         * 路由:/foo/bar
         *  1.<router-link to="bar">bar</router-link>
         *    没有设置 append,则根据 to 解析得到的路径为 '/bar'
         *  2.<router-link to="bar" :append='true'>bar</router-link>
         *    设置 append,则to解析时，将父路径传入，得到结果 '/foo/bar'
         */
        append: {
            type: Boolean,
            default: false,
        },
        /**用来触发导航的事件 */
        event: {
            type: [String, Object],
            default: 'click',
        },
    },
    render(createElement) {
        const data = {};
        const router = this.$router;
        const current = this.$route;
        const { location, route, href } = router.resolve(this.to, current, this.append);
        const handler = (e) => {
            if (guardEvent(e)) {
                if (this.replace) {
                    router.replace('/foo', noop);
                }
                else {
                    router.push('/foo', noop);
                }
            }
        };
        const on = { click: guardEvent };
        if (Array.isArray(this.event)) {
            this.event.forEach((e) => (on[e] = handler));
        }
        else {
            on[this.event] = handler;
        }
        if (this.tag === 'a') {
            data.on = on;
            data.attrs = { href };
        }
        return createElement(this.tag, data, this.$slots.default);
    },
};
/**并非任何操作都会触发路由跳转 */
function guardEvent(e) {
    /**按下系统修饰键，触发特殊浏览器操作，不参与路由 */
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
        return false;
    if (e.defaultPrevented)
        return false;
    /**仅点击鼠标主键时触发路由 */
    if (e.button && e.button !== 0)
        return false;
    /**
     * <router-link to="/foo" target="_blank">foo</router-link>
     * 如果有 target='_blank',则当做普通超链接跳转
     */
    if (e.currentTarget && e.currentTarget.getAttribute) {
        const target = e.currentTarget.getAttribute('target');
        if (target && /\b_blank\b/i.test(target))
            return false;
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    return true;
}

let _Vue;
const install = function (Vue) {
    if (!!install.installed && _Vue === Vue)
        return;
    install.installed = true;
    _Vue = Vue;
    const isDef = (v) => v !== undefined;
    Vue.mixin({
        beforeCreate() {
            var _a;
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
                Vue.util.defineReactive(this, '_route', (_a = this._router.history) === null || _a === void 0 ? void 0 : _a.current);
            }
            else {
                /**所有子组件的 _routerRoot 指向根实例 */
                this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
            }
        },
        destroyed() { },
    });
    /**vm.$route 访问路由器 */
    Reflect.defineProperty(Vue.prototype, '$router', {
        get() {
            return this._routerRoot._router;
        },
    });
    /**vm.$route 访问当前路由 */
    Reflect.defineProperty(Vue.prototype, '$route', {
        get() {
            return this._routerRoot._route;
        },
    });
    /**注册全局组件 */
    Vue.component('RouterView', View);
    Vue.component('RouterLink', Link);
};

// export type RouterMode = 'hash' | 'history' | 'abstract';
var RouterMode;
(function (RouterMode) {
    RouterMode["Hash"] = "hash";
    RouterMode["History"] = "history";
    RouterMode["Abstract"] = "abstract";
})(RouterMode || (RouterMode = {}));

class HTML5History extends History {
    constructor(router, base) {
        super(router, base);
    }
    go() { }
    push(location, onComplete, onAbort) {
        console.log('push');
        // this.history.push();
    }
    replace(location, onComplete, onAbort) {
        console.log('replace');
    }
    getCurrentLocation() {
        return getLocation(this.base);
    }
    setupListeners() {
        if (this.listeners.length)
            return;
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
function getLocation(base) {
    let path = window.location.pathname;
    const pathLowerCase = path.toLocaleLowerCase();
    const baseLowerCase = base.toLocaleLowerCase();
    if (base &&
        (pathLowerCase == baseLowerCase ||
            pathLowerCase.indexOf(cleanPath(baseLowerCase + '/')) === 0)) {
        path = path.slice(base.length);
    }
    return (path || '/') + window.location.search + window.location.hash;
}

class AbstractHistory extends History {
    constructor(router, base) {
        super(router, base);
    }
    go() { }
    push(location, onComplete, onAbort) {
        console.log('push');
        // this.history.push();
    }
    replace(location, onComplete, onAbort) {
        console.log('replace');
    }
    getCurrentLocation() {
        return 's';
    }
    setupListeners() { }
}

class VueRouter {
    constructor(options = {}) {
        this.options = options;
        this.app = null;
        this.apps = [];
        this.mode = RouterMode.Hash;
        this.beforeHooks = [];
        this.afterHooks = [];
        {
            warn(new.target === VueRouter, `Router must be called with the new operator.`);
        }
        /**创建 路由-组件 映射表 */
        this.matcher = createMatcher(options.routes || []);
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
                {
                    assert(false, `invalid mode: ${this.mode}`);
                }
        }
    }
    /**
     * app:vue根实例
     * Vue 内部会根据 _router 实例调用 init 方法，在调用前必须先通过 Vue.use(VueRouter) 调用 install 方法，注册router
     */
    init(app) {
        /**没有使用 Vue.use(VueRouter) 调用 install 方法时报错 */
        assert(install.installed, `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
                `before creating root instance.`);
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
            const setupListeners = (routeOrError) => {
                history.setupListeners();
            };
            /**初次根据浏览器上的路径匹配路由,匹配成功后添加事件监听，监听浏览器操作 */
            history.transitionTo(history.getCurrentLocation(), setupListeners, setupListeners);
        }
        /**
         * 更新 vm 上的_route
         * 响应式添加:
         * vm.$set(this,'_route',current)
         * current = route2;并不会触发响应式
         * 应该 vm._route = route2;
         */
        history === null || history === void 0 ? void 0 : history.listen((route) => {
            /**路径的变化交给 router 内部处理，视图层只监听 app._route 的值,_route改变时，获取 _route.matched ,重新渲染 */
            this.apps.forEach((app) => (app._route = route));
        });
    }
    match(raw, current, redirectedFrom) {
        return this.matcher.match(raw, current, redirectedFrom);
    }
    getRoutes() {
        return this.matcher.getRoutes();
    }
    onError(cb) {
        var _a;
        (_a = this.history) === null || _a === void 0 ? void 0 : _a.onError(cb);
    }
    push(location, onComplete, onAbort) {
        var _a;
        (_a = this === null || this === void 0 ? void 0 : this.history) === null || _a === void 0 ? void 0 : _a.push(location, onComplete, onAbort);
    }
    replace(location, onComplete, onAbort) {
        var _a;
        (_a = this === null || this === void 0 ? void 0 : this.history) === null || _a === void 0 ? void 0 : _a.replace(location, onComplete, onAbort);
    }
    resolve(to, current, append) {
        var _a, _b;
        current = current || ((_a = this.history) === null || _a === void 0 ? void 0 : _a.current);
        const location = normalizeLocation(to, current, append);
        const route = this.match(location, current);
        const fullPath = route.fullPath;
        const base = ((_b = this.history) === null || _b === void 0 ? void 0 : _b.base) || '/';
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
}
VueRouter.install = install;
/**声明为字符串值，即使 @rollup/plugin-replace 插件替换失败，也不会报错 */
VueRouter.version = '1.0.0';
function createHref(base, fullPath, mode) {
    var path = mode === 'hash' ? '#' + fullPath : fullPath;
    return base ? cleanPath(base + '/' + path) : path;
}

export { VueRouter as default };
