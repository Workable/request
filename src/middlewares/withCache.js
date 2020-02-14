import makeIDB from "@workablehr/idb";

const makeKey = (cacheStore, key) => `${cacheStore}.${key}`;

export default request => (
  url,
  { cacheStore, cache, cacheAge, cacheKey, ...params } = {}
) => {
  const fetch = () => request(url, params);

  if (cache && cacheStore)
    return makeIDB(cacheStore).get(makeKey(cacheStore, cacheKey || url), {
      fetch,
      maxAge: cacheAge
    });

  return fetch();
};
