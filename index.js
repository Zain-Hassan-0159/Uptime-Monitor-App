/**
 * Primary File For the API
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');


// Instantiate the http server
var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);

});

// Start the http server
httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on "+config.httpPort);
});

// Instantiate the https server
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/certificate.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req, res){
    unifiedServer(req, res);

});

// start the https server
httpsServer.listen(config.httpsPort, function(){
    console.log("The server is listening on "+config.httpsPort);
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res){

    // Get the url and parse it
    var parsedUrl = url.parse(req.url,true);

    // Get the Path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the header as an object
    var headers = req.headers;

    // Get the http Method
    var method = req.method.toLowerCase();

    // Get the payload if any
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on("end", function(){
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not is not found, use the notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back by the handler, or by default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the Request Path
            console.log('Returning this response: ', statusCode, payloadString);


        });

    });
};


// Define a request router
var router = {
    'ping' : handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks' : handlers.checks
};