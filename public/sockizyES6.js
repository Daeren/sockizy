//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

const io = (function() {
    "use strict";

    //-----------------------------------------------------

    const $packer = (function() {
        const holyBuffer = typeof(Buffer) !== "undefined" ? Buffer : (function() {
                const MAX_ARGUMENTS_LENGTH = 0x1000;
                const K_MAX_LENGTH = 0x7fffffff;

                const Buffer = function() {};

                //---------------------]>

                Buffer.alloc = alloc;
                Buffer.byteLength = byteLength;
                Buffer.from = function(data) {
                    if(typeof(data) === "string") {
                        return utf8ToBytes(data);
                    } else {
                        return {
                            toString() {
                                return utf8Slice(data, 0, data.length);
                            }
                        };
                    }
                };

                //---------------------]>

                return Buffer;

                //---------------------]>

                function utf8ToBytes(string, units) {
                    units = units || Infinity;

                    const length = string.length;

                    let codePoint;
                    let leadSurrogate = null;
                    let bytes = new Array();

                    for(let i = 0; i < length; ++i) {
                        codePoint = string.charCodeAt(i);

                        // is surrogate component
                        if(codePoint > 0xD7FF && codePoint < 0xE000) {
                            // last char was a lead
                            if(!leadSurrogate) {
                                // no lead yet
                                if(codePoint > 0xDBFF) {
                                    // unexpected trail
                                    if((units -= 3) > -1) {
                                        bytes.push(0xEF, 0xBF, 0xBD);
                                    }

                                    continue;
                                } else if(i + 1 === length) {
                                    // unpaired lead
                                    if((units -= 3) > -1) {
                                        bytes.push(0xEF, 0xBF, 0xBD);
                                    }

                                    continue;
                                }

                                // valid lead
                                leadSurrogate = codePoint;

                                continue;
                            }

                            // 2 leads in a row
                            if(codePoint < 0xDC00) {
                                if((units -= 3) > -1) {
                                    bytes.push(0xEF, 0xBF, 0xBD);
                                }

                                leadSurrogate = codePoint;

                                continue;
                            }

                            // valid surrogate pair
                            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
                        } else if(leadSurrogate) {
                            // valid bmp char, but last char was a lead
                            if((units -= 3) > -1) {
                                bytes.push(0xEF, 0xBF, 0xBD);
                            }
                        }

                        leadSurrogate = null;

                        // encode utf8
                        if(codePoint < 0x80) {
                            if((units -= 1) < 0) {
                                break;
                            }

                            bytes.push(codePoint);
                        } else if(codePoint < 0x800) {
                            if((units -= 2) < 0) {
                                break;
                            }

                            bytes.push(
                                codePoint >> 0x6 | 0xC0,
                                codePoint & 0x3F | 0x80
                            );
                        } else if(codePoint < 0x10000) {
                            if((units -= 3) < 0) {
                                break;
                            }

                            bytes.push(
                                codePoint >> 0xC | 0xE0,
                                codePoint >> 0x6 & 0x3F | 0x80,
                                codePoint & 0x3F | 0x80
                            );
                        } else if(codePoint < 0x110000) {
                            if((units -= 4) < 0) {
                                break;
                            }

                            bytes.push(
                                codePoint >> 0x12 | 0xF0,
                                codePoint >> 0xC & 0x3F | 0x80,
                                codePoint >> 0x6 & 0x3F | 0x80,
                                codePoint & 0x3F | 0x80
                            );
                        } else {
                            throw new Error("Invalid code point");
                        }
                    }

                    return bytes;
                }

                function utf8Slice(buf, start, end) {
                    end = Math.min(buf.length, end);

                    const res = new Array();
                    let i = start;

                    while(i < end) {
                        let firstByte = buf[i];
                        let codePoint = null;
                        let bytesPerSequence = (firstByte > 0xEF) ? 4
                            : (firstByte > 0xDF) ? 3
                                : (firstByte > 0xBF) ? 2
                                    : 1;

                        if(i + bytesPerSequence <= end) {
                            let secondByte, thirdByte, fourthByte, tempCodePoint;

                            switch(bytesPerSequence) {
                                case 1:
                                    if(firstByte < 0x80) {
                                        codePoint = firstByte;
                                    }

                                    break;

                                case 2:
                                    secondByte = buf[i + 1];

                                    if((secondByte & 0xC0) === 0x80) {
                                        tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);

                                        if(tempCodePoint > 0x7F) {
                                            codePoint = tempCodePoint;
                                        }
                                    }

                                    break;

                                case 3:
                                    secondByte = buf[i + 1];
                                    thirdByte = buf[i + 2];

                                    if((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);

                                        if(tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                            codePoint = tempCodePoint;
                                        }
                                    }

                                    break;

                                case 4:
                                    secondByte = buf[i + 1];
                                    thirdByte = buf[i + 2];
                                    fourthByte = buf[i + 3];

                                    if((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);

                                        if(tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                            codePoint = tempCodePoint;
                                        }
                                    }
                            }
                        }

                        if(codePoint === null) {
                            // we did not generate a valid codePoint so insert a
                            // replacement char (U+FFFD) and advance only 1 byte
                            codePoint = 0xFFFD;
                            bytesPerSequence = 1;
                        } else if(codePoint > 0xFFFF) {
                            // encode to utf16 (surrogate pair dance)
                            codePoint -= 0x10000;
                            res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                            codePoint = 0xDC00 | codePoint & 0x3FF;
                        }

                        res.push(codePoint);
                        i += bytesPerSequence;
                    }

                    return decodeCodePointsArray(res);
                }

                function createBuffer(length) {
                    if(length > K_MAX_LENGTH) {
                        throw new RangeError("Invalid typed array length");
                    }

                    const buf = new Uint8Array(length);
                    // buf.__proto__ = Buffer.prototype;

                    return buf;
                }

                function byteLength(string) {
                    return utf8ToBytes(string).length;
                }

                //--------)>

                function alloc(size) {
                    const buf = createBuffer(size);

                    buf.write = write;
                    buf.swap16 = swap16;

                    return buf;
                }

                //--------)>

                function write(string, offset, length) {
                    offset = offset || 0;

                    const remaining = this.length - offset;

                    if(!length || length > remaining) {
                        length = remaining;
                    }

                    return blitBuffer(utf8ToBytes(string, this.length - offset), this, offset, length);
                }

                function swap16() {
                    const len = this.length;

                    if(len % 2 !== 0) {
                        throw new RangeError("Buffer size must be a multiple of 16-bits");
                    }

                    for(let i = 0; i < len; i += 2) {
                        swap(this, i, i + 1);
                    }

                    return this;
                }

                //--------)>

                function blitBuffer(src, dst, offset, length) {
                    let i;

                    for(i = 0; i < length; ++i) {
                        if((i + offset >= dst.length) || (i >= src.length)) {
                            break;
                        }

                        dst[i + offset] = src[i];
                    }

                    return i;
                }

                function swap(b, n, m) {
                    const i = b[n];
                    b[n] = b[m];
                    b[m] = i;
                }

                function decodeCodePointsArray (codePoints) {
                    const len = codePoints.length;

                    if(len <= MAX_ARGUMENTS_LENGTH) {
                        return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
                    }

                    // Decode in chunks to avoid "call stack size exceeded".
                    let res = "";
                    let i = 0;

                    while(i < len) {
                        res += String.fromCharCode.apply(
                            String,
                            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                        );
                    }

                    return res;
                }
            })();

        //---------)>

        if(!Uint8Array.prototype.slice) {
            Object.defineProperty(Uint8Array.prototype, "slice", {
                "value": Array.prototype.slice
            });
        }

        //-------------------------]>

        const isBigEndian = (function() {
            const a = new Uint32Array([0x12345678]);
            const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);

            return b[0] === 0x12;
        })();

        const sysOffset = 3;

        //-------------------------]>

        return {isBigEndian, sysOffset, createPacket, getSize, getId};

        //-------------------------]>

        function createPacket(schema) {
            if(!Array.isArray(schema)) {
                schema = new Array();
            }

            //-----------------]>

            const schLen        = schema.length;

            const fields        = new Array(schLen);
            const buffers       = new Array(schLen);

            let pktDataHolder   = Object.create(null),
                pktMinSize      = 0,
                pktHasStr       = false,

                pktBufStrict    = null,
                pktBufPack      = null,
                pktBufUnpack    = null;

            let pktSysBVMSize   = new Uint16Array(1),
                pktSysBufMSize  = new Uint8Array(pktSysBVMSize.buffer);

            //-----------------]>

            const TYPE_STR      = 1;
            const TYPE_INT      = 2;
            const TYPE_UINT     = 4;
            const TYPE_FLOAT    = 8;

            //-----------------]>

            for(let e, i = 0; i < schLen; i++) {
                e = schema[i].split(":");

                //---------]>

                const name      = e.shift();
                const subType   = e.shift();

                const type      = getTypeId(subType.replace(/[\d\[\]]/g, ""));
                const size      = parseInt(subType.replace(/\D/g, ""), 10) || 0;

                const [
                    bytes,
                    bufType,
                    bufAType
                ]               = buildTypedBuf(type, size);

                const bufBytes  = (TYPE_STR & type) ? null : new Uint8Array(bufType.buffer);
                const bufABytes = bufAType ? new Uint8Array(bufAType.buffer) : null;

                //---------]>

                fields[i] = [name, type, bytes, bufType, bufBytes, bufAType, bufABytes];

                pktMinSize += bytes;

                if(!pktHasStr && (TYPE_STR & type)) {
                    pktHasStr = true;
                }
            }

            if(!pktHasStr) {
                pktBufStrict = new Uint8Array(pktMinSize + sysOffset);
            }

            //-----------------]>

            return {pack, unpack};

            //-----------------]>

            function pack(id, data) {
                const isArray = Array.isArray(data);

                let input, field,
                    name, type, bytes, bufType, bufBytes, bufAType, bufABytes;

                let len     = schLen;

                let pktSize = sysOffset,
                    tLen, tIdx;

                //--------]>

                while(len--) {
                    field = fields[len];
                    [name, type, bytes, bufType, bufBytes, bufAType, bufABytes] = field;

                    input = data[isArray ? len : name];

                    //------]>

                    switch(type) {
                        case TYPE_STR: {
                            const needMem = input ? bufType.write(input) : 0;
                            let offset = bufAType.byteLength;

                            //-----]>

                            if(!bufBytes || bufBytes.length !== needMem) {
                                bufBytes = field[4] = new Uint8Array(offset + needMem);
                            }

                            bufAType[0] = needMem;
                            bufBytes[0] = bufABytes[0];
                            bufBytes[1] = bufABytes[1];

                            if(isBigEndian) {
                                bufAType.reverse();
                                bufType.swap16();
                            }

                            //-----]>

                            let i = needMem;

                            while(i--) {
                                bufBytes[offset + i] = bufType[i];
                            }

                            offset += needMem;

                            break;
                        }

                        default:
                            bufType[0] = input;

                            if(isBigEndian && bufType.byteLength > 1) {
                                bufType.reverse();
                            }
                    }

                    //------]>

                    tLen = bufBytes.length;

                    if(pktBufStrict) {
                        tIdx = 0;

                        while(tLen--) {
                            pktBufStrict[pktSize++] = bufBytes[tIdx++];
                        }
                    }
                    else {
                        buffers[len] = bufBytes;
                        pktSize += tLen;
                    }
                }

                if(pktBufStrict) {
                    pktBufStrict[0] = id;
                    return pktBufStrict;
                }

                //--------]>

                let result = pktBufPack && pktBufPack.length === pktSize ? pktBufPack : (pktBufUnpack && pktBufUnpack.length === pktSize ? pktBufUnpack : null);
                let resOffset = sysOffset;

                len = schLen;

                //--------]>

                if(!result) {
                    result = pktBufPack = new Uint8Array(pktSize);
                }

                while(len--) {
                    for(let b = buffers[len], i = 0, l = b.length; i < l; i++) {
                        result[resOffset++] = b[i];
                    }
                }

                //--------]>

                pktSysBVMSize[0] = pktSize;

                result[0] = pktSysBufMSize[0];
                result[1] = pktSysBufMSize[1];
                result[2] = id;

                //--------]>

                return result;
            }

            function unpack(bin, target) {
                target = target || pktDataHolder;

                //--------]>

                if(!bin || typeof(bin) !== "object" || !pktHasStr && bin.byteLength !== pktMinSize || bin.byteLength < pktMinSize) {
                    return null;
                }

                if(!schLen) {
                    return target;
                }

                if(bin instanceof ArrayBuffer) {
                    const buf = pktBufUnpack && pktBufUnpack.length === bin.length ? pktBufUnpack : (pktBufPack && pktBufPack.length === bin.length ? pktBufPack : null);

                    if(buf) {
                        buf.set(bin);
                        bin = buf;
                    }
                    else {
                        bin = pktBufUnpack = new Uint8Array(bin);
                    }
                }

                //--------]>

                const binLen = bin.byteLength;

                let field,
                    len = schLen,
                    name, type, bytes, bufType, bufBytes, bufAType, bufABytes;

                let pktOffset = sysOffset;

                //--------]>

                while(len--) {
                    field = fields[len];
                    [name, type, bytes, bufType, bufBytes, bufAType, bufABytes] = field;

                    //------]>

                    for(let i = 0; i < bytes; i++) {
                        if(pktOffset >= binLen) {
                            return null;
                        }

                        if(bufAType) {
                            bufABytes[i] = bin[pktOffset++];
                        }
                        else {
                            bufBytes[i] = bin[pktOffset++];
                        }
                    }

                    //------]>

                    switch(type) {
                        case TYPE_STR:
                            if(isBigEndian) {
                                bufAType.reverse();
                            }

                            //--------]>

                            const byteLen = bufAType[0];
                            const needMem = Math.min(byteLen, binLen);

                            //--------]>

                            const s = holyBuffer.from(bin.slice(pktOffset, pktOffset + byteLen)).toString();
                            pktOffset += byteLen;

                            //--------]>

                            target[name] = s;

                            break;

                        default:
                            if(isBigEndian && bufType.byteLength > 1) {
                                bufType.reverse();
                            }

                            target[name] = bufType[0];
                    }
                }

                //--------]>

                return target;
            }

            //-----------------]>

            function buildTypedBuf(type, size) {
                switch(type) {
                    case TYPE_STR:
                        if(size && (size % Uint16Array.BYTES_PER_ELEMENT) !== 0) {
                            throw new RangeError(`Buffer size must be a multiple of 16-bits | str:${size}`);
                        }

                        return [Uint16Array.BYTES_PER_ELEMENT, holyBuffer.alloc(size || 256), new Uint16Array(1)];

                    case TYPE_INT:
                        switch(size) {
                            case 8: return [Int8Array.BYTES_PER_ELEMENT, new Int8Array(1)];
                            case 16: return [Int16Array.BYTES_PER_ELEMENT, new Int16Array(1)];
                            case 32: return [Int32Array.BYTES_PER_ELEMENT, new Int32Array(1)];

                            default:
                                throw new Error(`Unknown size: ${size}`);
                        }


                    case TYPE_UINT:
                        switch(size) {
                            case 8: return [Uint8Array.BYTES_PER_ELEMENT, new Uint8Array(1)];
                            case 16: return [Uint16Array.BYTES_PER_ELEMENT, new Uint16Array(1)];
                            case 32: return [Uint32Array.BYTES_PER_ELEMENT, new Uint32Array(1)];

                            default:
                                throw new Error(`Unknown size: ${size}`);
                        }


                    case TYPE_FLOAT:
                        switch(size) {
                            case 32: return [Float32Array.BYTES_PER_ELEMENT, new Float32Array(1)];
                            case 64: return [Float64Array.BYTES_PER_ELEMENT, new Float64Array(1)];

                            default:
                                throw new Error(`Unknown size: ${size}`);
                        }

                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }

            function getTypeId(type) {
                switch(type) {
                    case "str": return TYPE_STR;

                    case "int": return TYPE_INT;
                    case "uint": return TYPE_UINT;
                    case "float": return TYPE_FLOAT;

                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }
        }

        //-----------)>

        function getSize(data, holder) {
            if(holder) {
                holder.set(data);
            }
            else {
                holder = new Uint16Array(data);
            }

            return holder[0];
        }

        function getId(data, holder) {
            if(holder) {
                holder.set(data);
                return holder[0];
            }
            else {
                return data[sysOffset - 1];
            }
        }
    })();

    //-----------------------------------------------------

    return function(url, options) {
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
                        callback(field, $packer.createPacket(data[field]));
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

            if(!data || !(data instanceof ArrayBuffer) || dataByteLength < $packer.sysOffset) {
                return;
            }

            data = new Uint8Array(data);

            //-----------]>

            let offset  = 0,
                pkt     = data;

            let limit = 1024 * 1024;

            //-----------]>

            while(offset < dataByteLength && limit--) {
                const pktSchema = app._unpackMapById[$packer.getId(pkt)];
                const pktSize   = pktSchema ? $packer.getSize(pkt) : 0;

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
})();