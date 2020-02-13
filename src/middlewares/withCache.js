import makeIDB from "@workablehr/idb";

const makeKey = key => `workable.${key}`;

export default request => (
  url,
  { cacheStore, cache, cacheAge, cacheKey, ...params } = {}
) => {
  const fetch = () => request(url, params);

  if (cache && cacheStore)
    return makeIDB(cacheStore).get(makeKey(cacheKey || url), {
      fetch,
      maxAge: cacheAge
    });

  return fetch();
};
