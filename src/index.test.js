import makeIDB from "@workablehr/idb";
import baseRequest, { withCache, withBgSync, withAbort } from "./index";

const request = withCache(withBgSync(withAbort(baseRequest)));

jest.mock("@workablehr/idb", () => jest.fn(() => ({ get: jest.fn() })));

let timeoutId;
const abortSpy = jest.fn();

const mockResponseOnce = () => {
  fetch.mockResponseOnce(
    () =>
      new Promise(
        resolve =>
          (timeoutId = setTimeout(() => resolve({ body: '"12345"' }), 0))
      ),
    1
  );
  return () => {
    clearTimeout(timeoutId);
    fetch.resetMocks();
  };
};

const mockServiceWorker = () => {
  const { serviceWorker } = navigator;
  navigator.serviceWorker = { controller: { postMessage: jest.fn() } };
  return () => {
    navigator.serviceWorker = serviceWorker;
  };
};

const mockedAbortController = {
  signal: {},
  abort: () => {
    abortSpy();
    clearTimeout(timeoutId);
    fetch.resetMocks();
  }
};
jest.mock("./getAbortController", () => () => mockedAbortController);

it("submits a request", async () => {
  const clearMock = mockResponseOnce();
  const response = await request("mockUrl");
  expect(response).toBe("12345");
  expect(abortSpy).not.toBeCalled();
  clearMock();
});

it("aborts a request", async () => {
  const responseSpy = jest.fn();
  const clearMock = mockResponseOnce();
  const requestPromise = request("mockUrl");
  requestPromise.then(responseSpy);
  requestPromise.abort();

  jest.advanceTimersByTime(10);
  expect(responseSpy).not.toBeCalled();
  expect(abortSpy).toBeCalled();
  clearMock();
});

describe("cache", () => {
  let get;

  beforeEach(() => {
    get = jest.fn();
    makeIDB.mockImplementation(() => ({ get }));
  });

  it("doesn't cache a request", async () => {
    const clearMock = mockResponseOnce();
    const withCacheRequest = withCache(baseRequest);
    await withCacheRequest("mockUrl");
    expect(makeIDB).not.toBeCalled();
    clearMock();
  });

  it("caches a request on key", async () => {
    const clearMock = mockResponseOnce();
    const withCacheRequest = withCache(baseRequest);
    await withCacheRequest("mockUrl", {
      cache: true,
      cacheStore: "test-store",
      fetch: n => n,
      cacheKey: "test",
      param: "some-param"
    });
    expect(makeIDB).toBeCalledTimes(1);
    expect(makeIDB).toBeCalledWith("test-store");
    expect(get).toBeCalledTimes(1);
    expect(get).toBeCalledWith("test-store.test", {
      fetch: expect.any(Function)
    });
    clearMock();
  });

  it("caches a request with max age", async () => {
    const clearMock = mockResponseOnce();
    const maxAge = 10;
    const withCacheRequest = withCache(baseRequest);
    await withCacheRequest("mockUrl", {
      cache: true,
      cacheStore: "test-store",
      fetch: n => n,
      cacheAge: maxAge
    });
    expect(makeIDB).toBeCalledTimes(1);
    expect(makeIDB).toBeCalledWith("test-store");
    expect(get).toBeCalledTimes(1);
    expect(get).toBeCalledWith("test-store.mockUrl", {
      fetch: expect.any(Function),
      maxAge
    });
    clearMock();
  });

  it("caches a request with default values", async () => {
    const clearMock = mockResponseOnce();
    const withCacheRequest = withCache(baseRequest);
    await withCacheRequest("mockUrl", {
      cache: true,
      cacheStore: "test-store",
      fetch: n => n
    });
    expect(makeIDB).toBeCalledTimes(1);
    expect(makeIDB).toBeCalledWith("test-store");
    expect(get).toBeCalledTimes(1);
    expect(get).toBeCalledWith("test-store.mockUrl", {
      fetch: expect.any(Function),
      maxAge: undefined
    });
    clearMock();
  });
});

it("bypasses bgSync request", async () => {
  const clearMock = mockResponseOnce();
  const bgSyncRequest = withBgSync(baseRequest);
  expect(await bgSyncRequest("mockUrl")).toBe("12345");
  clearMock();
});

it("should not bgSync a request when online", async () => {
  const clearMock = mockResponseOnce();
  const bgSync = jest.fn().mockImplementation();
  expect(
    await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync
    })
  ).toBe("12345");
  expect(bgSync).not.toBeCalled();
  clearMock();
});

it("should not bgSync a request on GET method", () => {
  const clearMock = mockResponseOnce();
  const bgSync = jest.fn().mockImplementation();
  expect(() => request("mockUrl", { bgSync })).toThrowError(/not supported/);
  clearMock();
});

describe("bgSync optimistic", () => {
  let cleanupServiceWorker;

  beforeEach(() => {
    cleanupServiceWorker = mockServiceWorker();
  });
  afterEach(() => {
    cleanupServiceWorker();
  });

  it("should not bgSync if the request fail", async () => {
    mockServiceWorker();
    const bgSync = jest.fn().mockImplementation(() => Promise.reject());
    fetch.mockResponses(
      [JSON.stringify({ statusText: "offline" })],
      [JSON.stringify({ statusText: "invalidResponse" })]
    );

    const response = await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync,
      bgSyncOptimistic: true
    });

    expect(response).toEqual({ status: -1, statusText: "offline" });
    expect(bgSync).not.toBeCalled();
    expect(fetch).toBeCalledTimes(2);
    expect(navigator.serviceWorker.controller.postMessage).not.toBeCalled();
  });

  it("should bgSync a request", async () => {
    mockServiceWorker();
    const bgSync = jest.fn().mockImplementation(() => Promise.reject());
    fetch.mockResponses(
      [JSON.stringify({ statusText: "offline" })],
      [JSON.stringify({ statusText: "bgSynced" })]
    );

    const response = await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync,
      bgSyncOptimistic: true
    });

    expect(response).toEqual({ status: -1, statusText: "offline" });
    expect(bgSync).toHaveBeenCalled();
    expect(fetch).toBeCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.bgSync).toBe("1");
    expect(navigator.serviceWorker.controller.postMessage).not.toBeCalled();
  });

  it("should prevent the bgSync a request", async () => {
    navigator.serviceWorker = { controller: { postMessage: jest.fn() } };
    const bgSync = jest.fn().mockImplementation(() => Promise.resolve());
    fetch.mockResponses(
      [JSON.stringify({ statusText: "offline" })],
      [JSON.stringify({ statusText: "bgSynced" })]
    );

    const response = await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync
    });

    expect(response).toEqual({ status: -1, statusText: "offline" });
    expect(bgSync).toHaveBeenCalled();
    expect(fetch).toBeCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.bgSync).toBe("1");
    expect(navigator.serviceWorker.controller.postMessage).toBeCalledWith({
      type: "removeBgSynced",
      url: "mockUrl",
      method: "POST"
    });
  });
});

describe("bgSync pessimistic", () => {
  it("should bgSync a request when user confirm", async () => {
    const bgSync = jest.fn().mockImplementation(() => Promise.resolve());
    fetch.mockResponses(
      [JSON.stringify({ statusText: "offline" })],
      [JSON.stringify({ statusText: "bgSynced" })]
    );

    const response = await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync,
      bgSyncOptimistic: false
    });

    expect(response).toEqual({ status: -1, statusText: "offline" });
    expect(bgSync).toHaveBeenCalled();
    expect(fetch).toBeCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.bgSync).toBe("1");
  });

  it("should prevent the bgSync when user does not confirm", async () => {
    const bgSync = jest.fn().mockImplementation(() => Promise.reject());
    fetch.mockResponses(
      [JSON.stringify({ statusText: "offline" })],
      [JSON.stringify({ statusText: "bgSynced" })]
    );

    const response = await request("mockUrl", {
      body: JSON.stringify({ myData: 1 }),
      method: "POST",
      bgSync,
      bgSyncOptimistic: false
    });

    expect(response).toEqual({ status: -1, statusText: "offline" });
    expect(bgSync).toHaveBeenCalled();
    expect(fetch).toBeCalledTimes(1);
  });
});
