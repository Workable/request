export default request => (
  url,
  { authClient, withAuthClientError, ...params } = {}
) => {
  if (!authClient) return request(url, params);

  return withAuthClientError(authClient.getTokenSilently()).then(
    ({ id_token }) =>
      request(url, {
        ...params,
        headers: { ...params.headers, Authorization: `BEARER ${id_token}` }
      })
  );
};
