const noop = () => {};

export default () => {
  if (!window.AbortController) return { signal: {}, abort: noop };

  const controller = new AbortController();
  const abort = () => {
    try {
      controller.abort();
      return "aborted";
    } catch (e) {
      return e;
    }
  };
  return {
    signal: controller.signal,
    abort
  };
};
