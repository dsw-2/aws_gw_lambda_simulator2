# AWS API Gateway and Lambda Simulator

Copied project (https://www.npmjs.com/package/aws_gw_lambda_simulator)

Updated lambda mock functionality to support javascript "async" functions.  AWS lambdas now support "async" functionality.  

## Summary
A basic simulator of AWS API Gateway and Lambda runtime, intended to help in developing and debugging Node-based Lambdas for use in AWS.  Can this be used as a production scaffold?  Probably.  But it was written specifically to help develop Lambdas.

### Why Does this Module Exist?
Because we want to write and debug Lambdas ... but we didn't find an easy-to-use, reusable scaffold that worked for us.  `aws sam local`, `serverless`, and others ... none worked the way we liked.  So we wrote this.


## Basic Usage
Here's an example of basic usage in Node.  After launching the application, point your browser to `http://localhost:3000/echo`, assuming you have a Lambda called `echo` in the same folder as your program entry point, and watch your Lambda run.
```js
const API_GW = require('aws_gw_lambda_simulator');

let server = new API_GW.Server();
let routes = [
    { verb: "GET", filepath: __dirname + '/echo', route: '/echo' }
];

server.config(routes);

server.listen(3000, () => {
    console.log('started on 3000 from js');
});
```

### CORS
Concerned about CORS restrictions?  Under the hood we use the [cors](https://www.npmjs.com/package/cors) module to handle this.  Simply pass in a CORS configuration object as the optional second parameter to `config`.  For example:
```js
// enable cors
let cors = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['x-auth-token']
};

server.config(routes, cors);
```

## URL Parameters
URL Parameters are supported.  Simply include the name of the parameter in typical `express`-style notation, rather than the AWS-style bracked `{}` notation.  For example:

```js
let routes = [
    { verb: "GET", filepath: __dirname + '/echo', route: '/echo/:id' }
];
```

The value of `:id` will be supplied in `event.pathParameters.id`, just as they would in the proper AWS environment.  For example, if the the above route definition calls the `echo` sample lambda shown below, and a request comes in for `http://localhost:9999/echo/abc` (where your server is running on port 9999 on localhost), the result will be something like:

```json
{
    "event": {
        "resource": "/echo/:id",
        "path": "/echo/abc",
        "queryStringParameters": null,
        "pathParameters": {
            "id": "abc"
        },
        "httpMethod": "GET",
        "headers": {
            "cache-control": "no-cache",
            "accept": "*/*",
            "host": "localhost:9999",
            "accept-encoding": "gzip, deflate",
            "connection": "keep-alive"
        },
        "body": {}
    },
    "context": {}
}
```

## Debugging Workflow
Obviously, there are countless ways of accomplishing the same task when it comes to coding.  What we tend to do is:

* Create a new folder and run `npm init`
* Load that folder up in [Visual Studio Code](https://code.visualstudio.com)
* Create the startup scaffold, based on the examples above
* Create a distinct folder on the filesystem somewhere for each Lambda and add each folder to the Workspace -- this allows us to maintain each Lambda in a separate Git repo.
* Set breakpoints and debug as normal.

### Sample Lambda
Here's a sample lambda function.  Note the use of `(exports || module.exports).handler` for the entrypoint - this allows
the lambda to run unmodified both locally and in AWS' environment (AWS directly exposes the `exports` object, which Node
typically doesn't do).

```js
exports.handler = async function(event, context) {

   var response = {
      statusCode: 200,
      headers: {
         "Content-Type": "application/json"
      },
      isBase64Encoded: false,
      body: JSON.stringify({response: "hello"})
   };

      // do some async work
   await someAyncWork();
   
   return response;
}
```

## Details
**aws_gw_lambda_simulator** uses [express](https://www.npmjs.com/package/express) to spin up a web server.  You pass in an array of routes to expose, as well as optional CORS configuration as described above.  It passes in mock objects that stand in for the `event`, `context`, and `callback` values.  These are not 100% accurate representations of the objects you'll be provided in the true AWS Lambda environment.  Rather, they contain a subset of those fields that have thus far been necessary for our development.

The `config` method requires an array of `lambdaRoute`s.  Each one of these must contain exactly 3 properties:

* `verb` - this is the HTTP verb to listen for.  Currently, `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, and `HEAD` are supported.  If using TypeScript, you can use the enum `HTTP_VERB` to access the possible values (ex: `HTTP_VERB.GET` or `HTTP_VERB.POST`).  Otherwise, use the name of the verb (ex: `"GET"` or `"POST"`).
* `filepath` - the path to the entry point file for your Lambda.  Since this file gets loaded via `require`, you don't need to include the trailing '.js' if you don't want to.  You must specify the full path or use `__dirname` to ensure the correct path is used to locate the lambda entry point.  Otherwise, it will attempt to load the file using the node_modules subfolder as the starting point, and will lead you to unexpected results.
* `route` - the URL path to expose the endpoint as.

Each `lambdaRoute` may optionally contain an `options` object of type `gwOptions`.  Presently it supports:

* `x_api_key` - an optional string value to be required to simulate the API Key functionality of API Gateway.  When a value is supplied, the exact value must be provided by the caller of the web service in the header `x-api-key`.  If `x-api-key` is either not provided, or is not the same value specified in the `x_api_key` property, the framework will not execute your lambda, and instead return a 403 error, along with the simple payload of "Forbidden".  Keep in mind, the scaffold spins up an unencrypted HTTP site, _not_ one protected by HTTPS, so do not use this key to protect services without using an external HTTPS endpoint to proxy the request - otherwise your `x-api-key` could be read by network sniffers.
* `tokenAuthorizer` - an optional object that can specify an "authorizer" lambda.  See below for more information.  A valid `tokenAuthorizer` consists of two values:
  * `filepath` - the path to the entry point file for your Lambda. This field operates exactly the same way as the `filepath` field to the target lambda operates.
  * `header_key` - the name of the http header that is expected to contain the authorization token.  This will be passed into the authorizer lambda `event` object as `authorizationToken`, just like in the real AWS environment.

### Authorization Lambdas
Authorization lambdas need to be written and debugged, too!  Hence the limited ability for `aws_gw_lambda_simulator` to run authorization lambdas.  Since this framework is meant as a development tool, some pretty serious limitations exist.  See the section on Limitations, below.

Here's a sample authorization lambda written in TypeScript.
```javascript
exports.handler = async(event) => {
  if (event.headers.authorization == "secretToken") {
    console.log("allowed");
    return {
      "principalId": "abcdef", // The principal user identification associated with the token sent by the client.
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "execute-api:Invoke",
          "Effect": "Allow",
          "Resource": event.routeArn
        }]
      },
      "context": {
        "stringKey": "value",
        "numberKey": 1,
        "booleanKey": true,
        "arrayKey": ["value1", "value2"],
        "mapKey": { "value1": "value2" }
      }
    };
  }
  else {
    console.log("denied");
    return {
      "principalId": "abcdef", // The principal user identification associated with the token sent by the client.
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "execute-api:Invoke",
          "Effect": "Deny",
          "Resource": event.routeArn
        }]
      },
      "context": {
        "stringKey": "value",
        "numberKey": 1,
        "booleanKey": true,
        "arrayKey": ["value1", "value2"],
        "mapKey": { "value1": "value2" }
      }
    };
  }
};
```

## Limitations
* Unlike the actual Lambda environment, containers are not used to execute individual executions.  In contrast, everything here runs on the same thread as is typical for a basic Express application.  This means if you wanted, you could do funky things that allow the different lambdas to interact with each other in ways that aren't possible in the actual environment.  If you wanted to do things like that, just go ahead and use Express directly, since it violates the whole point of developing lambdas!
* For now, we only simulate the LAMBDA_PROXY integration method.  Long-term we will look into incorporating the [Velocity Template Language](http://velocity.apache.org/engine/devel/vtl-reference.html).  For now though, that's just a pipe dream.
* The `context` object that is provided to a lambda is a mock object.  It does not include proper values for any of the `context` properties (ex: `context.memoryLimitInMB` or `context.invokedFunctionArn`) or implementations for methods (ex: `context.getRemainingTimeInMillis()`) that would be provided in the AWS environment.  Any attempt to call such methods will throw not-implemented errors.  If your lambda uses the older `context.succeed()`, `context.fail()` or `context.done()` methods to finish executing - they're not going to work, either.  Use `callback()`.
* The authorizer framework has some significant limitations.
  * Unlike in AWS, there the framework here does not cache results.  As a result, the authorizer lambda will be run on every execution request.
  * The framework here does not honor the path supplied in the authorizer lambda's response.  If the first policy's effect is `Allow`, the request will be passed through to the target lambda regardless of whether the path matches.
  * Regardless of how many policies are returned as part of the authorizer lambda's response, only the first policy will be inspected.  If the first policy is to `Deny` access yet the second one is to `Allow` access, access will be denied.

___
Disclaimer:  this project is not in any way associated with AWS or Amazon!

(c) 2018 Triple Take Technologies