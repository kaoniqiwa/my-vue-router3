/**
 * \s:匹配空白符
 * (?:aaa):匹配 aaa，但不会捕获,不要和动态路由 /user/:id 混淆
 * // => /
 * /// => /
 * /  / => /
 * /  /   / => /
 * /   /aaa/   / => /aaa/
 */
export function cleanPath(path: string) {
  return path.replace(/\/(?:\s*\/)+/g, '/');
}

/**
 * path:'/foo?a=1&b=2#bbb'
 */
export function parsePath(path: string) {
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

/**根据基路径和当前路径，计算出绝对路径 */
export function resolvePath(relative: string, base: string, append?: boolean) {
  const firstChar = relative.charAt(0);
  /** to='/foo'已经是绝对路径 */
  if (firstChar === '/') return relative;

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
