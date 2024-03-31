import { existsSync, mkdirSync, writeFile } from 'fs';
import { rollup } from 'rollup';
import configs from './configs.mjs';
import { relative } from 'path';
import { minify } from 'terser';
import { gzip } from 'zlib';

/**如果没有 dist 目录，则创建 dist 目录 */
if (!existsSync('dist')) {
  mkdirSync('dist');
}

build(configs);
/**
 *
 * @param {Array<any>} builds
 */
function build(builds) {
  let built = 0;
  const total = builds.length;
  const next = () => {
    buildEntry(builds[built])
      .then(() => {
        built++;
        if (built < total) {
          next();
        }
      })
      .catch(logError);
  };
  next();
}

function buildEntry({ input, output }) {
  const { file, banner } = output;
  /**生产环境的文件需要压缩 */
  const isProd = /min\.js/.test(file);

  /**
   * 从 input 入口文件打包，返回打包结果 RollupBuild
   * 根据 output，将打包结果转成不同格式的输出 bundle.generate(output)
   */
  return rollup(input)
    .then((bundle) => bundle.generate(output))
    .then((bundle) => {
      /**bundle.output 是 chunk 数组,由于只有一个入口文件，所以数组长度为1,code 为结果字符串 */
      const code = bundle.output[0].code;
      if (isProd) {
        /**使用 terser 压缩代码，比如取消回车，多余空格，1+1 简化成2 */
        return minify(code, {
          toplevel: true,
          output: {
            ascii_only: true /**将 unicode 字符集收缩为 ascii 字符集 */,
          },
          compress: {
            pure_funcs: ['makeMap'],
          },
        }).then(({ code }) => {
          const minified = (banner ? banner + '\n' : '') + code;
          return write(file, minified, true);
        });
      } else {
        return write(file, code);
      }
    });
}

function write(dest, code, zip) {
  return new Promise((resolve, reject) => {
    /**
   *
   * dest 是文件绝对路径 /Users/aaa/Project/my-vue-router3/dist/vue-router.js
   * process.cwd() 是当前项目录路径 /Users/aaa/Project/my-vue-router3
   * relative(process.cwd(),desc) =>  dist/vue-router.js
   *
   * @description 在控制台打印 
   *    dist/vue-router.js 85.99kb
   *    dist/vue-router.min.js 28.53kb (gzipped: 9.80kb)

   */
    function report(extra) {
      console.log(
        blue(relative(process.cwd(), dest)) +
          ' ' +
          getSize(code) +
          (extra || '')
      );
      resolve();
    }

    /**将 js 字符串写入文件 */
    writeFile(dest, code, (err) => {
      if (err) {
        return reject(err);
      }
      if (zip) {
        /**计算通过 zlib API 获取压缩后的大小,压缩后并未保存成 .gz 文件 */
        gzip(code, (err, zipped) => {
          if (err) return reject(err);
          report(' (gzipped: ' + getSize(zipped) + ')');
        });
      } else {
        report();
      }
    });
  });
}

function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb';
}
/**
 * 在控制台打印特殊颜色
 * '\x1b' 为 esc 控制符的 ASCII 码，表示后面的字符为转义字符
 * '[' => 转义开始
 *  '1' => 代表加粗
 *  'm' => 转义结束
 *  '34' => 前景色蓝色
 *  '39' => 默认前景色
 *  '22' => 正常颜色
 */
function blue(str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m';
}

function logError(e) {
  console.log(e);
}
