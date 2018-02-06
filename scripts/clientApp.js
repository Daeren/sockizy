﻿//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const ws = (function(WSocket, toString = require("./../src/toString"), SEE = require("./../src/see"), bPack = require("2pack")) {
    const sysInfoPacker = bPack("uint16"); // packetId.bytes.uint16
    const sysInfoSize = 2;

    //---------------]>

    class Io extends SEE {
        constructor(url, options) {
            super();

            //-------]>

            this._reconnectionDelay = 1000 * Math.max(1, options.reconnectionDelay || 0);
            this._reconnectionAttempts = options.reconnectionAttempts || Infinity;
            this._reconnectionAttemptsCount = 0;

            this._packMapByName = new Map();
            this._unpackMapById = new Array();
            this._id = genId();

            //-------]>

            this.reconnecting = false;

            //-------]>

            this.CONNECTING     = WSocket.CONNECTING;
            this.OPEN           = WSocket.OPEN;
            this.CLOSING        = WSocket.CLOSING;
            this.CLOSED         = WSocket.CLOSED;

            //-------]>

            if(url) {
                const tWsUrlParse = url.trim().split(/(^wss?:\/\/)/i);

                const wsUrl = tWsUrlParse.pop().replace(/^[:\/\/]*/, "");
                const wsProtocol = (tWsUrlParse.pop() || "").trim();
                const wsSecProtocol = !!(wsProtocol && wsProtocol.match(/^wss:\/\//i));

                let {secure} = options;

                //------------]>

                if(typeof(secure) === "undefined") {
                    secure = wsProtocol ? wsSecProtocol : !!document.location.protocol.match(/^https/i);
                }

                //------------]>

                this._connect((secure ? "wss" : "ws") + "://" + wsUrl + "/?id=" + this._id);
            }
        }


        get bufferedAmount() {
            return this._ws && this._ws.bufferedAmount || 0;
        }

        get readyState() {
            return this._ws && this._ws.readyState || this.CLOSED;
        }

        get url() {
            return this._ws && this._ws.url || "";
        }


        emit(name, data) {
            data = this._pack(name, data);

            if(data) {
                this.send(data);
            }

            return !!data;
        }

        text(data) {
            this.send(toString(data));
        }

        json(data) {
            this.send(JSON.stringify(data));
        }

        send(data) {
            const st = this.readyState;

            let error;

            //------------]>

            try {
                if(st !== this.CLOSING && st !== this.CLOSED) {
                    this._ws.send(data);
                }
                else {
                    error = new Error("WebSocket is already in CLOSING or CLOSED state.");
                }
            } catch(e) {
                error = e;
            }

            if(error) {
                this._emit("error", error);
            }
        }


        disconnect(code = 1000, reason = "") {
            const st = this.readyState;

            if(st !== this.CLOSING && st !== this.CLOSED) {
                this._ws.close(code, reason);
            }

            //------------]>

            return this;
        }


        packets(pack, unpack, shared) {
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
                    const packet = bPack(schema, useHolderArray, holderNew);

                    //-------]>

                    packet.offset = sysInfoSize;

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


        _connect(url) {
            try {
                this._ws = new WSocket(url);
            }
            catch(e) {
                this._emit("error", e);
                return;
            }

            //------------]>

            const w = this._ws;

            //------------]>

            w.onmessage = wsOnMessage.bind(w, this);
            w.onopen = wsOnOpen.bind(w, this);
            w.onclose = wsOnClose.bind(w, this);
            w.onerror = wsOnError.bind(w, this);

            w.binaryType = "arraybuffer";
        }

        _reconnect() {
            this._connect(this.url);
        }

        _pack(name, data) {
            const pk = this._packMapByName.get(name);

            if(pk) {
                const [id, srz] = pk;
                return sysInfoPacker.pack(id, srz.pack(data));

            }

            return null;
        }
    }

    //---------------]>

    return WSocket ? io : null;

    //---------------]>

    function io(url, options = {}) {
        const app = new Io(url, options);

        if(Array.isArray(io.__staticPackets)) {
            app.packets(...io.__staticPackets);
        }

        return app;
    }

    //--------)>

    function wsOnMessage(socket, event) {
        let data = event.data;

        //-----------]>

        socket._emit("message", data, event);

        if(typeof(data) === "string") {
            socket._emit("text", data, event);

            if(socket.listenerCount("json")) {
                try {
                    data = JSON.parse(data);
                }
                catch(e) {
                    data = void(e);
                }

                if(typeof(data) !== "undefined") {
                    socket._emit("json", data, event);
                }
            }

            return;
        }
        else if(socket._emit("arraybuffer", data, event)) {
            return;
        }

        //-----------]>

        data = new Uint8Array(data);

        //-----------]>

        const dataByteLength = data.byteLength;

        let offset  = 0,
            pkt     = data;

        //-----------]>

        while(offset < dataByteLength) {
            const pktId = sysInfoPacker.unpack(pkt, offset, dataByteLength);
            const pktSchema = socket._unpackMapById[pktId];

            //-----------]>

            if(!pktSchema) {
                break;
            }

            //-----------]>

            const [name, srz] = pktSchema;
            const message = srz.unpack(pkt, offset, dataByteLength, cbMoveOffset);

            //-----------]>

            if(typeof(message) === "undefined") {
                break;
            }

            //-----------]>

            if(socket.listenerCount("packet")) {
                socket._emit("packet", name, message, () => socket._emit(name, message));
            }
            else {
                socket._emit(name, message);
            }
        }

        //-----------]>

        function cbMoveOffset(size) {
            offset += size;
        }
    }

    function wsOnOpen(socket, event) {
        const rcAttemptsCount = socket._reconnectionAttemptsCount;

        //--------]>

        socket._reconnectionAttemptsCount = 0;

        if(socket.reconnecting) {
            socket.reconnecting = false;
            socket._emit("restored", rcAttemptsCount);
        }

        socket._emit("open");
    }

    function wsOnClose(socket, event) {
        const {code, reason} = event;

        //--------]>

        socket._emit("close", code, reason, event);

        if(event.wasClean) {
            socket._emit("disconnected", code, reason, event);
        }
        else {
            const rcAttemptsCount = socket._reconnectionAttemptsCount;

            //--------]>

            socket._emit("terminated", code, event);

            //--------]>

            if(rcAttemptsCount < socket._reconnectionAttempts) {
                socket._reconnectionAttemptsCount++;

                setTimeout(() => {
                    socket.reconnecting = true;
                    socket._reconnect();

                    socket._emit("restoring", rcAttemptsCount);
                }, socket._reconnectionDelay);
            }
            else {
                socket.reconnecting = false;

                socket._emit("unrestored", rcAttemptsCount);
            }
        }
    }

    function wsOnError(socket, event) {
        const error = new Error(event.message || event.data || "");
        error.event = event;

        socket._emit("error", error);
    }

    //--------)>

    function genId() {
        return typeof(crypto) === "undefined" ? guid() : uuidv4();

        //----------]>

        function guid() {
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();

            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
        }

        function uuidv4() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
        }
    }
});

//-----------------------------------------------------

module.exports = ws;
