/**
 * @description Caches a request in the indexed DB.
 * @example
 * const request = withCache(basicRequest, 'workable');
 * const promise = request('url.test', {cache: true, cacheAge: 60, cacheKey: 'test'});
 * // caches the request for 60 seconds, in the namespace workable.test of the indexDB.
 */

export default request => {
  const makeRequest = (url, method, data, params) =>
    request(url, {
      ...params,
      method,
      ...(data && { body: JSON.stringify(data) })
    });

  request.post = (url, data, params) => makeRequest(url, "POST", data, params);

  request.put = (url, data, params) => makeRequest(url, "PUT", data, params);

  request.patch = (url, data, params) =>
    makeRequest(url, "PATCH", data, params);

  request.del = (url, params) => makeRequest(url, "DELETE", null, params);

  return request;
};
