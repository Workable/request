/**
 * @description Sends the request to the service worker in order to perform it when the device is back online.
 * It needs an extra handling in the service worker side, in order to cache the request with the 'bgSync: 1' header.
 *
 * @param bgSync When the bgSync is optimistic, the resolve cancels the request, the reject submits the request.
 *  When the bgSync is pessimistic, the reject cancels the request, the resolve submits the request.
 *
 * @example
 * const request = withBgSync(basicRequest);
 *
 * const promise = request('url.test', {bgSync: Promise.resolve(), bgSyncOptimistic: false});
 * // the request will be performed with the device is back online.
 *
 * const promise = request('url.test', {bgSync: Promise.reject()});
 * // the request will be performed with the device is back online.
 *
 * const promise = request('url.test', {bgSync: Promise.reject(), bgSyncOptimistic: false});
 * // cancels the bgSync process
 *
 * const promise = request('url.test', {bgSync: Promise.resolve()});
 * // cancels the bgSync process
 */

const noop = () => {};

const removeBgSyncedRequest = (url, method) =>
  navigator.serviceWorker.controller.postMessage({
    type: "removeBgSynced",
    url,
    method
  });

const offlineResponse = () => ({ status: -1, statusText: "offline" });

const availableBgSyncMethods = ["post", "delete", "put"];

export default request => (
  url,
  { bgSync, bgSyncOptimistic = true, ...params } = {}
) => {
  if (!bgSync) return request(url, params);

  if (!availableBgSyncMethods.includes(params?.method?.toLowerCase()))
    throw new Error(
      `'${params?.method}' request method is not supported by the bgSync`
    );

  const requestPromise = request(url, params);

  const promise = requestPromise.then(response => {
    if (response.statusText !== "offline") return response;

    const { headers } = params;
    const bgSyncRequest = () =>
      request(url, { ...params, headers: { ...headers, bgSync: "1" } });

    const optimistic = () =>
      bgSyncRequest().then(bgSyncResponse => {
        if (bgSyncResponse.statusText !== "bgSynced") return;

        return bgSync().then(() => removeBgSyncedRequest(url, params.method));
      });

    const pessimistic = () => bgSync().then(bgSyncRequest);

    const action = bgSyncOptimistic ? optimistic() : pessimistic();
    return action.catch(noop).then(offlineResponse);
  });

  promise.abort = requestPromise.abort;

  return promise;
};
