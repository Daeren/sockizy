//-----------------------------------------------------
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
    options.forkTimeout = typeof(options.forkTimeout) === "undefined" ? 5 : (parseInt(options.forkTimeout) || 0);

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

    isCluster = typeof(isCluster) === "undefined" ? options.cluster : isCluster;
    Promise = typeof(options.promise) === "undefined" ? Promise : options.promise;

    //--------------------------------]>

    const isMaster  = isCluster && rCluster.isMaster;

    const workers   = new Map();
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

                const optKey  = ssl.key && rFs.readFileSync(certDir + ssl.key),
                      optCert = ssl.cert && rFs.readFileSync(certDir + ssl.cert);

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

    //--------------------------------]>

    if(isMaster) {
        rCluster.on("exit", function(worker, code, signal) {
            workers.delete(worker.id);

            //--------]>

            if(options.forkTimeout && worker.exitedAfterDisconnect !== true) {
                setTimeout(forkWorker, 1000 * options.forkTimeout);
            }
        });

        for(let i = 0; i < numCPUs; i++) {
            forkWorker();
        }
    }
    else if(isCluster) {
        wss.__broadcast = wss.broadcast;
        wss.broadcast = function(data, options) {
            process.send([0, 1000, Buffer.from(data).toString("binary"), options]);
        };

        //-------]>

        process.on("message", function(data) {
            if(!Array.isArray(data) || data[0] !== 0) { // 0 - sys
                return;
            }

            //-------]>

            const [/*type*/, id, message, params] = data;

            //-------]>

            if(id === 1000) {
                wss.__broadcast(Buffer.from(message, "binary"), params);
            }
        });
    }

    if(wss && options.ping && options.ping.interval > 0) {
        wss.startAutoPing(Math.max(options.ping.interval, parseInt(1000 / 30)), options.ping.message);
    }

    //--------------------------------]>

    const app = {
        "cluster":  rCluster,

        isMaster,

        workers,
        workerId,

        wss,

        Promise
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

    //--------------------------------]>

    return rApp(app, options);

    //--------------------------------]>

    function forkWorker() {
        const worker = rCluster.fork();

        worker.on("message", function(data) {
            if(!Array.isArray(data) || data[0] !== 0) {
                return;
            }

            workers.forEach((w) => w.isConnected() && w.send(data));
        });

        workers.set(worker.id, worker);
    }
}

//-----------------------------------------------------

module.exports = main;
