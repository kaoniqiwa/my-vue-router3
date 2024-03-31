import { inBrowser } from './dom';

const Time = inBrowser && window.performance ? window.performance : Date;

export function genStateKey() {
  return Time.now().toFixed(3);
}

export let _key = genStateKey();

export function getStateKey() {
  return _key;
}
export function setStateKey(key: string) {
  return (_key = key);
}
