import { CreateElement, VNodeData, ComponentOptions, PropType } from 'vue';
import { RawLocation } from '../types';
interface LinkProps {
  to: string | RawLocation;
  replace: boolean;
  append: boolean;
  event: string | Array<string>;
}
const noop = () => {};

export default {
  name: 'RouterLink',
  props: {
    tag: {
      type: String,
      default: 'a',
    },
    /**目标路由链接 */
    to: {
      type: [String, Object as PropType<RawLocation>],
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
      type: [String, Object as PropType<Array<string>>],
      default: 'click',
    },
  },
  render(this: Vue & LinkProps, createElement: CreateElement) {
    const data: VNodeData = {};

    const router = this.$router;
    const current = this.$route;
    const { location, route, href } = router.resolve(
      this.to,
      current,
      this.append
    );

    const handler = (e: PointerEvent) => {
      if (guardEvent(e)) {
        if (this.replace) {
          router.replace('/foo', noop);
        } else {
          router.push('/foo', noop);
        }
      }
    };
    const on: { [key: string]: (...args: any) => any } = { click: guardEvent };
    if (Array.isArray(this.event)) {
      this.event.forEach((e) => (on[e] = handler));
    } else {
      on[this.event] = handler;
    }
    if (this.tag === 'a') {
      data.on = on;
      data.attrs = { href };
    } else {
    }

    return createElement(this.tag, data, this.$slots.default);
  },
} as unknown as ComponentOptions<any, any, any, any, any, any>;

/**并非任何操作都会触发路由跳转 */
function guardEvent(e: PointerEvent): boolean {
  /**按下系统修饰键，触发特殊浏览器操作，不参与路由 */
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false;
  if (e.defaultPrevented) return false;
  /**仅点击鼠标主键时触发路由 */
  if (e.button && e.button !== 0) return false;
  /**
   * <router-link to="/foo" target="_blank">foo</router-link>
   * 如果有 target='_blank',则当做普通超链接跳转
   */
  if (e.currentTarget && (e.currentTarget as HTMLAnchorElement).getAttribute) {
    const target = (e.currentTarget as HTMLAnchorElement).getAttribute(
      'target'
    );
    if (target && /\b_blank\b/i.test(target)) return false;
  }
  if (e.preventDefault) {
    e.preventDefault();
  }
  return true;
}
