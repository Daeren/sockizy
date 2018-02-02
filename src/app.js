//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rUrl          = require("url");

const rSEE          = require("./see"),
      rPacker       = require("./packer"),
      rToString     = require("./toString");

//-----------------------------------------------------

class Socket extends rSEE {
    constructor(io, ws) {
        super();

        //-------]>

        this._io = io;
        this._bind(ws);

        //-------]>

        this.OPEN   = ws.OPEN;
        this.CLOSED = ws.CLOSED;
    }


    get readyState() {
        return this._ws.readyState;
    }

    get upgradeReq() {
        return this._ws.upgradeReq;
    }


    emit(name, data, isBroadcast) {
        data = this._io._pack(name, data);

        if(data) {
            if(isBroadcast) {
                this._io.broadcast(data);
            }
            else {
                this.send(data);
            }
        }

        return !!data;
    }

    bundle(isBroadcast) {
        const self = this;
        const io = this._io;
        const bd = io._bundle();

        bd.end = end;

        //----------]>

        return bd;

        //----------]>

        function end(name, data) {
            const bytes = this._end(name, data);

            if(bytes) {
                if(isBroadcast) {
                    io.broadcast(this._buffer);
                }
            else {
                    self.send(this._buffer);
                }
            }

            return bytes;
        }
    }

    text(data, isBroadcast) {
        if(isBroadcast) {
            this._io.text(data);
        }
            else {
            this.send(rToString(data), null);
        }
    }

    json(data, isBroadcast) {
        if(isBroadcast) {
            this._io.json(data);
        }
        else {
            this.send(JSON.stringify(data), null);
        }
    }

    send(data, options = this._io._msgOptions) {
        this._ws.send(data, options, (e) => {
            if(e) {
                this._io._emit("error", e, this);
            }
        });
    }


    disconnect(code = 1000, reason = "") {
        if(this.readyState === this.OPEN) {
            this._disconnected = true;
            this._ws.close(code, reason);
        }
    }

    terminate() {
        if(this.readyState === this.OPEN) {
            this._terminated = true;
            this._ws.terminate();
        }
    }


    ping(message) {
        this._ws.ping(message);
    }


    _bind(ws) {
        this._ws = ws;

        //-----------]>

        const _s = ws._socket;

        //-----------]>

        this.remotePort = _s.remotePort;
        this.remoteAddress = _s.remoteAddress;
        this.remoteFamily = _s.remoteFamily;
    }
}

class Io extends rSEE {
    constructor(app, options) {
        super();

        Object.assign(this, app);

        //----------]>

        this._msgOptions = {
            "binary":   !!options.binary
        };

        this._srv = options.server;
        this._isNtSrv = options.isNtSrv;

        this._restoreTimeout = options.restoreTimeout;
        this._verifyClient = options.verifyClient;

        this._packMapByName = new Map();
        this._unpackMapById = new Array();
    }


    emit(name, data) {
        data = this._pack(name, data);

        if(data) {
            this.wss.broadcast(data, this._msgOptions);
        }

        return !!data;
    }

    bundle() {
        const self = this;
        const bd = this._bundle();

        bd.end = end;

        //----------]>

        return bd;

        //----------]>

        function end(name, data) {
            const bytes = this._end(name, data);

            if(bytes) {
                self.broadcast(this._buffer);
            }

            return bytes;
        }
    }

    text(data) {
        this.broadcast(rToString(data), null);
    }

    json(data) {
        this.broadcast(JSON.stringify(data), null);
    }

    broadcast(data, options = this._msgOptions) {
        this.wss.broadcast(data, options);
    }


    close(callback) {
        if(this._isNtSrv) {
            this._srv.close();
        }

        this.wss.close(callback);
    }


    packets(unpack, pack, shared) {
        forEach(unpack, (name, srz) => {
            this._unpackMapById.push([name, srz]);
        });

        forEach(pack, (name, srz) => {
            this._packMapByName.set(name, [this._packMapByName.size, srz]);
        });

        if(shared) {
            return this.packets(shared, shared);
        }

        //----------]>

        return this;

        //----------]>

        function forEach(data, callback) {
            if(!data) {
                return;
            }

            Object.keys(data).forEach(function(field) {
                const t = field.split(/\(([\[\{]?)(\@?)([\}\]]?)\)$/);

                let name,
                    useHolderArray,
                    holderNew,
                    schema;

                //-------]>

                name = t.shift().trim();
                useHolderArray = t.shift() === "[";
                holderNew = t.shift() === "@";

                schema = data[field];

                //-------]>

                testName(name);
                callback(name, rPacker.createPacket(schema, useHolderArray, holderNew));
            });
        }

        function testName(n) {
            let r = [
                "restoring", "restored",
                "open", "close", "disconnected", "terminated",
                "packet", "message", "arraybuffer", "error",
                "ping", "pong"
            ];

            if(r.some((e) => e === n)) {
                throw new Error(`Used a reserved name: ${n}`);
            }
        }
    }

    verifyClient(callback) {
        this._verifyClient.func = callback;
        return this;
    }


    _bundle() {
        const self = this;

        return {
            write(name, data) {
                const pkt = self._pack(name, data);

                if(!pkt) {
                    return 0;
                }

                if(this._buffer) {
                    const offset = this._buffer.byteLength;
                    const t = new Uint8Array(offset + pkt.byteLength);

                    t.set(this._buffer);
                    t.set(pkt, offset);

                    this._buffer = t;
                }
            else {
                    this._buffer = new Uint8Array(pkt.byteLength);
                    this._buffer.set(pkt);
                }

                return pkt.byteLength;
            },

            _end(name, data) {
                if(name) {
                    this.write(name, data);
                }

                return this._buffer && this._buffer.byteLength;
            }
        };
    }

    _pack(name, data) {
        const pkt = this._packMapByName.get(name);

        //---------]>

        if(!pkt) {
            return null;
        }

        //---------]>

        const [id, srz] = pkt;

        //---------]>

        return srz.pack(id, data);
    }
}

//-----------------------------------------------------

function main(app, options) {
    const io = new Io(app, options);
    const socketsRestoringMap = Object.create(null);

    //-----------------]>

    if(io.isMaster) {
        return io;
    }

    app.wss.on("connection", function(ws) {
        const {upgradeReq} = ws;
        const {query} = rUrl.parse(upgradeReq.url, true);

        const cid = query.id;
        const cidValid = typeof(cid) === "string" && cid.length === 36;

        //-----------------]>

        let socket = cidValid ? releaseSR(cid) : null,
            tBufData;

        //-----------------]>

        ws.binaryType = "arraybuffer";

        //-----------------]>

        ws.on("message", function(data) {
            socket._emit("message", data);

            if(typeof(data) === "string") {
                socket._emit("text", data);

                if(socket.listenerCount("json")) {
                    try {
                        data = JSON.parse(data);
                    }
                    catch(e) {
                        data = void(e);
                    }

                    if(typeof(data) !== "undefined") {
                        socket._emit("json", data);
                    }
                }

                return;
            }
            else if(socket._emit("arraybuffer", data)) {
                return;
            }

            //-----------]>

            const dataByteLength = data.byteLength;

            //-----------]>

            if(!tBufData || tBufData.buffer.byteLength !== dataByteLength) {
                tBufData = new Uint8Array(data);
            }

            //-----------]>

            const pktSchema = io._unpackMapById[rPacker.getId(tBufData)];

            //-----------]>

            if(pktSchema) {
                const [name, srz] = pktSchema;

                data = srz.unpack(tBufData, 0, dataByteLength);

                if(typeof(data) !== "undefined") {
                    if(io.listenerCount("packet")) {
                        io._emit("packet", name, data, socket, () => socket._emit(name, data));
                    }
                    else {
                        socket._emit(name, data);
                    }

                    return;
                }
            }

            //-----------]>

            socket.disconnect(1003);
        });

        ws.on("close", function(code, reason) {
            const {_disconnected, _terminated} = socket;
            const wasClean = !!_disconnected || code === 1000 || typeof(code) === "undefined";

            //--------]>

            socket._emit("close", code, reason, wasClean);
            io._emit("close", socket, code, reason, wasClean);

            //--------]>

            if(wasClean) {
                socket._emit("disconnected", code, reason);
                io._emit("offline", socket);
            }
            else {
                socket._emit("terminated", code);

                //-----]>

                const timeout = io._restoreTimeout;

                if(!_terminated && timeout && cidValid && code === 1006) {
                    ws.removeAllListeners();

                    socketsRestoringMap[cid] = socket;
                    socket._rtm = setTimeout(releaseSR, timeout, cid, timeout);
                }
                else {
                    io._emit("offline", socket);
                }
            }
        });

        ws.on("error", function(error) {
            socket._emit("error", error);
            io._emit("error", error, socket);
        });

        ws.on("ping", function(data) {
            socket._emit("ping", data);
        });

        ws.on("pong", function(data) {
            socket._emit("pong", data);
        });

        //-----------------]>

        if(socket) {
            socket._bind(ws);

            io._emit("restored", socket, upgradeReq);
        }
        else {
            socket = new Socket(io, ws);

            io._emit("connection", socket, upgradeReq);
        }

        io._emit("online", socket, upgradeReq);
    });

    app.wss.on("error", function(error) {
        io._emit("error", error, null);
    });

    app.wss.on("listening", function() {
        io._emit("listening");
    });

    //-----------------]>

    return io;

    //-----------------]>

    function releaseSR(cid, timeout) {
        const s = socketsRestoringMap[cid];

        if(s) {
            delete socketsRestoringMap[cid];
            clearTimeout(s._rtm);

            if(timeout) {
                io._emit("unrestored", s, timeout);
                io._emit("offline", s);
            }
        }

        return s;
    }
}

//-----------------------------------------------------

module.exports = main;
