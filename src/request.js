import XHRHandler from "./xhrHandler";
/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
const parseJSON = response => response.json().catch(() => {});

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) return response;

  const error = new Error(response.statusText);
  error.response = response;
  error.asyncHandler = XHRHandler.init(response);

  throw error;
};

const nativeFailure = (e) => {
  e.status = -1;
  e.statusText = e.name;
  return e;
};

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           An object containing either "data" or "err"
 */

export default (url, { method = "GET", headers = {}, ...options } = {}) => {
  options = {
    method,
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers
    }
  };

  const request = fetch(url, options);

  /* istanbul ignore if */
  if (process.env.NODE_ENV === "test" && !request) {
    const error = `fetch has not mocked for ${url}`;
    // eslint-disable-next-line no-console
    console.error(error);
    throw new Error(error);
  }

  return request.catch(nativeFailure).then(checkStatus).then(parseJSON);
};
