//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rSEE          = require("./SEE"),
      rPacker       = require("./packer"),
      rToString     = require("./toString"),
      rUserSession  = require("./../experimental/userSession");

//-----------------------------------------------------

class Socket extends rSEE {
    constructor(io, ws) {
        super();

        //-------]>

        this._io = io;
        this._ws = ws;

        //-----------------]>

        const _s = ws._socket;

        //-----------------]>

        this.remotePort = _s.remotePort;
        this.remoteAddress = _s.remoteAddress;
        this.remoteFamily = _s.remoteFamily;

        //-------]>

        this.OPEN   = ws.OPEN;
        this.CLOSED = ws.CLOSED;
    }


    get readyState() {
        return this._ws.readyState;
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


    disconnect(code, reason) {
        this._ws.close(code, reason);
    }

    terminate() {
        this._ws.terminate();
    }


    ping(message) {
        this._ws.ping(message);
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


    packets(...args) {
        let namespace, unpack, pack, shared;

        //----------]>

        if(typeof(arguments[0]) === "string") {
            [namespace, unpack, pack, shared] = args;
        }
        else {
            [unpack, pack, shared] = args;
        }

        namespace = namespace ? (namespace + ".") : "";

        //----------]>

        forEach(unpack, (name, srz) => {
            this._unpackMapById.push([namespace + name, srz]);
        });

        forEach(pack, (name, srz) => {
            this._packMapByName.set(namespace + name, [this._packMapByName.size, srz]);
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

    session(store = rUserSession) {
        store(this);
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

    //-----------------]>

    if(io.isMaster) {
        return io;
    }

    app.wss.on("connection", function(ws) {
        const socket = new Socket(io, ws);

        let tBufData;

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

                if(data) {
                    io._emit("packet", name, data, socket);

                    if(!socket.dropPackets) {
                        socket._emit(name, data);
                    }

                    return;
                }
            }

            //-----------]>

            ws.terminate();
        });

        ws.on("close", function(code, reason) {
            socket._emit("close", code, reason);
            io._emit("close", socket, code, reason);

            if(code === 1000) {
                socket._emit("disconnected", code, reason);
            }
            else {
                socket._emit("terminated", code);
            }
        });

        ws.on("error", function(data) {
            io._emit("error", data, socket);
        });

        ws.on("ping", function(data) {
            socket._emit("ping", data);
        });

        ws.on("pong", function(data) {
            socket._emit("pong", data);
        });

        //-----------------]>

        io._emit("connection", socket, ws.upgradeReq);
    });

    //-----------------]>

    return io;
}

//-----------------------------------------------------

module.exports = main;
