import { withCache, withAbort, withBgSync } from "./middlewares";
import request from "./request";

export { request, withCache, withAbort, withBgSync };
export default withCache(withBgSync(withAbort(request)));
