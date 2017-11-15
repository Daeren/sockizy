//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

return function(url, options = {}) {
    const WSocket = window.WebSocket || window.MozWebSocket;

    //---------------]>

    if(!Uint8Array.prototype.slice) {
        Object.defineProperty(Uint8Array.prototype, "slice", {
            "value": Array.prototype.slice
        });
    }

    //---------------]>

    class Io extends SEE {
        constructor() {
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


        isSupported() {
            return typeof(WSocket) !== "undefined";
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


        packets(...args) {
            let namespace, unpack, pack, shared;

            //----------]>

            if(typeof(arguments[0]) === "string") {
                [namespace, pack, unpack, shared] = args;
            }
            else {
                [pack, unpack, shared] = args;
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
                    callback(name, packer.createPacket(schema, useHolderArray, holderNew));
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
            const w = this._ws = new WSocket(url);

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
            const t = this._packMapByName.get(name);

            //---------]>

            if(!t) {
                return null;
            }

            //---------]>

            const [id, srz] = t;

            //---------]>

            return srz.pack(id, data);
        }
    }

    //---------------]>

    return new Io();

    //---------------]>

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
            const pktSchema = this._unpackMapById[packer.getId(pkt)];

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

            if(dataByteLength > offset) {
                pkt = data.slice(offset);
            }

            //-----------]>

            socket._emit("packet", name, message);
            socket._emit(name, message);
        }

        //-----------]>

        function cbMoveOffset(size) {
            offset += size;
        }
    }

    function wsOnOpen(socket, event) {
        const rcAttemptsCount = this._reconnectionAttemptsCount;

        //--------]>

        this._reconnectionAttemptsCount = 0;

        if(this.reconnecting) {
            this.reconnecting = false;
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
            const rcAttemptsCount = this._reconnectionAttemptsCount;

            //--------]>

            socket._emit("terminated", code, event);

            //--------]>

            if(rcAttemptsCount < this._reconnectionAttempts) {
                this._reconnectionAttemptsCount++;

                setTimeout(() => {
                    this.reconnecting = true;
                    this._reconnect();

                    socket._emit("restoring", rcAttemptsCount);
                }, this._reconnectionDelay);
            }
            else {
                this.reconnecting = false;

                socket._emit("unrestored", rcAttemptsCount);
            }
        }
    }

    function wsOnError(socket, error) {
        socket._emit("error", error);
    }

    //--------)>

    function genId() {
        return crypto ? uuidv4() : guid();

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
};