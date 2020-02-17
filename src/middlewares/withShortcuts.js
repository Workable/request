/**
 * @description Extends the request method with post/put/patch/del methods.
 * @example
 * const request = withShortcuts(basicRequest);
 * const promise = request.post('url.test', data);
 * // Creates a post request with the specific data in the paylaod of the body.
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
