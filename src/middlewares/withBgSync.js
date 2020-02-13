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
