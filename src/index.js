﻿//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rCluster  = require("cluster"),
      rOs       = require("os"),
      rFs       = require("fs"),
      rZlib     = require("zlib"),
      rHttp     = require("http"),
      rHttps    = require("https");

const rUws      = require("uws");

const rApp      = require("./app");

//-----------------------------------------------------

function main(port, options, isCluster) {
    if(port && typeof(port) === "object") {
        isCluster = options;
        options = port;
        port = options.port;
    }

    //-------------]>

    options = Object.assign({}, options || {});

    options.port = port;
    options.path = options.path || "";

    options.ping = typeof(options.ping) === "undefined" ? {"interval": 1000} : options.ping;
    options.clientJs = typeof(options.clientJs) === "undefined" ? true : !!options.clientJs;

    options.maxPayload = options.maxPayload || 1024;
    options.noDelay = typeof(options.noDelay) === "undefined" ? true : !!options.noDelay;
    options.binary = true;

    options.cluster = !!options.cluster;
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

    isCluster = options.cluster;

    //-------------]>

    const isMaster  = isCluster && rCluster.isMaster;

    const workers   = [];
    const workerId  = !isCluster || isMaster ? -1 : rCluster.worker.id;

    const numCPUs   = options.numCPUs || Math.max(rOs.cpus().length - 1, 1);

    //-------------]>

    rHttp.globalAgent.maxSockets = options.maxSockets || Infinity;
    rHttps.globalAgent.maxSockets = options.maxSockets || Infinity;

    if(!isMaster) {

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

            const lib = rFs.readFileSync(__dirname + "/../public/sockizy.min.js");

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

            const libDeflate = rZlib.deflateSync(lib, zlibOptions);
            const libGzip = rZlib.gzipSync(lib, zlibOptions);

            //--------------------]>

            return function(request, response) {
                const acceptEncoding = request.headers["accept-encoding"];

                if(acceptEncoding && typeof(acceptEncoding) === "string") {
                    if(acceptEncoding.match(reGzip)) {
                        response.writeHead(200, objGzip);
                        response.end(libGzip);
                    }
                    else if(acceptEncoding.match(reDeflate)) {
                        response.writeHead(200, objDeflate);
                        response.end(libDeflate);
                    }
                    else {
                        response.end(lib);
                    }
                }
                else {
                    response.end(lib);
                }
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

                const optKey  = rFs.readFileSync(certDir + ssl.key),
                      optCert = rFs.readFileSync(certDir + ssl.cert);

                let optCa     = ssl.ca;

                //---------]>

                if(optCa) {
                    if(Array.isArray(optCa)) {
                        optCa = optCa.map((e) => rFs.readFileSync(certDir + e));
                    }
                    else if(typeof(optCa) === "string") {
                        optCa = certDir + optCa;
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

        options.isNtSrv = options.server instanceof rHttp.Server || options.server instanceof rHttps.Server;
    }
    
    //-------------]>

    const wss = isMaster ? null : new rUws.Server(options);

    //-------------]>

    if(isMaster) {
        for(let i = 0; i < numCPUs; i++) {
            const worker = rCluster.fork();

            worker.on("message", function(data) {
                for(let w of workers) {
                    w.send(data);
                }
            });

            workers.push(worker);
        }
    }
    else {
        if(isCluster) {
            wss.__broadcast = wss.broadcast;
            wss.broadcast = function(data, params) {
                process.send(["wss.broadcast", data, params]);
            };

            process.on("message", function([id, data, params]) {
                if(id === "wss.broadcast") {
                    wss.__broadcast(data, params);
                }
            });
        }
    }

    if(wss && options.ping && options.ping.interval > 0) {
        wss.startAutoPing(Math.max(options.ping.interval, parseInt(1000 / 30)), options.ping.message);
    }

    //-------------]>

    const app = {
        "cluster":  rCluster,

        isMaster,

        workers,
        workerId,

        wss
    };

    //-------------]>

    if(!options.port) {
        app.listen = function() {
            if(arguments.length) {
                options.server.listen.apply(options.server, arguments);
            }
            else {
                options.server.listen(1337, "localhost");
            }

            return this;
        };
    }

    //-------------]>

    return isMaster ? app : rApp(app, options);
}

//-----------------------------------------------------

module.exports = main;
