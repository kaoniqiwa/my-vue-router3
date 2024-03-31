import VueRouter from '..';
import { RawLocation } from '../types';
import { History } from './base';

export class AbstractHistory extends History {
  constructor(router: VueRouter, base?: string) {
    super(router, base);
  }
  go() {}
  push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('push');
    // this.history.push();
  }
  replace(location: RawLocation, onComplete?: Function, onAbort?: Function) {
    console.log('replace');
  }
  getCurrentLocation() {
    return 's';
  }
  setupListeners() {}
}
