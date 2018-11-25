//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const bPack = require("2pack");
const XEE = require("xee");

const toString = require("./toString");

//-----------------------------------------------------

const sysInfoHeader = bPack("uint16");

//-----------------------------------------------------

class Socket extends XEE {
    constructor(io, ws) {
        super();

        //-------]>

        this._emit = super.emit;

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

            return data.byteLength;
        }

        return 0;
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
            this.send(toString(data), null);
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
                this._emit("error", e);
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

        const {remotePort, remoteAddress, remoteFamily} = ws._socket;

        //-----------]>

        this.remotePort = remotePort;
        this.remoteAddress = remoteAddress;
        this.remoteFamily = remoteFamily;
    }
}

class Io extends XEE {
    constructor(app, options) {
        super();

        Object.assign(this, app);

        //----------]>

        this._emit = super.emit;

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
            return data.byteLength;
        }

        return 0;
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
        this.broadcast(toString(data), null);
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

                const name = t.shift().trim();
                const useHolderArray = t.shift() === "[";
                const holderNew = t.shift() === "@";

                const schema = data[field];
                const packet = bPack(schema, holderNew, useHolderArray);

                //-------]>

                packet.offset = sysInfoHeader.maxSize;

                //-------]>

                testName(name);
                callback(name, packet);
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


    sendPacketTransform(callback) {
        this._sendPacketTransform = callback;
        return this;
    }

    recvPacketTransform(callback) {
        this._recvPacketTransform = callback;
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
                    const t = Buffer.allocUnsafe(offset + pkt.byteLength);

                    this._buffer.copy(t);
                    pkt.copy(t, offset);

                    this._buffer = t;
                }
                else {
                    this._buffer = Buffer.allocUnsafe(pkt.byteLength);
                    pkt.copy(this._buffer);
                }

                return pkt.byteLength;
            },

            _end(name, data) {
                if(name) {
                    this.write(name, data);
                }

                return this._buffer ? this._buffer.byteLength : 0;
            }
        };
    }

    _pack(name, data) {
        const pk = this._packMapByName.get(name);

        if(pk) {
            const [id, srz] = pk;
            const deflateCb = this._sendPacketTransform;

            data = sysInfoHeader.pack(id, srz.pack(data));

            return deflateCb ? deflateCb(name, data) : data;

        }

        return null;
    }
}

//-----------------------------------------------------

function main(app, options) {
    const io = new Io(app, options);

    //-----------------]>

    app.wss.on("connection", function(ws) {
        const {upgradeReq} = ws;
        const socket = new Socket(io, ws);

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

            const inflateCb = io._recvPacketTransform;

            if(inflateCb) {
                data = inflateCb(data);

                if(!data) {
                    return;
                }
            }
            else {
                data = Buffer.from(data);
            }

            //-----------]>

            const dataByteLength = data.byteLength;

            const pktId = sysInfoHeader.unpack(data, 0, dataByteLength);
            const pktSchema = io._unpackMapById[pktId];

            //-----------]>

            if(pktSchema) {
                const [name, srz] = pktSchema;

                data = srz.unpack(data, 0, dataByteLength);

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
            }
            else {
                socket._emit("terminated", code);
            }
        });

        ws.on("error", function(error) {
            socket._emit("error", error);
        });

        ws.on("ping", function(data) {
            socket._emit("ping", data);
        });

        ws.on("pong", function(data) {
            socket._emit("pong", data);
        });

        //-----------------]>

        io._emit("connection", socket, upgradeReq);
    });

    app.wss.on("error", function(error) {
        io._emit("error", error);
    });

    app.wss.on("listening", function() {
        io._emit("listening");
    });

    //-----------------]>

    return io;
}

//-----------------------------------------------------

module.exports = main;
