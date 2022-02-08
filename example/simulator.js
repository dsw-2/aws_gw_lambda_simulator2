const API_GW = require("../dist");

const PORT = 3000;


let server = new API_GW.Server();

let routes = [
    { verb: "GET", filepath: __dirname + "/lambda1/index.js", route: "/simulators/lambda1/:id" },
    { verb: "POST", filepath: __dirname + "/lambda2/index.js", route: "/simulators/lambda2" },

      // don't try and parse the request body as json
    { verb: "POST", filepath: __dirname + "/lambda3/index.js", route: "/simulators/lambda3", options: {json: false} },
];
 
server.config(routes);
 
server.listen(PORT, () => {
    console.log("Simulator started, listening on port:3000");

    console.log("Routes:");
    for (let route of routes)
      console.log(`  - ${route.verb}  ${route.route}`);
});