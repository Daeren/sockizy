//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

return function(url, options) {
    class Io extends SEE {
        constructor() {
            super();

            if(url) {
                this.connect(url);
            }

            this._packMapByName = new Map();
            this._unpackMapById = new Array();

            this.reconnecting = false;
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

        send(data) {
            try {
                this._ws.send(data);
            } catch(e) {
                this._emit("error", e);
            }
        }


        connect(url) {
            if(this._ws) {
                this._ws.close();
            }

            //------------]>

            const w = this._ws = new WebSocket(url);

            //------------]>

            this.url = url;

            w.binaryType = "arraybuffer";

            w.onmessage = wsOnMessage.bind(this, this);
            w.onopen = wsOnOpen.bind(this, this);
            w.onclose = wsOnClose.bind(this, this);
            w.onerror = wsOnError.bind(this, this);
        }

        disconnect(code, reason) {
            this._ws.close(code, reason);
            this._ws = null;
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
                    testName(field);
                    callback(field, packer.createPacket(data[field]));
                });
            }

            function testName(n) {
                let r = [
                    "restoring", "restored",
                    "open", "close", "disconnected", "terminated",
                    "packet", "message", "arraybuffer", "error"
                ];

                if(r.some(e => e === n)) {
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

    const app = new Io();

    //---------------]>

    return app;

    //---------------]>

    function wsOnMessage(socket, event) {
        let data = event.data;

        //-----------]>

        socket._emit("message", data, event);

        if(socket._emit("arraybuffer", data, event)) {
            return;
        }

        //-----------]>

        const dataByteLength = data.byteLength;

        //-----------]>

        if(!data || !(data instanceof ArrayBuffer) || dataByteLength < packer.sysOffset) {
            return;
        }

        data = new Uint8Array(data);

        //-----------]>

        let offset  = 0,
            pkt     = data;

        //-----------]>

        while(offset < dataByteLength) {
            const pktSchema = app._unpackMapById[packer.getId(pkt)];
            const pktSize   = pktSchema ? packer.getSize(pkt) : 0;

            //-----------]>

            if(!pktSchema || !pktSize) {
                break;
            }

            //-----------]>

            const [name, srz] = pktSchema;
            const message = srz.unpack(pkt);

            //-----------]>

            offset += pktSize;

            if(dataByteLength > offset) {
                pkt = data.slice(offset);
            }

            if(message) {
                socket._emit("packet", name, message);
                socket._emit(name, message);
            }
        }
    }

    function wsOnOpen(socket, event) {
        if(app.reconnecting) {
            app.reconnecting = false;
            app._emit("restored");
        }

        app._emit("open");
    }

    function wsOnClose(socket, event) {
        const {code, reason} = event;

        app._emit("close", code, reason, event);

        if(event.wasClean) {
            app._emit("disconnected", code, reason, event);
        }
        else {
            app._emit("terminated", code, event);

            setTimeout(function() {
                app.reconnecting = true;
                app._reconnect();

                app._emit("restoring");
            }, 1000 * 2);
        }
    }

    function wsOnError(socket, error) {
        app._emit("error", error);
    }
}