//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

return function(url, options = {}) {
    class Io extends SEE {
        constructor() {
            super();

            //-------------]>

            this._reconnectionDelay = 1000 * Math.max(1, options.reconnectionDelay || 0);
            this._reconnectionAttempts = options.reconnectionAttempts || Infinity;
            this._reconnectionAttemptsCount = 0;

            this._packMapByName = new Map();
            this._unpackMapById = new Array();

            //-------------]>

            this.reconnecting = false;

            if(url) {
                this.connect(url, options.secure);
            }
        }


        isSupported() {
            return typeof(WebSocket) !== "undefined";
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

        send(data) {
            try {
                this._ws.send(data);
            } catch(e) {
                this._emit("error", e);
            }
        }


        connect(url, secure) {
            if(this._ws) {
                this._ws.close();
            }

            //------------]>

            const tWsUrlParse = url.trim().split(/(^wss?:\/\/)/i);

            const wsUrl = tWsUrlParse.pop().replace(/^[:\/\/]*/, "");
            const wsProtocol = tWsUrlParse.pop().trim();
            const wsSecProtocol = !!(wsProtocol && wsProtocol.match(/^wss:\/\//i));

            //------------]>

            if(typeof(secure) === "undefined") {
                secure = wsProtocol ? wsSecProtocol : !!document.location.protocol.match(/^https/i);
            }

            //------------]>

            const w =
                this._ws =
                    new WebSocket((secure ? "wss" : "ws") + "://" + wsUrl);

            //------------]>

            this.url = url;

            w.binaryType = "arraybuffer";

            w.onmessage = wsOnMessage.bind(this, this);
            w.onopen = wsOnOpen.bind(this, this);
            w.onclose = wsOnClose.bind(this, this);
            w.onerror = wsOnError.bind(this, this);

            //------------]>

            return this;
        }

        disconnect(code, reason) {
            this._ws.close(code, reason);
            this._ws = null;

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
                    const t = field.split(/\(([\[\{]?)(\@?)([\}\]]?)\)$/);

                    let name,
                        useHolderArray,
                        holderNew;

                    //-------]>

                    name = t.shift().trim();
                    useHolderArray = t.shift() === "[";
                    holderNew = t.shift() === "@";

                    //-------]>

                    testName(name);
                    callback(name, packer.createPacket(data[field], useHolderArray, holderNew));
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


        _reconnect() {
            return this.connect(this.url);
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
            const message = srz.unpack(pkt, offset, dataByteLength, moveOffset);

            //-----------]>

            if(!message) {
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

        function moveOffset(size) {
            offset += size;
        }
    }

    function wsOnOpen(socket, event) {
        const rcAttemptsCount = this._reconnectionAttemptsCount;

        //--------]>

        this._reconnectionAttemptsCount = 0;

        if(this.reconnecting) {
            this.reconnecting = false;

            this._emit("restored", rcAttemptsCount);
        }

        this._emit("open");
    }

    function wsOnClose(socket, event) {
        const {code, reason} = event;

        this._emit("close", code, reason, event);

        if(event.wasClean) {
            this._emit("disconnected", code, reason, event);
        }
        else {
            const rcAttemptsCount = this._reconnectionAttemptsCount;

            //--------]>

            this._emit("terminated", code, event);

            //--------]>

            if(rcAttemptsCount < this._reconnectionAttempts) {
                this._reconnectionAttemptsCount++;

                setTimeout(() => {
                    this.reconnecting = true;
                    this._reconnect();

                    this._emit("restoring", rcAttemptsCount);
                }, this._reconnectionDelay);
            }
            else {
                this.reconnecting = false;

                this._emit("unrestored", rcAttemptsCount);
            }
        }
    }

    function wsOnError(socket, error) {
        this._emit("error", error);
    }
};