import { NavigationFailureType, Route } from '../types';

export function createNavigationAbortedError(from: Route, to: Route) {
  return createRouterError(
    from,
    to,
    NavigationFailureType.aborted,
    `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`
  );
}
export function createNavigationCancelledError(from: Route, to: Route) {
  return createRouterError(
    from,
    to,
    NavigationFailureType.cancelled,
    `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`
  );
}
export function isError(e: any) {
  return Object.prototype.toString.call(e) === '[object Error]';
}

export function isNavigationFailure(
  err: any,
  errorType?: NavigationFailureType
) {
  return (
    isError(err) &&
    err._isRouter &&
    (errorType == null || err.type === errorType)
  );
}
function createRouterError(
  from: Route,
  to: Route,
  type: NavigationFailureType,
  message: string
) {
  const error: Record<string, any> = new Error(message);
  error.type = type;
  error._isRouter = true;
  error.from = from;
  error.to = to;

  return error as Error;
}

function stringifyRoute(rout: Route) {
  return 's';
}
