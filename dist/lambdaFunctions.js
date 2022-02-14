"use strict";
/*
Copyright 2018 Triple Take Technologies

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const { response } = require("express");
const url = require("url");

// A wrapper function to handle the basic input/output for a lambda
async function Wrapper(lambda, verb, req, res, options) 
{
    options = options || {};

    if (options.x_api_key && !(options.x_api_key === req.get("x-api-key"))) {
        let r = res.status(403);
        r.send("Forbidden");
        return r;
    }

    const { event, context } = Mapper(verb, req, options.json);

    if (options && options.tokenAuthorizer) 
    {
        const mockAuth = new mockAuthorizationEvent();
        mockAuth.authorizationToken = req.get(options.tokenAuthorizer.header_key);
        if (mockAuth.authorizationToken == null) {
            return res.status(401).send();
        }
    
        const authorizer = require(options.tokenAuthorizer.filepath);
    
        let authResp = await authorizer.handler(mockAuth, context);

           // expects authorizer response format 1.0 
           // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html
        if (authResp.policyDocument.Statement[0].Effect === 'Deny')
           return res.status(403).send();
    }

    let lambdaResp = await lambda.handler(event, context);

    res.status(lambdaResp.statusCode);
    res.set(lambdaResp.headers);
    res.send(lambdaResp.body);
    return;
}


exports.Wrapper = Wrapper;
class mockContext {
    getRemainingTimeInMillis() {
        throw new Error("Mock method not implemented.");
    }
    done(error, result) {
        throw new Error("Mock method not implemented.");
    }
    fail(error) {
        throw new Error("Mock method not implemented.");
    }
    succeed(message, object) {
        throw new Error("Mock method not implemented.");
    }
}
exports.mockContext = mockContext;
class mockEvent {
}
exports.mockEvent = mockEvent;
class mockAuthorizationEvent {
}
// Mimic the subset of the event and context objects created by AWS' Lambda Proxy for the specified request (req)
function Mapper(verb, req, json=true) {
    const context = new mockContext();
    const event = new mockEvent();

      // the bodyParser.raw() middleware sets req.body={} (empty object) if there is not input body.
      // check for Buffer before trying to use it.
    let body = undefined;
    if (req.body instanceof Buffer)
    {
      body = req.body.toString("utf8");
      if (json) body = JSON.parse(body);
    }

    Object.assign(event, {
        version: "2.0",
        routeKey: `${verb} ${req.route.path}`,
        rawPath: req.path,
        rawQueryString: req._parsedUrl.query,
        cookies: [], // ToDo
        headers: Object.getOwnPropertyNames(req.headers).length > 0 ? req.headers : null,
        queryStringParameters: Object.getOwnPropertyNames(req.query).length > 0 ? req.query : null,
        requestContext: {
         accountId: "000000000000",  
         apiId: "0000000000",
         authorizer: { jwt: "<not implemented" },
         domainName: req._parsedUrl.hostname,
         domainPrefix: req._parsedUrl.hostname,
         http: {
           method: verb,
           path: req.path,
           protocol: `${req.protocol.toUpperCase()}/${req.httpVersion}`, //'HTTP/1.1'
           sourceIp: "0.0.0.0",
           userAgent: "UserAgent/1.1.1"
         },
         requestId: "1111111111111111",
         routeKey: `${verb} ${req.route.path}`,
         stage: "default",
         time: (new Date()).toISOString(),    // '14/Feb/2022:20:54:16 +0000' 
         timeEpoch: Date.now()
        },
        pathParameters: Object.getOwnPropertyNames(req.params).length > 0 ? req.params : null,
        isBase64Encoded: false,

        resource: req.route.path,
        path: url.parse(req.url).pathname,
        httpMethod: verb,
        body: body
    });
    return ({ context, event });
}
exports.Mapper = Mapper;


