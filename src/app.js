//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rPacker = require("./packer");

//-----------------------------------------------------

class SEE {
    constructor() {
        this._events = Object.create(null);
    }


    on(name, listener) {
        const ev = this._events[name];

        if(typeof(ev) === "function") {
            this._events[name] = [ev, listener];
        } else {
            this._events[name] = ev ? this._arrayCloneWith(ev, ev.length, listener) : listener;
        }

        return this;
    }

    off(name, listener) {
        const argsLen = arguments.length;

        //--------------]>

        if(!argsLen) {
            this._events = Object.create(null);
            return this;
        }

        //--------------]>

        const ev = this._events[name];

        if(typeof(ev) === "function") {
            if(argsLen === 1 || ev === listener) {
                this._events[name] = null;
            }

            return this;
        }

        //--------------]>

        const evLen = ev && ev.length;

        //--------------]>

        if(!evLen) {
            return this;
        }

        //--------------]>

        if(argsLen === 1) {
            if(evLen === 1) {
                ev.pop();
            } else {
                this._events[name] = new Array();
            }
        } else if(evLen === 1) {
            if(ev[0] === listener) {
                ev.pop();
            }
        } else if(ev.indexOf(listener) >= 0) {
            this._events[name] = this._arrayCloneWithout(ev, evLen, listener);
        }

        //--------------]>

        return this;
    }


    _emit(name) {
        const ev    = this._events[name];
        const func  = typeof(ev) === "function" && ev;

        const evLen = func || ev && ev.length;

        //--------------]>

        if(!evLen) {
            if(name === "error") {
                throw arguments[1];
            }

            return false;
        }

        //--------------]>

        const argsLen = arguments.length;

        //--------------]>

        if(func) {
            switch(argsLen) {
                case 1: func.call(this); break;
                case 2: func.call(this, arguments[1]); break;
                case 3: func.call(this, arguments[1], arguments[2]); break;
                case 4: func.call(this, arguments[1], arguments[2], arguments[3]); break;

                default:
                    const args = new Array(argsLen - 1);

                    for(let i = 1; i < argsLen; i++) {
                        args[i - 1] = arguments[i];
                    }

                    func.apply(this, args);
            }

            return true;
        }

        switch(argsLen) {
            case 1:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this);
                }

                break;

            case 2:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1]);
                }

                break;

            case 3:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1], arguments[2]);
                }

                break;

            case 4:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1], arguments[2], arguments[3]);
                }

                break;

            default:
                const args = new Array(argsLen - 1);

                for(let i = 1; i < argsLen; i++) {
                    args[i - 1] = arguments[i];
                }

                for(let i = 0; i < evLen; i++) {
                    ev[i].apply(this, args);
                }
        }

        //--------------]>

        return true;
    }

    _arrayCloneWithout(arr, n, listener) {
        const copy = new Array(--n);

        let t;

        while(n--) {
            t = arr[n];

            if(listener !== t) {
                copy[n] = t;
            }
        }

        return copy;
    }

    _arrayCloneWith(arr, n, listener) {
        const copy = new Array(n + 1);

        while(n--) {
            copy[n] = arr[n];
        }

        copy[n] = listener;

        return copy;
    }
}

class Socket extends SEE {
    constructor(io, ws) {
        super();

        this._io = io;
        this._ws = ws;
    }


    emit(name, data, isBroadcast) {
        data = this._io._pack(name, data);

        if(data) {
            if(isBroadcast) {
                this._io.broadcast(data);
            } else {
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
                } else {
                    self.send(this._buffer);
                }
            }

            return bytes;
        }
    }

    send(data, options) {
        this._ws.send(data, options || this._io._msgOptions, e => {
            if(e) {
                this._io._emit("error", e);
            }
        });
    }


    disconnect(code, reason) {
        this._ws.close(code, reason);
    }

    terminate() {
        this._ws.terminate();
    }
}

class Io extends SEE {
    constructor(app, options) {
        super();

        Object.assign(this, app);

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


    broadcast(data, options) {
        this.wss.broadcast(data, options || this._msgOptions);
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

        //----------]>

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
                testName(field);
                callback(field, rPacker.createPacket(data[field]));
            });
        }

        function testName(n) {
            let r = [
                "close", "disconnected", "terminated",
                "message", "arraybuffer", "error",
                "ping", "pong"
            ];

            if(r.some(e => e === n)) {
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
                } else {
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

    app.wss.on("connection", function(ws) {
        const socket = new Socket(io, ws);

        let tBufMId;

        //-----------------]>

        ws.binaryType = "arraybuffer";

        //-----------------]>

        ws.on("message", function(data) {
            socket._emit("message", data);

            if(socket._emit("arraybuffer", data)) {
                return;
            }
            //-----------]>

            const dataByteLength = data.byteLength;

            //-----------]>

            if(!data || !(data instanceof ArrayBuffer) || dataByteLength < rPacker.sysOffset) {
                return;
            }

            if(!tBufMId || tBufMId.buffer.byteLength !== dataByteLength) {
                tBufMId = new Uint8Array(data, rPacker.sysOffset - 1, 1);
            }

            //-----------]>

            const pktSchema = io._unpackMapById[rPacker.getId(data, tBufMId)];

            //-----------]>

            if(!pktSchema) {
                ws.terminate();
                return;
            }

            //-----------]>

            const [name, srz] = pktSchema;

            //-----------]>

            data = srz.unpack(data);

            if(data) {
                io._emit("packet", name, data, socket);
                socket._emit(name, data);
            }
        });

        ws.on("close", function(code, reason) {
            socket._emit("close", code, reason);

            if(code === 1000) {
                socket._emit("disconnected", code, reason);
            } else {
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
