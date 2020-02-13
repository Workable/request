const identity = i => i;

export const handle404 = (callback = identity) => () => callback("error.404");
export const handle422 = (callback = identity) => body => callback(body);
export const handle500 = (callback = identity) => () => callback("error.500");

const handlerFactory = {
  response: null,
  status: null,
  handlers: [],
  fallback: null,
  cleanupCallback: null,

  async init(response = {}) {
    if (!response || !response.status) {
      throw new Error("XHRHandler error: Cannot handle non Response types");
    }
    if (response.statusText === "abort") {
      return response;
    }

    return await this.setResponse(response);
  },

  handle() {
    let handled = false;
    this.handlers.forEach(handler => {
      if (handled) {
        return;
      }

      let match = !handler.status || this.response.status === handler.status;
      if (handler.negated) {
        match = !match;
      }

      if (match) {
        handled = this.executeHandler(handler);
      }
    });

    if (!handled) {
      this.executeFallback();
    }

    this.cleanup();
    this.clear();
  },

  executeHandler(handler) {
    if (handler && typeof handler.callback === "function") {
      handler.callback(this.body, this.response);
      return true;
    }
    return false;
  },

  when(status, callback, negated) {
    if (typeof callback !== "function") {
      throw new Error("Callback should be a function");
    }

    if (typeof status === "string") {
      throw new Error("Status should be a number");
    }

    return this.addHandler({
      status,
      callback,
      negated
    });
  },

  whenNot(status, callback) {
    return this.when(status, callback, true);
  },

  otherwise(callback) {
    return this.setFallback(callback);
  },

  always(callback) {
    return this.setCleanupCallback(callback);
  },

  addHandler(handler) {
    this.handlers.push(handler);
    return this;
  },

  setFallback(callback) {
    if (typeof callback !== "function") {
      throw new Error("Fallback should be a function");
    }
    this.fallback = callback;
    return this;
  },

  setCleanupCallback(callback) {
    if (typeof callback !== "function") {
      throw new Error("Cleanup callback should be a function");
    }
    this.cleanupCallback = callback;
    return this;
  },

  async setResponse(response) {
    this.response = response;
    try {
      this.body = await response.json();
    } catch (e) {
      this.body = {};
    }
    return this;
  },

  setHandlers(handlers = []) {
    this.handlers = [...handlers];
    return this;
  },

  clear() {
    this.handlers = [];
    this.fallback = null;
    this.cleanupCallback = null;
  },

  executeFallback() {
    if (typeof this.fallback !== "function") {
      return;
    }
    this.fallback(this.body, this.response);
  },

  cleanup() {
    if (typeof this.cleanupCallback !== "function") {
      return;
    }
    this.cleanupCallback(this.body, this.response);
  }
};

const xhrHandler = Object.create(handlerFactory);

export default xhrHandler;
