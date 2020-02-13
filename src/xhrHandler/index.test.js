import xhrHandler, { handle404, handle422, handle500 } from "./index";

it("handles default callback for status 404", () => {
  expect(handle404()()).toBe("error.404");
  expect(handle404(err => err.replace("error.", ""))()).toBe("404");
});

it("handles default callback for status 422", () => {
  expect(handle422()("error.422")).toBe("error.422");
  expect(handle422(err => err.replace("error.", ""))("error.422")).toBe("422");
});

it("handles default callback for status 500", () => {
  expect(handle500()()).toBe("error.500");
  expect(handle500(err => err.replace("error.", ""))()).toBe("500");
});

it("throws on empty Response", async () => {
  await expect(xhrHandler.init()).rejects.toThrow(
    /Cannot handle non Response types/
  );
});

it("throws on when no status in Response", async () => {
  await expect(xhrHandler.init({})).rejects.toThrow(
    /Cannot handle non Response types/
  );
});

it("returns promise on initialization", async () => {
  await expect(xhrHandler.init({ status: 200 })).resolves.toEqual({
    body: {},
    response: { status: 200 }
  });
  await expect(xhrHandler.init({ status: 400 })).resolves.toEqual({
    body: {},
    response: { status: 400 }
  });
});

const initHandler400Bad = () =>
  xhrHandler.init(
    new Response(JSON.stringify({ message: "BAD" }), {
      status: 400,
      statusText: "Bad"
    })
  );

it("handles when status", async () => {
  let handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler.when(400, err => (error = err.message)).handle();
  expect(error).toBe("BAD");

  handler = await initHandler400Bad();
  error = "NO ERROR";
  handler.when(401, err => (error = err.message)).handle();
  expect(error).toBe("NO ERROR");
});

it("handles whenNot status", async () => {
  let handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler.whenNot(400, err => (error = err.message)).handle();
  expect(error).toBe("NO ERROR");

  handler = await initHandler400Bad();
  error = "NO ERROR";
  handler.whenNot(401, err => (error = err.message)).handle();
  expect(error).toBe("BAD");
});

it("pipes handlers", async () => {
  const handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler
    .when(401, err => (error = `${err.message}401`))
    .when(400, err => (error = `${err.message}400`))
    .handle();
  expect(error).toBe("BAD400");
});

it("returns on first match", async () => {
  const handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler
    .when(400, err => (error = `${err.message}400`))
    .when(400, err => (error = `${err.message}400 AGAIN`))
    .handle();
  expect(error).toBe("BAD400");
});

it("handles fallback", async () => {
  const handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler
    .when(401, err => (error = `${err.message}401`))
    .otherwise(() => (error = "FALLBACK"))
    .handle();
  expect(error).toBe("FALLBACK");
});

it("handles cleanup", async () => {
  const handler = await initHandler400Bad();
  let error = "NO ERROR";
  handler
    .when(401, err => (error = `${err.message}401`))
    .always(() => (error = "CLEANUP"))
    .handle();
  expect(error).toBe("CLEANUP");
});

it("clears handlers after", async () => {
  const handler = await initHandler400Bad();
  handler
    .when(401, _ => _)
    .whenNot(400, _ => _)
    .otherwise(_ => _)
    .always(_ => _);
  expect(handler.handlers.length).toBe(2);
  expect(typeof handler.fallback).toBe("function");
  expect(typeof handler.cleanupCallback).toBe("function");

  handler.handle();
  expect(handler.handlers.length).toBe(0);
  expect(handler.fallback).toBeNull();
  expect(handler.cleanupCallback).toBeNull();
});

it("throws on invalid fallback", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.otherwise("boom");
  expect(handle).toThrow();
});

it("throws on invalid cleanup", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.always("boom");
  expect(handle).toThrow();
});

it("throws on invalid when callback", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.when(400, "boom");
  expect(handle).toThrow();
});

it("throws on invalid when status", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.when("asdf", _ => _);
  expect(handle).toThrow();
});

it("throws on invalid when not callback", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.when(400, "boom");
  expect(handle).toThrow();
});

it("throws on invalid when not status", async () => {
  const handler = await initHandler400Bad();
  const handle = () => handler.whenNot("asdf", _ => _);
  expect(handle).toThrow();
});

it("returns response", async () => {
  const response = new Response(JSON.stringify({ message: "BAD" }), {
    status: 422,
    statusText: "Unprocessable entity"
  });
  const handler = await xhrHandler.init(response);
  expect(handler.response).toEqual(response);
  expect(handler.body).toEqual({ message: "BAD" });
});

it("returns response with empty body", async () => {
  const response = new Response(null, {
    status: 422,
    statusText: "Unprocessable entity"
  });
  const handler = await xhrHandler.init(response);
  expect(handler.response).toEqual(response);
  expect(handler.body).toEqual({});
});

it("returns response fast on abort", async () => {
  const response = new Response(JSON.stringify({ message: "BAD" }), {
    status: 400,
    statusText: "abort"
  });
  const handler = await xhrHandler.init(response);
  expect(handler).toEqual(response);
});

it("executes handler", () => {
  expect(xhrHandler.executeHandler({ callback: _ => _ })).toBeTruthy();
});

it("doesn't execute invalid handler", () => {
  expect(xhrHandler.executeHandler({})).toBeFalsy();
});

it("sets handlers", () => {
  const xhrHandlerInstance = xhrHandler.setHandlers([1, 2]);
  expect(xhrHandlerInstance.handlers).toEqual([1, 2]);

  xhrHandlerInstance.setHandlers();
  expect(xhrHandlerInstance.handlers).toEqual([]);
});
