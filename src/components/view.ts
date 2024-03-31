import { CreateElement, ComponentOptions, RenderContext, VNodeData } from 'vue';

export default {
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
  render(this: Vue, _: CreateElement, context: RenderContext) {
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
      const vnodeData: VNodeData = parent.$vnode
        ? parent.$vnode.data ?? {}
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
} as unknown as ComponentOptions<any, any, any, any, any, any>;
