import getAbortController from "../getAbortController";

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
