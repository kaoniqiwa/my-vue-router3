import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import typescript from '@rollup/plugin-typescript';

/**使用 node 路径解析策略 */
import { nodeResolve } from '@rollup/plugin-node-resolve';

/**将 commonjs 代码编译成 esm 代码 */
import commonjs from '@rollup/plugin-commonjs';

/**替换打包后的代码字符串中的一些字符 */
import replace from '@rollup/plugin-replace';

/**将ES6+语法替换成 ES语法 */
import buble from '@rollup/plugin-buble';

/** esm 语法导入 json 文件---chrome 提案 */
// import jsonObject from '../package.json' assert { type: 'json' };
// console.log(jsonObject.version);

/***
 * Mac: export VERSION=1.0.0 node build/build.js
 * Windows: set VERSION=1.0.0 node build/build.js
 * 跨平台: cross-env VERSION=1.0.0 node build/build.js
 */

/**esm 中使用 require 函数 */
const require = createRequire(import.meta.url);
const version = process.env.VERSION || require('../package.json').version;
const banner = `/*!
  * vue-router v${version}
  * (c) ${new Date().getFullYear()} Kaoniqiwa
  * @license ISC
  */`;

/**
 * 提取文件 url 中的 path
 * file:///Users/aaa/bb/my-vue-router3/build/configs.mjs
 *  =>
 * /Users/aaa/bb/my-vue-router3/build/configs.mjs
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**__dirname 当前文件 configs.mjs 所在目录 */
const resolve = (_path) => path.resolve(__dirname, '../', _path);

export default [
  // {
  //   file: resolve('dist/vue-router.js'),
  //   format: 'umd',
  //   env: 'development',
  // },
  // {
  //   file: resolve('dist/vue-router.min.js'),
  //   format: 'umd',
  //   env: 'production',
  // },
  // {
  //   file: resolve('dist/vue-router.common.js'),
  //   format: 'cjs',
  // },
  // {
  //   file: resolve('dist/vue-router.esm.js'),
  //   format: 'es',
  // },
  {
    file: resolve('dist/vue-router.esm.browser.js'),
    format: 'es',
    env: 'development',
    transpile: false /**默认ES6+语法转成 ES5语法, 现代浏览器都支持ES6+语法,不需要转 */,
  },
  // {
  //   file: resolve('dist/vue-router.esm.browser.min.js'),
  //   format: 'es',
  //   env: 'production',
  //   transpile: false,
  // },
].map(getConfig);

function getConfig(opts) {
  const config = {
    input: {
      input: 'src/index.ts',
      plugins: [
        typescript(),
        nodeResolve({
          extensions: ['.js', '.ts', '.mjs', '.json'],
        }),
        commonjs(),
        replace({
          preventAssignment: true,
          __VERSION__: version,
        }),
      ],
    },
    output: {
      file: opts.file,
      format: opts.format,
      name: 'VueRouter' /**umd 和 iife 格式需要 */,
      banner,
    },
  };
  if (opts.env) {
    /**浏览器端没有 process API ,需要替换成其他 */
    config.input.plugins.unshift(
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(opts.env),
      })
    );
  }
  if (opts.transpile !== false) {
    config.input.plugins.unshift(buble());
  }

  return config;
}
