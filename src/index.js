//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rOs       = require("os"),
      rFs       = require("fs"),
      rPath     = require("path"),
      rZlib     = require("zlib"),
      rHttp     = require("http"),
      rHttps    = require("https");

const rUws      = require("uws");

const rApp      = require("./app");

//-----------------------------------------------------

function main(port, options) {
    if(port && typeof(port) === "object") {
        options = port;
        port = options.port;
    }

    //-------------]>

    options = Object.assign({}, options || {});

    options.port = port;
    options.path = options.path || "";

    options.ping = typeof(options.ping) === "undefined" ? {"interval": 10000} : options.ping;
    options.clientJs = typeof(options.clientJs) === "undefined" ? true : !!options.clientJs;

    options.maxPayload = options.maxPayload || (1024 * 32);
    options.noDelay = typeof(options.noDelay) === "undefined" ? true : !!options.noDelay;
    options.restoreTimeout = 1000 * (typeof(options.restoreTimeout) === "undefined" ? 0 : (parseInt(options.restoreTimeout, 10) || 0));
    options.binary = true;
    options.packets = Array.isArray(options.packets) ? options.packets : [];

    options.verifyClient = (function verifyClient(info, callback) {
        const func = verifyClient.func;

        if(func) {
            const argsLen = func.length;

            if(argsLen <= 1) {
                callback(!!func(info));
            }
            else {
                func(info, callback);
            }
        }
        else {
            callback(true);
        }
    });

    //--------------------------------]>

    const sendClientLib = (function() {
        if(!options.clientJs) {
            return function(request, response) {
                response.end();
            };
        }

        //--------------------]>

        const zlibOptions = {
            "level": rZlib.Z_BEST_COMPRESSION
        };

        const objDeflate = {
            "content-encoding": "deflate",
            "content-type":     "text/javascript"
        };

        const objGzip = {
            "content-encoding": "gzip",
            "content-type":     "text/javascript"
        };

        const reDeflate = /\bdeflate\b/;
        const reGzip = /\bgzip\b/;

        const lib = rFs.readFileSync(`${__dirname}/../public/sockizy.min.js`) + `\r\n(io.__staticPackets=${JSON.stringify(options.packets)});`;

        const libDeflate = rZlib.deflateSync(lib, zlibOptions);
        const libGzip = rZlib.gzipSync(lib, zlibOptions);

        let data, acceptEncoding;

        //--------------------]>

        return function(request, response) {
            data = lib;
            acceptEncoding = request.headers["accept-encoding"];

            if(acceptEncoding && typeof(acceptEncoding) === "string") {
                if(acceptEncoding.match(reGzip)) {
                    data = libGzip;
                    response.writeHead(200, objGzip);
                }
                else if(acceptEncoding.match(reDeflate)) {
                    data = libDeflate;
                    response.writeHead(200, objDeflate);
                }
            }

            response.end(data);
        };
    })();

    //---------]>

    if(!options.server) {
        if(options.ssl) {
            const ssl = Object.assign({
                "honorCipherOrder":     true,
                "requestCert":          true,
                "rejectUnauthorized":   false
            }, options.ssl);

            //---------]>

            const certDir = ssl.dir || "";

            const optKey  = ssl.key && rFs.readFileSync(rPath.join(certDir, ssl.key));
            const optCert = ssl.cert && rFs.readFileSync(rPath.join(certDir, ssl.cert));

            let optCa     = ssl.ca;

            //---------]>

            if(optCa) {
                if(Array.isArray(optCa)) {
                    optCa = optCa.map((e) => rFs.readFileSync(rPath.join(certDir, e)));
                }
                else if(typeof(optCa) === "string") {
                    optCa = rPath.join(certDir, optCa);
                }
            }

            ssl.key = optKey;
            ssl.cert = optCert;
            ssl.ca = optCa;

            //---------]>

            options.server = rHttps.createServer(ssl, sendClientLib);
        }
        else {
            options.server = rHttp.createServer(sendClientLib);
        }
    }

    options.isNtSrv = options.server instanceof(rHttp.Server) || options.server instanceof(rHttps.Server);

    //-------------]>

    const wss = new rUws.Server(options);

    //--------------------------------]>

    if(options.ping && options.ping.interval > 0 && wss.startAutoPing) {
        wss.startAutoPing(Math.max(options.ping.interval, parseInt(1000 / 30)), options.ping.message);
    }

    //--------------------------------]>

    const appParams = {wss};

    let app = null;

    //-------------]>

    if(!options.port) {
        appParams.listen = function() {
            if(arguments.length) {
                const func = arguments[2];

                arguments[2] = function() {
                    app._emit("listening");

                    if(func) {
                        func.apply(options.server.listen, arguments);
                    }
                };

                options.server.listen.apply(options.server, arguments);
            }
            else {
                options.server.listen(1337, "localhost", function() {
                    app._emit("listening");
                });
            }

            return this;
        };
    }

    app = rApp(appParams, options);

    if(Array.isArray(options.packets)) {
        app.packets(...options.packets);
    }

    //--------------------------------]>

    return app;
}

//-----------------------------------------------------

module.exports = main;
