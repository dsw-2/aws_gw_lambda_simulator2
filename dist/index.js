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
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const lambdaFunctions = require("./lambdaFunctions");
const lambdaRoute_1 = require("./types/lambdaRoute");
__export(require("./types/lambdaRoute"));
/**
 * The server.
 *
 * @class Server
 */
class Server {
    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
        //create expressjs application
        this.app = express();
        this.app.use(bodyParser.raw({type: "*/*"}));  
    }

    /**
     * Configure the server.  You should only call this once.
     *
     * @param {Array<lambdaRoute>} routes The list of routes to host.
     * @param {*} corsOptions Optional CORS configuration.
     * @memberof Server
     */
    config(routes, corsOptions) {
        this.router = express.Router();
        if (corsOptions) {
            this.app.use(cors(corsOptions));
        }
        routes.forEach((route) => {
            let service = require(route.filepath);
            // TODO: Is there a way to genericize / simplify this if/else block?
            /* if (route.verb === HTTP_VERB.ALL) {
                this.router.all(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res);
                })
            }
            else */
            if (route.verb === lambdaRoute_1.HTTP_VERB.GET) {
                this.router.get(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.POST) {
                this.router.post(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.PUT) {
                this.router.put(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.DELETE) {
                this.router.delete(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.PATCH) {
                this.router.patch(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.OPTIONS) {
                this.router.options(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else if (route.verb === lambdaRoute_1.HTTP_VERB.HEAD) {
                this.router.head(route.route, (req, res) => {
                    return lambdaFunctions.Wrapper(service, route.verb, req, res, route.options);
                });
            }
            else {
                console.log('unsupported route');
            }
        });
        this.app.use(this.router);
    }
    /**
     * Begin listening for requests on the specified port.
     *
     * @param {number} port The port # to listen on.
     * @param {() => void} [callback] Optional callback method to be called upon port attachment.
     * @memberof Server
     */
    listen(port, callback) {
        this.port = port;
        this.app.listen(port, () => {
            if (callback) {
                callback();
            }
        });
    }
}
exports.Server = Server;
