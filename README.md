# request

HTTP client that uses the native fetch.
Request is based on middlewares in order to extend the default fetch functionality.

## Installing

Using npm:

```
$ npm install axios
```

## Basic usage

```javascript
import request from "@workable/request";

const promise = request("resource.com"); // submits a get request to 'resource.com'

promise
  .then(reponse => {
    console.log("reponse", reponse);
  })
  .catch(error => {
    console.error("error", error);
  });
```

Request will resolve the promise if the response status is between 200 and 299. Otherwise, it will reject the promise.
If the promise resolved successfully, it will return the JSON content of the response.
If the promise rejected, it will return an error containing the response and an XHRHandler.

## XHRHandler

XHRHandler triggers callbacks according to http response rules.

### Example

```javascript
XHRHandler.init(response).catch(error =>
  error.asyncHandler.then(handler =>
    handler
      .when(400, () => "doSomething")
      .whenNot(401, () => "doSomething")
      .otherwise(() => "doSomething")
      .always(() => "doSomething")
      .handle()
  )
);
```

## Middlewares

- withAbort
- withCache
- withShortcuts
- withBgSync

Middleware is an easy way to extend the basic functionality of the request.
For example, if you would like to create a request that can be aborted, you could merely to:

```javascript
import basicRequest, { withAbort } from "@workable/request";
const request = withAbort(basicRequest);
const promise = request("resource.com", {
  method: "POST",
  body: JSON.stringify({ data })
});
promise.abort();
```

Or if you would like to use the shortcut request.post(), you could:

```javascript
import basicRequest, { withAbort, withShortcut } from "@workable/request";
const request = withShortcut(withAbort(basicRequest));
const promise = request.post("resource.com", { data });
promise.abort();
```

You can find more information for each middleware on the corresponding file.

### withAbort

Injects an abort function in the request promise.

### withCache

Caches a request in the indexed DB.

### withShortcuts

Caches a request in the indexed DB.

### withBgSync

Sends the request to the service worker in order to perform it when the device is back online.

⚠️ It needs an extra handling in the service worker side, in order to cache the request with the 'bgSync: 1' header.

### Custom middleware

A middleware is nothing more than a simple function that accepts request the method and returns the extended request.

```javascript
import basicRequest from "@workable/request";

const withRequestLogger = request => {
  return (url, params) => {
    console.log("start request", url);
    request(url, params).then(response => {
      console.log("successfully request", url);
      return response;
    });
  };
};

const request = withRequestLogger(basicRequest);
```
