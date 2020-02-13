import request from "./request";

it("fetches", async () => {
  fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));
  const response = await request("url.com");
  expect(response.data).toEqual("12345");
  expect(fetch.mock.calls.length).toEqual(1);
  expect(fetch.mock.calls[0][0]).toEqual("url.com");
});

it("returns response data keys", async () => {
  fetch.mockResponseOnce(
    JSON.stringify({ data: { some_attributes: "12345" } })
  );
  const response = await request("url.com");
  expect(response.data).toEqual({ some_attributes: "12345" });
});

it("has errors and creates xhrHandler", async () => {
  fetch.mockResponseOnce(new Error("fake error message"), { status: 422 });
  try {
    await request("url.com");
  } catch (error) {
    expect(error.message).toEqual("Unprocessable Entity");
    expect(error.response.status).toEqual(422);
    expect(error.asyncHandler).toEqual(Promise.resolve({}));
  }
});

it("fails when success response is not JSON string", async () => {
  fetch.mockResponseOnce("fake error message", { status: 200 });
  try {
    await request("url.com");
  } catch (error) {
    expect(error.message).toMatch(/invalid json response body/);
  }
});

it("fetches with custom headers", async () => {
  fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));
  const response = await request("url.com", {
    headers: { Accept: "custom/json" }
  });
  expect(response.data).toEqual("12345");
  expect(fetch.mock.calls.length).toEqual(1);
  expect(fetch.mock.calls[0]).toEqual([
    "url.com",
    {
      headers: {
        Accept: "custom/json",
        "Content-Type": "application/json"
      },
      method: "GET"
    }
  ]);
});

it("posts body", async () => {
  fetch.mockResponseOnce(JSON.stringify({ data: "12345" }, { status: 201 }));
  const response = await request("url.com", {
    method: "POST",
    body: JSON.stringify({
      account: "account"
    })
  });
  expect(response.data).toEqual("12345");
  expect(fetch.mock.calls.length).toEqual(1);
  expect(fetch.mock.calls[0]).toEqual([
    "url.com",
    {
      body: '{"account":"account"}',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    }
  ]);
});

it("puts body", async () => {
  fetch.mockResponseOnce(JSON.stringify({ data: "12345" }, { status: 201 }));
  const response = await request("url.com", {
    method: "PUT",
    body: JSON.stringify({
      account: "account"
    })
  });
  expect(response.data).toEqual("12345");
  expect(fetch.mock.calls.length).toEqual(1);
  expect(fetch.mock.calls[0]).toEqual([
    "url.com",
    {
      body: '{"account":"account"}',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "PUT"
    }
  ]);
});

it("throws on 300 statuses", async () => {
  fetch.mockResponseOnce(null, { status: 301 });
  try {
    await request("url.com");
  } catch (error) {
    expect(error.message).toEqual("Moved Permanently");
    expect(error.asyncHandler).toEqual(Promise.resolve({}));
  }
});

it("throws on 100 statuses", async () => {
  fetch.mockResponseOnce(null, { status: 102 });
  try {
    await request("url.com");
  } catch (error) {
    expect(error.message).toEqual("Processing");
    expect(error.asyncHandler).toEqual(Promise.resolve({}));
  }
});
