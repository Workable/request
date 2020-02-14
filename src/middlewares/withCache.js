import makeIDB from "@workablehr/idb";

/**
 * @description Caches a request in the indexed DB.
 * @example
 * const request = withCache(basicRequest, 'workable');
 * const promise = request('url.test', {cache: true, cacheAge: 60, cacheKey: 'test'});
 * // caches the request for 60 seconds, in the namespace workable.test of the indexDB.
 */

const makeKey = (cacheStore, key) => `${cacheStore}.${key}`;

export default (request, genericCacheStore) => (
  url,
  { cacheStore = genericCacheStore, cache, cacheAge, cacheKey, ...params } = {}
) => {
  const fetch = () => request(url, params);

  if (cache && cacheStore)
    return makeIDB(cacheStore).get(makeKey(cacheStore, cacheKey || url), {
      fetch,
      maxAge: cacheAge
    });

  return fetch();
};
