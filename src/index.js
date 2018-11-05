//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const http = require("http");
const https = require("https");

const uws = require("uws");

const ioApp = require("./app");

//-----------------------------------------------------

function main(port, options) {
    if(port && typeof(port) === "object") {
        options = port;
        port = options.port;
    }

    //-------------]>

    options = {
        ...(options || {})
    };

    options.port = port;
    options.path = options.path || "";

    options.ping = typeof(options.ping) === "undefined" ? {"interval": 10000} : options.ping;
    options.clientJs = typeof(options.clientJs) === "undefined" ? true : !!options.clientJs;

    options.maxPayload = options.maxPayload || (1024 * 32);
    options.noDelay = typeof(options.noDelay) === "undefined" ? true : !!options.noDelay;
    options.binary = true;
    options.packets = [...(Array.isArray(options.packets) ? options.packets : [])];

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
            return (request, response) => response.end();
        }

        //--------------------]>

        const zlibOptions = {
            "level": zlib.Z_BEST_COMPRESSION
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

        const lib = fs.readFileSync(`${__dirname}/../public/sockizy.min.js`) + `\r\n(io.__staticPackets=${JSON.stringify(options.packets)});`;

        const libDeflate = zlib.deflateSync(lib, zlibOptions);
        const libGzip = zlib.gzipSync(lib, zlibOptions);

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
            const ssl = {
                "honorCipherOrder":     true,
                "requestCert":          true,
                "rejectUnauthorized":   false,

                ...options.ssl
            };

            //---------]>

            const certDir = ssl.dir || "";

            const optKey  = ssl.key && fs.readFileSync(path.join(certDir, ssl.key));
            const optCert = ssl.cert && fs.readFileSync(path.join(certDir, ssl.cert));

            let optCa = ssl.ca;

            //---------]>

            if(optCa) {
                if(Array.isArray(optCa)) {
                    optCa = optCa.map((e) => fs.readFileSync(path.join(certDir, e)));
                }
                else if(typeof(optCa) === "string") {
                    optCa = path.join(certDir, optCa);
                }
            }

            ssl.key = optKey;
            ssl.cert = optCert;
            ssl.ca = optCa;

            //---------]>

            options.server = https.createServer(ssl, sendClientLib);
        }
        else {
            options.server = http.createServer(sendClientLib);
        }
    }

    options.isNtSrv = options.server instanceof(http.Server) || options.server instanceof(https.Server);

    //-------------]>

    const wss = new uws.Server(options);

    //-------------]>

    if(options.ping && options.ping.interval > 0 && wss.startAutoPing) {
        wss.startAutoPing(Math.max(options.ping.interval, parseInt(1000 / 30)), options.ping.message);
    }

    //--------------------------------]>

    const app = ioApp({
        wss,
        "listen": !options.port && ((...a) => (options.server.listen(...(a.length ? a : [1337, "localhost"])), app))
    }, options);

    //--------------------------------]>

    return app.packets(...options.packets);
}

//-----------------------------------------------------

module.exports = main;
