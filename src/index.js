import {
  withCache,
  withAbort,
  withAuthClient,
  withBgSync
} from "./middlewares";
import request from "./request";

export { request, withCache, withAbort, withAuthClient, withBgSync };
export default withAuthClient(withCache(withBgSync(withAbort(request))));
