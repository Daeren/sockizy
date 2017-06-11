"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var io = function (module) {
    'use strict';

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    var SEE = function () {
        var EE = function () {
            function EE() {
                _classCallCheck(this, EE);

                this._events = {};
            }

            _createClass(EE, [{
                key: "on",
                value: function on(name, listener) {
                    var ev = this._events[name];

                    if (typeof ev === "function") {
                        this._events[name] = [ev, listener];
                    } else {
                        this._events[name] = ev ? this._arrayCloneWith(ev, ev.length, listener) : listener;
                    }

                    return this;
                }
            }, {
                key: "off",
                value: function off(name, listener) {
                    var argsLen = arguments.length;

                    //--------------]>

                    if (!argsLen) {
                        this._events = {};
                        return this;
                    }

                    //--------------]>

                    var ev = this._events[name];

                    if (typeof ev === "function") {
                        if (argsLen === 1 || ev === listener) {
                            this._events[name] = null;
                        }

                        return this;
                    }

                    //--------------]>

                    var evLen = ev && ev.length;

                    //--------------]>

                    if (!evLen) {
                        return this;
                    }

                    //--------------]>

                    if (argsLen === 1) {
                        if (evLen === 1) {
                            ev.pop();
                        } else {
                            this._events[name] = new Array();
                        }
                    } else if (evLen === 1) {
                        if (ev[0] === listener) {
                            ev.pop();
                        }
                    } else if (ev.indexOf(listener) >= 0) {
                        this._events[name] = this._arrayCloneWithout(ev, evLen, listener);
                    }

                    //--------------]>

                    return this;
                }
            }, {
                key: "_emit",
                value: function _emit(name) {
                    var events = this._events[name];

                    //--------------]>

                    if (!events) {
                        if (name === "error") {
                            var error = arguments[1];

                            if (error instanceof Error) {
                                throw error;
                            } else {
                                var e = new Error("Unhandled \"error\" event. (" + error + ")");
                                e.context = error;

                                throw e;
                            }
                        }

                        return false;
                    }

                    //--------------]>

                    var isFn = typeof events === "function";
                    var argsLen = arguments.length;

                    //--------------]>

                    switch (argsLen) {
                        case 1:
                            emitNone(events, isFn, this);break;
                        case 2:
                            emitOne(events, isFn, this, arguments[1]);break;
                        case 3:
                            emitTwo(events, isFn, this, arguments[1], arguments[2]);break;
                        case 4:
                            emitThree(events, isFn, this, arguments[1], arguments[2], arguments[3]);break;

                        default:
                            {
                                var args = new Array(argsLen - 1);

                                for (var i = 1; i < argsLen; ++i) {
                                    args[i - 1] = arguments[i];
                                }

                                emitMany(events, isFn, this, args);
                            }
                    }

                    //--------------]>

                    return true;
                }
            }, {
                key: "_arrayCloneWithout",
                value: function _arrayCloneWithout(arr, n, listener) {
                    var copy = new Array(--n);

                    var t = void 0;

                    while (n--) {
                        t = arr[n];

                        if (listener !== t) {
                            copy[n] = t;
                        }
                    }

                    return copy;
                }
            }, {
                key: "_arrayCloneWith",
                value: function _arrayCloneWith(arr, n, listener) {
                    var copy = new Array(n + 1);

                    while (n--) {
                        copy[n] = arr[n];
                    }

                    copy[n] = listener;

                    return copy;
                }
            }]);

            return EE;
        }();

        //-----------------------]>

        return EE;

        //-----------------------]>

        function emitNone(handler, isFn, self) {
            if (isFn) {
                handler.call(self);
            } else {
                for (var i = 0, len = handler.length; i < len; ++i) {
                    handler[i].call(self);
                }
            }
        }
        function emitOne(handler, isFn, self, arg1) {
            if (isFn) {
                handler.call(self, arg1);
            } else {
                for (var i = 0, len = handler.length; i < len; ++i) {
                    handler[i].call(self, arg1);
                }
            }
        }
        function emitTwo(handler, isFn, self, arg1, arg2) {
            if (isFn) {
                handler.call(self, arg1, arg2);
            } else {
                for (var i = 0, len = handler.length; i < len; ++i) {
                    handler[i].call(self, arg1, arg2);
                }
            }
        }
        function emitThree(handler, isFn, self, arg1, arg2, arg3) {
            if (isFn) {
                handler.call(self, arg1, arg2, arg3);
            } else {
                for (var i = 0, len = handler.length; i < len; ++i) {
                    handler[i].call(self, arg1, arg2, arg3);
                }
            }
        }
        function emitMany(handler, isFn, self, args) {
            if (isFn) {
                handler.apply(self, args);
            } else {
                for (var i = 0, len = handler.length; i < len; ++i) {
                    handler[i].apply(self, args);
                }
            }
        }
    }();

    //-----------------------------------------------------

    module.exports = SEE;

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    var packer = function () {
        var holyBuffer = typeof Buffer !== "undefined" ? Buffer : function () {
            var MAX_ARGUMENTS_LENGTH = 0x1000;
            var K_MAX_LENGTH = 0x7fffffff;

            var Buffer = function Buffer() {};

            //---------------------]>

            Buffer.alloc = alloc;
            Buffer.byteLength = byteLength;
            Buffer.from = function (data) {
                if (typeof data === "string") {
                    return utf8ToBytes(data);
                } else {
                    return {
                        toString: function toString() {
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

                var length = string.length;

                var codePoint = void 0;
                var leadSurrogate = null;
                var bytes = new Array();

                for (var i = 0; i < length; ++i) {
                    codePoint = string.charCodeAt(i);

                    // is surrogate component
                    if (codePoint > 0xD7FF && codePoint < 0xE000) {
                        // last char was a lead
                        if (!leadSurrogate) {
                            // no lead yet
                            if (codePoint > 0xDBFF) {
                                // unexpected trail
                                if ((units -= 3) > -1) {
                                    bytes.push(0xEF, 0xBF, 0xBD);
                                }

                                continue;
                            } else if (i + 1 === length) {
                                // unpaired lead
                                if ((units -= 3) > -1) {
                                    bytes.push(0xEF, 0xBF, 0xBD);
                                }

                                continue;
                            }

                            // valid lead
                            leadSurrogate = codePoint;

                            continue;
                        }

                        // 2 leads in a row
                        if (codePoint < 0xDC00) {
                            if ((units -= 3) > -1) {
                                bytes.push(0xEF, 0xBF, 0xBD);
                            }

                            leadSurrogate = codePoint;

                            continue;
                        }

                        // valid surrogate pair
                        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
                    } else if (leadSurrogate) {
                        // valid bmp char, but last char was a lead
                        if ((units -= 3) > -1) {
                            bytes.push(0xEF, 0xBF, 0xBD);
                        }
                    }

                    leadSurrogate = null;

                    // encode utf8
                    if (codePoint < 0x80) {
                        if ((units -= 1) < 0) {
                            break;
                        }

                        bytes.push(codePoint);
                    } else if (codePoint < 0x800) {
                        if ((units -= 2) < 0) {
                            break;
                        }

                        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
                    } else if (codePoint < 0x10000) {
                        if ((units -= 3) < 0) {
                            break;
                        }

                        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
                    } else if (codePoint < 0x110000) {
                        if ((units -= 4) < 0) {
                            break;
                        }

                        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
                    } else {
                        throw new Error("Invalid code point");
                    }
                }

                return bytes;
            }

            function utf8Slice(buf, start, end) {
                end = Math.min(buf.length, end);

                var res = new Array();
                var i = start;

                while (i < end) {
                    var firstByte = buf[i];
                    var codePoint = null;
                    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

                    if (i + bytesPerSequence <= end) {
                        var secondByte = void 0,
                            thirdByte = void 0,
                            fourthByte = void 0,
                            tempCodePoint = void 0;

                        switch (bytesPerSequence) {
                            case 1:
                                if (firstByte < 0x80) {
                                    codePoint = firstByte;
                                }

                                break;

                            case 2:
                                secondByte = buf[i + 1];

                                if ((secondByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

                                    if (tempCodePoint > 0x7F) {
                                        codePoint = tempCodePoint;
                                    }
                                }

                                break;

                            case 3:
                                secondByte = buf[i + 1];
                                thirdByte = buf[i + 2];

                                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

                                    if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                        codePoint = tempCodePoint;
                                    }
                                }

                                break;

                            case 4:
                                secondByte = buf[i + 1];
                                thirdByte = buf[i + 2];
                                fourthByte = buf[i + 3];

                                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

                                    if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                        codePoint = tempCodePoint;
                                    }
                                }
                        }
                    }

                    if (codePoint === null) {
                        // we did not generate a valid codePoint so insert a
                        // replacement char (U+FFFD) and advance only 1 byte
                        codePoint = 0xFFFD;
                        bytesPerSequence = 1;
                    } else if (codePoint > 0xFFFF) {
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
                if (length > K_MAX_LENGTH) {
                    throw new RangeError("Invalid typed array length");
                }

                var buf = new Uint8Array(length);
                // buf.__proto__ = Buffer.prototype;

                return buf;
            }

            function byteLength(string) {
                return utf8ToBytes(string).length;
            }

            //--------)>

            function alloc(size) {
                var buf = createBuffer(size);
                buf.write = write;

                return buf;
            }

            //--------)>

            function write(string, offset, length) {
                offset = offset || 0;

                var remaining = this.length - offset;

                if (!length || length > remaining) {
                    length = remaining;
                }

                return blitBuffer(utf8ToBytes(string, this.length - offset), this, offset, length);
            }

            //--------)>

            function blitBuffer(src, dst, offset, length) {
                var i = void 0;

                for (i = 0; i < length; ++i) {
                    if (i + offset >= dst.length || i >= src.length) {
                        break;
                    }

                    dst[i + offset] = src[i];
                }

                return i;
            }

            function swap(b, n, m) {
                var i = b[n];
                b[n] = b[m];
                b[m] = i;
            }

            function decodeCodePointsArray(codePoints) {
                var len = codePoints.length;

                if (len <= MAX_ARGUMENTS_LENGTH) {
                    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
                }

                // Decode in chunks to avoid "call stack size exceeded".
                var res = "";
                var i = 0;

                while (i < len) {
                    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
                }

                return res;
            }
        }();

        //---------)>

        if (!Uint8Array.prototype.slice) {
            Object.defineProperty(Uint8Array.prototype, "slice", {
                "value": Array.prototype.slice
            });
        }

        //-------------------------]>

        var isBigEndian = function () {
            var a = new Uint32Array([0x12345678]);
            var b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);

            return b[0] === 0x12;
        }();

        var sysOffset = 1;

        //-------------------------]>

        return { isBigEndian: isBigEndian, createPacket: createPacket, getId: getId };

        //-------------------------]>

        function createPacket(schema) {
            if (!Array.isArray(schema)) {
                schema = new Array();
            }

            //-----------------]>

            var schLen = schema.length;

            var fields = new Array(schLen);
            var buffers = new Array(schLen);

            var pktDataHolder = Object.create(null),
                pktMinSize = 0,
                pktHasStr = false,
                pktBufStrict = null,
                pktBufPack = null;

            //-----------------]>

            var TYPE_STR = 1;
            var TYPE_INT = 2;
            var TYPE_UINT = 4;
            var TYPE_FLOAT = 8;

            //-----------------]>

            for (var e, i = 0; i < schLen; ++i) {
                e = schema[i].split(":");

                //---------]>

                var name = e.shift();
                var subType = e.shift();

                var type = getTypeId(subType.replace(/[\d\[\]]/g, ""));
                var size = parseInt(subType.replace(/\D/g, ""), 10) || 0;

                var _buildTypedBuf = buildTypedBuf(type, size),
                    _buildTypedBuf2 = _slicedToArray(_buildTypedBuf, 3),
                    bytes = _buildTypedBuf2[0],
                    bufType = _buildTypedBuf2[1],
                    bufAType = _buildTypedBuf2[2];

                var bufBytes = TYPE_STR & type ? null : new Uint8Array(bufType.buffer);
                var bufABytes = bufAType ? new Uint8Array(bufAType.buffer) : null;

                //---------]>

                fields[i] = [name, type, bytes, bufType, bufBytes, bufAType, bufABytes];

                pktMinSize += bytes;

                if (!pktHasStr && TYPE_STR & type) {
                    pktHasStr = true;
                }
            }

            pktMinSize += sysOffset;

            if (!pktHasStr) {
                pktBufStrict = new Uint8Array(pktMinSize);
            }

            //-----------------]>

            return { pack: pack, unpack: unpack };

            //-----------------]>

            function pack(id, data) {
                var isArray = Array.isArray(data);

                var tIdx = void 0,
                    fieldIdx = schLen,
                    pktSize = sysOffset;

                //--------]>

                while (fieldIdx--) {
                    var field = fields[fieldIdx];

                    var _field = _slicedToArray(field, 7),
                        _name = _field[0],
                        _type = _field[1],
                        bytes = _field[2],
                        bufType = _field[3],
                        _bufBytes = _field[4],
                        bufAType = _field[5],
                        _bufABytes = _field[6];

                    var input = data[isArray ? fieldIdx : _name];

                    //------]>

                    switch (_type) {
                        case TYPE_STR:
                            {
                                var offset = bufAType.byteLength;
                                var byteLen = input ? bufType.write(input, offset) : 0;

                                //-----]>

                                bufAType[0] = byteLen;

                                if (isBigEndian) {
                                    bufType[0] = _bufABytes[1];
                                    bufType[1] = _bufABytes[0];
                                } else {
                                    bufType[0] = _bufABytes[0];
                                    bufType[1] = _bufABytes[1];
                                }

                                byteLen += offset;

                                //-----]>

                                if (!_bufBytes || _bufBytes.length !== byteLen) {
                                    _bufBytes = field[4] = new Uint8Array(byteLen);
                                }

                                while (byteLen--) {
                                    _bufBytes[byteLen] = bufType[byteLen];
                                }

                                break;
                            }

                        default:
                            {
                                bufType[0] = input;

                                if (isBigEndian && bufType.byteLength > 1) {
                                    _bufBytes.reverse();
                                }
                            }
                    }

                    //------]>

                    var bts = _bufBytes.length;

                    //------]>

                    if (pktBufStrict) {
                        tIdx = 0;

                        while (bts--) {
                            pktBufStrict[pktSize++] = _bufBytes[tIdx++];
                        }
                    } else {
                        buffers[fieldIdx] = _bufBytes;
                        pktSize += bts;
                    }
                }

                //--------]>

                var result = pktBufStrict;

                //--------]>

                if (!result) {
                    result = pktBufPack && pktBufPack.length === pktSize ? pktBufPack : pktBufPack = new Uint8Array(pktSize);

                    fieldIdx = schLen;
                    tIdx = sysOffset;

                    //--------]>

                    while (fieldIdx--) {
                        for (var b = buffers[fieldIdx], _i = 0, l = b.length; _i < l; ++_i) {
                            result[tIdx++] = b[_i];
                        }
                    }
                }

                //--------]>

                result[0] = id;

                //--------]>

                return result;
            }

            function unpack(bin, offset, length, cbEndInfo, target) {
                target = target || pktDataHolder;

                //--------]>

                if (!bin || (typeof bin === "undefined" ? "undefined" : _typeof(bin)) !== "object" || !pktHasStr && bin.byteLength !== pktMinSize || bin.byteLength < pktMinSize) {
                    return null;
                }

                if (!schLen) {
                    if (cbEndInfo) {
                        cbEndInfo(sysOffset);
                    }

                    return target;
                }

                //--------]>

                var field = void 0,
                    fieldIdx = schLen,
                    name = void 0,
                    type = void 0,
                    bytes = void 0,
                    bufType = void 0,
                    bufBytes = void 0,
                    bufAType = void 0,
                    bufABytes = void 0;

                var pktOffset = offset + sysOffset;

                var pktOffsetStart = pktOffset;

                //--------]>

                while (fieldIdx--) {
                    field = fields[fieldIdx];


                    //------]>

                    var _field2 = field;

                    var _field3 = _slicedToArray(_field2, 7);

                    name = _field3[0];
                    type = _field3[1];
                    bytes = _field3[2];
                    bufType = _field3[3];
                    bufBytes = _field3[4];
                    bufAType = _field3[5];
                    bufABytes = _field3[6];
                    for (var _i2 = 0; _i2 < bytes; ++_i2) {
                        if (pktOffset >= length) {
                            return null;
                        }

                        if (bufAType) {
                            bufABytes[_i2] = bin[pktOffset++];
                        } else {
                            bufBytes[_i2] = bin[pktOffset++];
                        }
                    }

                    //------]>

                    switch (type) {
                        case TYPE_STR:
                            {
                                if (isBigEndian) {
                                    bufABytes.reverse();
                                }

                                //--------]>

                                var byteLen = bufAType[0];

                                //--------]>

                                if (!byteLen || byteLen >= length) {
                                    target[name] = "";
                                } else {
                                    bufType = holyBuffer.from(bin.slice(pktOffset, pktOffset + byteLen));
                                    pktOffset += byteLen;

                                    target[name] = bufType.toString();
                                }

                                break;
                            }

                        default:
                            {
                                if (isBigEndian && bufType.byteLength > 1) {
                                    bufBytes.reverse();
                                }

                                target[name] = bufType[0];
                            }
                    }
                }

                if (cbEndInfo) {
                    cbEndInfo(sysOffset + pktOffset - pktOffsetStart);
                }

                //--------]>

                return target;
            }

            //-----------------]>

            function buildTypedBuf(type, size) {
                switch (type) {
                    case TYPE_STR:
                        return [Uint16Array.BYTES_PER_ELEMENT, holyBuffer.alloc(size || 256), new Uint16Array(1)];

                    case TYPE_INT:
                        switch (size) {
                            case 8:
                                return [Int8Array.BYTES_PER_ELEMENT, new Int8Array(1)];
                            case 16:
                                return [Int16Array.BYTES_PER_ELEMENT, new Int16Array(1)];
                            case 32:
                                return [Int32Array.BYTES_PER_ELEMENT, new Int32Array(1)];

                            default:
                                throw new Error("Unknown size: " + size);
                        }

                    case TYPE_UINT:
                        switch (size) {
                            case 8:
                                return [Uint8Array.BYTES_PER_ELEMENT, new Uint8Array(1)];
                            case 16:
                                return [Uint16Array.BYTES_PER_ELEMENT, new Uint16Array(1)];
                            case 32:
                                return [Uint32Array.BYTES_PER_ELEMENT, new Uint32Array(1)];

                            default:
                                throw new Error("Unknown size: " + size);
                        }

                    case TYPE_FLOAT:
                        switch (size) {
                            case 32:
                                return [Float32Array.BYTES_PER_ELEMENT, new Float32Array(1)];
                            case 64:
                                return [Float64Array.BYTES_PER_ELEMENT, new Float64Array(1)];

                            default:
                                throw new Error("Unknown size: " + size);
                        }

                    default:
                        throw new Error("Unknown type: " + type);
                }
            }

            function getTypeId(type) {
                switch (type) {
                    case "s":
                    case "str":
                        return TYPE_STR;

                    case "i":
                    case "int":
                        return TYPE_INT;

                    case "u":
                    case "uint":
                        return TYPE_UINT;

                    case "f":
                    case "float":
                        return TYPE_FLOAT;

                    default:
                        throw new Error("Unknown type: " + type);
                }
            }
        }

        //-----------)>

        function getId(data) {
            return data[0];
        }
    }();

    //-----------------------------------------------------

    module.exports = packer;

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    var toString = function () {
        return function (data) {
            if (data === null) {
                data = "";
            } else {
                switch (typeof data === "undefined" ? "undefined" : _typeof(data)) {
                    case "string":
                        break;

                    case "undefined":
                        data = "";break;
                    case "number":
                        data = isNaN(data) ? "" : data + "";break;
                    case "symbol":
                        data = data.toString();break;

                    default:
                        data = JSON.stringify(data);
                }
            }

            return data;
        };
    }();

    //-----------------------------------------------------

    module.exports = toString;

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    return function (url, options) {
        var Io = function (_SEE) {
            _inherits(Io, _SEE);

            function Io() {
                _classCallCheck(this, Io);

                var _this = _possibleConstructorReturn(this, (Io.__proto__ || Object.getPrototypeOf(Io)).call(this));

                if (url) {
                    _this.connect(url);
                }

                _this._packMapByName = new Map();
                _this._unpackMapById = new Array();

                _this.reconnecting = false;
                return _this;
            }

            _createClass(Io, [{
                key: "isSupported",
                value: function isSupported() {
                    return typeof WebSocket !== "undefined";
                }
            }, {
                key: "emit",
                value: function emit(name, data) {
                    data = this._pack(name, data);

                    if (data) {
                        this.send(data);
                    }

                    return !!data;
                }
            }, {
                key: "text",
                value: function text(data) {
                    this.send(toString(data));
                }
            }, {
                key: "send",
                value: function send(data) {
                    try {
                        this._ws.send(data);
                    } catch (e) {
                        this._emit("error", e);
                    }
                }
            }, {
                key: "connect",
                value: function connect(url) {
                    if (this._ws) {
                        this._ws.close();
                    }

                    //------------]>

                    var w = this._ws = new WebSocket(url);

                    //------------]>

                    this.url = url;

                    w.binaryType = "arraybuffer";

                    w.onmessage = wsOnMessage.bind(this, this);
                    w.onopen = wsOnOpen.bind(this, this);
                    w.onclose = wsOnClose.bind(this, this);
                    w.onerror = wsOnError.bind(this, this);
                }
            }, {
                key: "disconnect",
                value: function disconnect(code, reason) {
                    this._ws.close(code, reason);
                    this._ws = null;
                }
            }, {
                key: "packets",
                value: function packets(pack, unpack, shared) {
                    var _this2 = this;

                    forEach(unpack, function (name, srz) {
                        _this2._unpackMapById.push([name, srz]);
                    });

                    forEach(pack, function (name, srz) {
                        _this2._packMapByName.set(name, [_this2._packMapByName.size, srz]);
                    });

                    //----------]>

                    if (shared) {
                        return this.packets(shared, shared);
                    }

                    //----------]>

                    return this;

                    //----------]>

                    function forEach(data, callback) {
                        if (!data) {
                            return;
                        }

                        Object.keys(data).forEach(function (field) {
                            testName(field);
                            callback(field, packer.createPacket(data[field]));
                        });
                    }

                    function testName(n) {
                        var r = ["restoring", "restored", "open", "close", "disconnected", "terminated", "packet", "message", "arraybuffer", "error"];

                        if (r.some(function (e) {
                            return e === n;
                        })) {
                            throw new Error("Used a reserved name: " + n);
                        }
                    }
                }
            }, {
                key: "_reconnect",
                value: function _reconnect() {
                    return this.connect(this.url);
                }
            }, {
                key: "_pack",
                value: function _pack(name, data) {
                    var t = this._packMapByName.get(name);

                    //---------]>

                    if (!t) {
                        return null;
                    }

                    //---------]>

                    var _t = _slicedToArray(t, 2),
                        id = _t[0],
                        srz = _t[1];

                    //---------]>

                    return srz.pack(id, data);
                }
            }]);

            return Io;
        }(SEE);

        //---------------]>

        var app = new Io();

        //---------------]>

        return app;

        //---------------]>

        function wsOnMessage(socket, event) {
            var data = event.data;

            //-----------]>

            socket._emit("message", data, event);

            if (typeof data === "string") {
                socket._emit("text", data, event);
                return;
            } else if (socket._emit("arraybuffer", data, event)) {
                return;
            }

            //-----------]>

            data = new Uint8Array(data);

            //-----------]>

            var dataByteLength = data.byteLength;

            var offset = 0,
                pkt = data;

            //-----------]>

            while (offset < dataByteLength) {
                var pktSchema = app._unpackMapById[packer.getId(pkt)];

                //-----------]>

                if (!pktSchema) {
                    break;
                }

                //-----------]>

                var _pktSchema = _slicedToArray(pktSchema, 2),
                    name = _pktSchema[0],
                    srz = _pktSchema[1];

                var message = srz.unpack(pkt, offset, dataByteLength, moveOffset);

                //-----------]>

                if (!message) {
                    break;
                }

                if (dataByteLength > offset) {
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
            if (app.reconnecting) {
                app.reconnecting = false;
                app._emit("restored");
            }

            app._emit("open");
        }

        function wsOnClose(socket, event) {
            var code = event.code,
                reason = event.reason;


            app._emit("close", code, reason, event);

            if (event.wasClean) {
                app._emit("disconnected", code, reason, event);
            } else {
                app._emit("terminated", code, event);

                setTimeout(function () {
                    app.reconnecting = true;
                    app._reconnect();

                    app._emit("restoring");
                }, 1000 * 2);
            }
        }

        function wsOnError(socket, error) {
            app._emit("error", error);
        }
    };
}({});
//# sourceMappingURL=sockizy.js.map
