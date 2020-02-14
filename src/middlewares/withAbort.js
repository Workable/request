import getAbortController from "../getAbortController";

/**
 * @description Injects an abort function in the request promise.
 * @example
 * const request = withAbort(basicRequest);
 * const promise = request('url.test');
 *
 * promise.abort(); // aborts the request
 * ------------------------------------
 * const promise = request('url.test', {timeoutMs: 1000});
 * const promise = request('url.test');
 *
 * // aborts the request if not respond after 1000 ms.
 */

export default request => (url, { timeoutMs = 5000, ...params }) => {
  const { signal, abort } = getAbortController();

  const timeoutId = setTimeout(abort, timeoutMs);

  const promise = request(url, {
    signal,
    ...params
  });

  const abortable = promise.then(data => {
    clearTimeout(timeoutId);
    return data;
  });

  abortable.abort = () => {
    abort();
    clearTimeout(timeoutId);
  };

  return abortable;
};
