import getAbortController from "./index";

it("has AbortSignal and abort function", () => {
  const { signal, abort } = getAbortController();
  expect(signal).toBeInstanceOf(AbortSignal);
  expect(typeof abort === "function").toBeTruthy();
  expect(signal.aborted).toBeFalsy();
});

it("has default empty signal and noop abort", () => {
  const realAbortController = global.AbortController;
  global.AbortController = null;
  const { signal, abort } = getAbortController();
  expect(signal).not.toBeInstanceOf(AbortSignal);
  expect(signal).toEqual({});
  expect(typeof abort === "function").toBeTruthy();
  expect(signal.aborted).toBeUndefined();
  expect(abort()).toBeUndefined();
  global.AbortController = realAbortController;
});

it("doesn't throw on abort errors", () => {
  const { abort: abortSuccess, signal: signalSuccess } = getAbortController();
  expect(abortSuccess()).toBe("aborted");
  expect(signalSuccess.aborted).toBeTruthy();
  const realAbortController = global.AbortController;
  global.AbortController = function() {
    return {
      signal: { aborted: false },
      abort: jest.fn(() => {
        throw "Abort throws";
      })
    };
  };
  const { abort: abortFail, signal: signalFail } = getAbortController();
  expect(abortFail()).toBe("Abort throws");
  expect(signalFail.aborted).toBeFalsy();
  global.AbortController = realAbortController;
});
