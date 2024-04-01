import { NavigationGuard } from '../types';

/**使用 iterator 遍历 queue,完成后调用 complete 方法 */
export function runQueue(
  queue: Array<NavigationGuard>,
  iterator: Function,
  complete: Function
) {
  const step = (index: number) => {
    /**完成 queue 的遍历 */
    if (index >= queue.length) {
      complete();
    } else {
      iterator(queue[index], () => {
        step(index + 1);
      });
    }
  };
  step(0);
}
