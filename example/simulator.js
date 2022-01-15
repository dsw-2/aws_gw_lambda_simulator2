const API_GW = require("../dist");

const PORT = 3000;


let server = new API_GW.Server();

let routes = [
    { verb: "GET", filepath: __dirname + "/lambda1/index.js", route: "/simulators/:id" },
    { verb: "POST", filepath: __dirname + "/lambda2/index.js", route: "/simulators" },
];
 
server.config(routes);
 
server.listen(PORT, () => {
    console.log("Simulator started, listening on port:3000");

    console.log("Routes:");
    for (let route of routes)
      console.log(`  - ${route.verb}  ${route.route}`);
});