"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var io = function (module) {
    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    var EE = function () {
        var EventEmitter = function () {
            function EventEmitter() {
                _classCallCheck(this, EventEmitter);

                this._events = Object.create(null);
            }

            _createClass(EventEmitter, [{
                key: "on",
                value: function on(type, listener) {
                    var ev = this._events[type];

                    if (typeof ev === "function") {
                        this._events[type] = [ev, listener];
                    } else {
                        this._events[type] = ev ? this._arrayCloneWith(ev, ev.length, listener) : listener;
                    }

                    return this;
                }
            }, {
                key: "once",
                value: function once(type, listener) {
                    return this.on(type, function ls() {
                        if (!ls.fired) {
                            this.off(type, ls);
                            ls.fired = true;

                            listener.apply(this, arguments);
                        }
                    });
                }
            }, {
                key: "off",
                value: function off(type, listener) {
                    var argsLen = arguments.length;

                    if (!argsLen) {
                        this._events = Object.create(null);
                        return this;
                    }

                    //--------------]>

                    var ev = this._events[type];

                    if (argsLen === 1) {
                        delete this._events[type];
                        return this;
                    }

                    if (typeof ev === "function") {
                        if (ev === listener) {
                            delete this._events[type];
                        }

                        return this;
                    }

                    //--------------]>

                    var evLen = ev && ev.length;

                    if (!evLen) {
                        return this;
                    }

                    //--------------]>

                    if (evLen === 1) {
                        if (ev[0] === listener) {
                            delete this._events[type];
                        }
                    } else if (evLen === 2) {
                        if (ev[0] === listener) {
                            this._events[type] = ev[1];
                        } else if (ev[1] === listener) {
                            this._events[type] = ev[0];
                        }
                    } else if (ev.indexOf(listener) >= 0) {
                        this._events[type] = this._arrayCloneWithout(ev, evLen, listener);
                    }

                    //--------------]>

                    return this;
                }
            }, {
                key: "emit",
                value: function emit(type) {
                    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                        args[_key - 1] = arguments[_key];
                    }

                    var events = this._events[type];

                    //--------------]>

                    if (!events) {
                        if (type === "error") {
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

                    if (typeof events === "function") {
                        events.apply(this, args);
                    } else {
                        for (var i = 0, len = events.length; i < len; ++i) {
                            events[i].apply(this, args);
                        }
                    }

                    //--------------]>

                    return true;
                }
            }, {
                key: "listenerCount",
                value: function listenerCount(type) {
                    var events = this._events;

                    if (events) {
                        var ev = events[type];

                        if (typeof ev === "function") {
                            return 1;
                        } else if (ev) {
                            return ev.length;
                        }
                    }

                    return 0;
                }
            }, {
                key: "_arrayCloneWithout",
                value: function _arrayCloneWithout(arr, n, listener) {
                    var copy = new Array(n - 1);

                    var t = void 0,
                        i = 0,
                        r = false;

                    while (n--) {
                        t = arr[n];

                        if (!r && listener === t) {
                            r = true;
                        } else {
                            copy[i] = t;
                            ++i;
                        }
                    }

                    return copy;
                }
            }, {
                key: "_arrayCloneWith",
                value: function _arrayCloneWith(arr, n, listener) {
                    var copy = new Array(n + 1);

                    copy[n] = listener;

                    while (n--) {
                        copy[n] = arr[n];
                    }

                    return copy;
                }
            }]);

            return EventEmitter;
        }();

        //-----------------------]>

        return EventEmitter;
    }();

    //-----------------------------------------------------

    module.exports = EE;

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    if (!Uint8Array.prototype.slice) {
        Object.defineProperty(Uint8Array.prototype, "slice", {
            value: function value(begin, end) {
                //If 'begin' is unspecified, Chrome assumes 0, so we do the same
                if (begin === void 0) {
                    begin = 0;
                }

                //If 'end' is unspecified, the new ArrayBuffer contains all
                //bytes from 'begin' to the end of this ArrayBuffer.
                if (end === void 0) {
                    end = this.byteLength;
                }

                //Chrome converts the values to integers via flooring
                begin = Math.floor(begin);
                end = Math.floor(end);

                //If either 'begin' or 'end' is negative, it refers to an
                //index from the end of the array, as opposed to from the beginning.
                if (begin < 0) {
                    begin += this.byteLength;
                }

                if (end < 0) {
                    end += this.byteLength;
                }

                //The range specified by the 'begin' and 'end' values is clamped to the
                //valid index range for the current array.
                begin = Math.min(Math.max(0, begin), this.byteLength);
                end = Math.min(Math.max(0, end), this.byteLength);

                //If the computed length of the new ArrayBuffer would be negative, it
                //is clamped to zero.
                if (end - begin <= 0) {
                    return new ArrayBuffer(0);
                }

                var len = end - begin;

                var result = new ArrayBuffer(len);
                var resultBytes = new Uint8Array(result);
                var sourceBytes = new Uint8Array(this, begin, len);

                while (len--) {
                    resultBytes[len] = sourceBytes[len];
                }

                // some problems with IE11
                //resultBytes.set(sourceBytes);

                return resultBytes;
            }
        });
    }

    //-----------------------------------------------------

    var bPack = function () {
        var XBuffer = typeof Buffer !== "undefined" ? Buffer : function () {
            var MAX_ARGUMENTS_LENGTH = 0x1000;
            var K_MAX_LENGTH = 0x7fffffff;

            //---------------------]>

            return function () {
                var Buffer = function Buffer() {};

                //--------]>

                Buffer.allocUnsafe = allocUnsafe;
                Buffer.allocUnsafeSlow = allocUnsafe;

                //--------]>

                return Buffer;

                //--------]>

                function allocUnsafe(length) {
                    if (length > K_MAX_LENGTH) {
                        throw new RangeError("Invalid typed array length");
                    }

                    var buf = new Uint8Array(length);

                    buf.write = write;
                    buf.toString = toString;

                    return buf;
                }

                //----)>

                function write(string, offset, length) {
                    offset = offset || 0;
                    length = length || this.length;

                    var remaining = this.length - offset;

                    if (!length || length > remaining) {
                        length = remaining;
                    }

                    return blitBuffer(utf8ToBytes(string, this.length - offset), this, offset, length);
                }

                function toString(encoding, start, end) {
                    start = start || 0;
                    end = end || this.length;

                    return end === 0 ? "" : utf8Slice(this, start, end);
                }
            }();

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

            //--------)>

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

        var isBigEndian = function () {
            var a = new Uint32Array([0x12345678]);
            var b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);

            return b[0] === 0x12;
        }();

        //-------------------------]>

        create.isBE = isBigEndian;
        create.isLE = !isBigEndian;

        //-------------------------]>

        return create;

        //-------------------------]>

        function create(schema) {
            var holderRecreated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var dataHolderAsArray = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var TYPE_BIN = 1;
            var TYPE_STR = 2;
            var TYPE_INT = 4;
            var TYPE_UINT = 8;
            var TYPE_FLOAT = 16;
            var TYPE_JSON = 32;

            //-----------------]>

            if (schema === null) {
                schema = [];
            }

            if (!schema || !Array.isArray(schema) && typeof schema !== "string") {
                throw new Error("Invalid schema");
            }

            //-----------------]>

            var schemaContNames = Array.isArray(schema) ? schema.some(function (e) {
                return e.split(":").length >= 2;
            }) : false;
            var schemaDontContNames = Array.isArray(schema) ? schema.some(function (e) {
                return e.split(":").length < 2;
            }) : true;

            //-----------------]>

            if (schemaContNames && schemaDontContNames) {
                throw new Error("A schema has mixed names/types");
            }

            if (schemaDontContNames) {
                dataHolderAsArray = true;
            }

            //-----------------]>

            var int64size = typeof BigInt64Array !== "undefined" ? BigInt64Array.BYTES_PER_ELEMENT : 0;

            var isPrimitive = typeof schema === "string";
            var schLen = isPrimitive ? 1 : schema.length;

            var fields = new Array(schLen);
            var zeroUI16 = new Uint8Array(2);

            //---------)>

            var pktDataBuf = null;
            var pktOffset = 0;
            var pktMinSize = 0;
            var pktMaxSize = 0;

            var pktDataHolderArr = new Array();
            var pktDataHolderObj = Object.create(null);

            //-----------------]>

            for (var i = 0; i < schLen; ++i) {
                var _ref = isPrimitive ? [schema, ""] : schema[i].split(":").reverse(),
                    _ref2 = _slicedToArray(_ref, 2),
                    subType = _ref2[0],
                    name = _ref2[1];

                var type = getTypeId(subType.replace(/[\d\[\]]/g, ""));
                var size = parseInt(subType.replace(/\D/g, ""), 10) || 0;

                var _buildTypedBuf = buildTypedBuf(type, size),
                    _buildTypedBuf2 = _slicedToArray(_buildTypedBuf, 3),
                    bytes = _buildTypedBuf2[0],
                    // BYTES_PER_ELEMENT
                bufType = _buildTypedBuf2[1],
                    // dataView
                bufAType // dataSizeView
                = _buildTypedBuf2[2];

                var bufBytes = type & TYPE_STR || type & TYPE_BIN ? null : new Uint8Array(bufType.buffer);
                var bufABytes = bufAType ? new Uint8Array(bufAType.buffer) : null;

                //---------]>

                fields[i] = [name, type, bytes, bufType, bufBytes, bufAType, bufABytes];

                pktMinSize += bytes;
                pktMaxSize += bufType.byteLength;
            }

            offset(0);

            //-----------------]>

            return {
                get minSize() {
                    return pktMinSize;
                },
                get maxSize() {
                    return pktMaxSize;
                },

                get offset() {
                    return pktOffset;
                },
                set offset(value) {
                    offset(value);
                },

                pack: pack,
                unpack: unpack
            };

            //-----------------]>

            function offset(value) {
                value = parseInt(value, 10) || 0;

                pktMinSize = pktMinSize - pktOffset + value;
                pktMaxSize = pktMaxSize - pktOffset + value;
                pktOffset = value;

                pktDataBuf = XBuffer.allocUnsafeSlow(pktMaxSize);
            }

            //------)>

            function pack(data, target) {
                var isArray = Array.isArray(data);
                var outTg = !!target;

                var fieldIdx = schLen;
                var pktSize = pktOffset;

                var input = data;

                var field = void 0;
                var name = void 0,
                    type = void 0,
                    bytes = void 0,
                    bufType = void 0,
                    bufBytes = void 0,
                    bufAType = void 0,
                    bufABytes = void 0;

                //--------]>

                target = target || pktDataBuf;

                //--------]>

                while (fieldIdx--) {
                    field = fields[fieldIdx];


                    //------]>

                    var _field = field;

                    var _field2 = _slicedToArray(_field, 7);

                    name = _field2[0];
                    type = _field2[1];
                    bytes = _field2[2];
                    bufType = _field2[3];
                    bufBytes = _field2[4];
                    bufAType = _field2[5];
                    bufABytes = _field2[6];
                    if (!isPrimitive && data) {
                        input = data[isArray ? fieldIdx : name];
                    }

                    //------]>

                    if (type & TYPE_STR || type & TYPE_BIN) {
                        if (type & TYPE_JSON) {
                            input = JSON.stringify(input);
                        }

                        if (input) {
                            bytes += bufAType[0] = type & TYPE_BIN ? blitBuffer(input, target, pktSize + bytes, bufType.byteLength - bytes) : target.write(input, pktSize + bytes, bufType.byteLength - bytes);

                            if (isBigEndian) {
                                target[pktSize] = bufABytes[1];
                                target[pktSize + 1] = bufABytes[0];
                            } else {
                                target[pktSize] = bufABytes[0];
                                target[pktSize + 1] = bufABytes[1];
                            }

                            pktSize += bytes;
                        } else {
                            target[pktSize] = 0;
                            target[pktSize + 1] = 0;

                            pktSize += 2;
                        }
                    } else {
                        var zeroValue = 0;

                        if (bytes === int64size) {
                            zeroValue = BigInt("0");
                        }

                        if (input == null || typeof input !== "bigint" && (isNaN(input) || !isFinite(input))) {
                            bufType[0] = zeroValue;
                        } else {
                            bufType[0] = input;

                            if (isBigEndian && bufType.byteLength > 1) {
                                bufBytes.reverse();
                            }
                        }

                        var tIdx = 0;

                        while (tIdx < bytes) {
                            target[pktSize] = bufBytes[tIdx];

                            ++pktSize;
                            ++tIdx;
                        }
                    }
                }

                //--------]>

                return !outTg && pktSize < pktMaxSize ? target.slice(0, pktSize) : target;
            }

            function unpack(bin, offset, length, cbEndInfo, target) {
                var asCopy = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : !holderRecreated;
                var asArray = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : dataHolderAsArray;

                if (!schLen) {
                    if (cbEndInfo) {
                        cbEndInfo(pktOffset);
                    }

                    return null;
                }

                if (!bin || (typeof bin === "undefined" ? "undefined" : _typeof(bin)) !== "object" || bin.byteLength < pktMinSize) {
                    return void 0;
                }

                if (!isPrimitive) {
                    target = target || (asCopy ? asArray ? new Array() : Object.create(null) : asArray ? pktDataHolderArr : pktDataHolderObj);
                }

                //--------]>

                var fieldIdx = schLen;
                var curOffset = offset + pktOffset;

                var pktOffsetStart = curOffset;

                //--------]>

                while (fieldIdx--) {
                    var field = void 0;

                    var _fields$fieldIdx = _slicedToArray(fields[fieldIdx], 7),
                        name = _fields$fieldIdx[0],
                        _type = _fields$fieldIdx[1],
                        bytes = _fields$fieldIdx[2],
                        bufType = _fields$fieldIdx[3],
                        _bufBytes = _fields$fieldIdx[4],
                        bufAType = _fields$fieldIdx[5],
                        _bufABytes = _fields$fieldIdx[6];

                    //------]>

                    for (var _i = 0; _i < bytes; ++_i) {
                        if (curOffset >= length) {
                            return void 0;
                        }

                        if (bufAType) {
                            _bufABytes[_i] = bin[curOffset];
                        } else {
                            _bufBytes[_i] = bin[curOffset];
                        }

                        ++curOffset;
                    }

                    //------]>

                    if (_type & TYPE_STR || _type & TYPE_BIN) {
                        if (isBigEndian) {
                            _bufABytes.reverse();
                        }

                        //--------]>

                        var byteLen = bufAType[0];

                        //--------]>

                        if (!byteLen) {
                            field = _type & TYPE_BIN || _type & TYPE_JSON ? null : "";
                        } else if (byteLen >= length || byteLen > bufType.byteLength) {
                            return void 0;
                        } else {
                            if (_type & TYPE_BIN) {
                                var buf = XBuffer.allocUnsafeSlow(byteLen);

                                for (var _i2 = 0; _i2 < byteLen; ++_i2, ++curOffset) {
                                    buf[_i2] = bin[curOffset];
                                }

                                field = buf;
                            } else {
                                if (bin instanceof XBuffer) {
                                    field = bin.toString("utf8", curOffset, curOffset + byteLen);
                                } else if (XBuffer.from) {
                                    field = XBuffer.from(bin).toString("utf8", curOffset, curOffset + byteLen);
                                } else {
                                    field = bufType.toString.call(bin, "utf8", curOffset, curOffset + byteLen);
                                }

                                curOffset += byteLen;
                            }

                            if (_type & TYPE_JSON) {
                                try {
                                    field = JSON.parse(field);
                                } catch (e) {
                                    field = null;
                                }
                            }
                        }
                    } else {
                        if (isBigEndian && bufType.byteLength > 1) {
                            _bufBytes.reverse();
                        }

                        field = bufType[0];
                    }

                    //------]>

                    if (isPrimitive) {
                        target = field;
                    } else {
                        if (asArray) {
                            name = fieldIdx;
                        }

                        target[name] = field;
                    }
                }

                if (cbEndInfo) {
                    cbEndInfo(pktOffset + curOffset - pktOffsetStart);
                }

                //--------]>

                return target;
            }

            //-----------------]>

            function buildTypedBuf(type, size) {
                if (type & TYPE_BIN) {
                    return [Uint16Array.BYTES_PER_ELEMENT, XBuffer.allocUnsafeSlow((size || 1024) + Uint16Array.BYTES_PER_ELEMENT), new Uint16Array(1)];
                }

                if (type & TYPE_JSON) {
                    return [Uint16Array.BYTES_PER_ELEMENT, XBuffer.allocUnsafeSlow((size || 8192) + Uint16Array.BYTES_PER_ELEMENT), new Uint16Array(1)];
                }

                if (type & TYPE_STR) {
                    return [Uint16Array.BYTES_PER_ELEMENT, XBuffer.allocUnsafeSlow((size || 256) + Uint16Array.BYTES_PER_ELEMENT), new Uint16Array(1)];
                }

                switch (type) {
                    case TYPE_INT:
                        switch (size) {
                            case 8:
                                return [Int8Array.BYTES_PER_ELEMENT, new Int8Array(1)];
                            case 16:
                                return [Int16Array.BYTES_PER_ELEMENT, new Int16Array(1)];
                            case 32:
                                return [Int32Array.BYTES_PER_ELEMENT, new Int32Array(1)];
                            case 64:
                                return [BigInt64Array.BYTES_PER_ELEMENT, new BigInt64Array(1)];

                            default:
                                throw new Error("Unknown size: " + size + " | " + type);
                        }

                    case TYPE_UINT:
                        switch (size) {
                            case 8:
                                return [Uint8Array.BYTES_PER_ELEMENT, new Uint8Array(1)];
                            case 16:
                                return [Uint16Array.BYTES_PER_ELEMENT, new Uint16Array(1)];
                            case 32:
                                return [Uint32Array.BYTES_PER_ELEMENT, new Uint32Array(1)];
                            case 64:
                                return [BigUint64Array.BYTES_PER_ELEMENT, new BigUint64Array(1)];

                            default:
                                throw new Error("Unknown size: " + size + " | " + type);
                        }

                    case TYPE_FLOAT:
                        switch (size) {
                            case 32:
                                return [Float32Array.BYTES_PER_ELEMENT, new Float32Array(1)];
                            case 64:
                                return [Float64Array.BYTES_PER_ELEMENT, new Float64Array(1)];

                            default:
                                throw new Error("Unknown size: " + size + " | " + type);
                        }

                    default:
                        throw new Error("Unknown type: " + type + " | " + type);
                }
            }

            function getTypeId(type) {
                switch (type) {
                    case "b":
                    case "bin":
                        return TYPE_BIN;

                    case "j":
                    case "json":
                        return TYPE_STR | TYPE_JSON;

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

        function blitBuffer(src, dst, offset, length) {
            if (!length) {
                return 0;
            }

            //-------]>

            var dstLen = dst.length;
            var srcLen = src.length;

            var i = void 0,
                t = void 0;

            //-------]>

            for (i = 0; i < length; ++i) {
                t = i + offset;

                if (t >= dstLen || i >= srcLen) {
                    break;
                }

                dst[t] = src[i];
            }

            //-------]>

            return i;
        }
    }();

    //-----------------------------------------------------

    module.exports = bPack;

    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    module.exports = toString;

    //-----------------------------------------------------

    function toString(data) {
        if (data === null) {
            return "";
        }

        switch (typeof data === "undefined" ? "undefined" : _typeof(data)) {
            case "string":
                return data;

            case "undefined":
                return "";
            case "boolean":
                return data ? "true" : "false";
            case "number":
                return isNaN(data) ? "" : data.toString();
            case "bigint":
                return data.toString();
            case "symbol":
                return data.toString();

            default:
                return JSON.stringify(data);
        }
    }
    //-----------------------------------------------------
    //
    // Author: Daeren
    // Site: 666.io
    //
    //-----------------------------------------------------

    "use strict";

    //-----------------------------------------------------

    var ws = function ws(WSocket) {
        var toString = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : require("./../src/toString");
        var XEE = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : require("xee");
        var bPack = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : require("2pack");

        var sysInfoHeader = bPack("uint16");

        //---------------]>

        var Io = function (_XEE) {
            _inherits(Io, _XEE);

            function Io(url, options) {
                _classCallCheck(this, Io);

                //-------]>

                var _this = _possibleConstructorReturn(this, (Io.__proto__ || Object.getPrototypeOf(Io)).call(this));

                _this._emit = _get(Io.prototype.__proto__ || Object.getPrototypeOf(Io.prototype), "emit", _this);

                //-------]>

                _this._reconnectionDelay = 1000 * Math.max(1, options.reconnectionDelay || 0);
                _this._reconnectionAttempts = options.reconnectionAttempts || Infinity;
                _this._reconnectionAttemptsCount = 0;

                _this._packMapByName = new Map();
                _this._unpackMapById = new Array();

                //-------]>

                _this.reconnecting = false;

                //-------]>

                _this.CONNECTING = WSocket.CONNECTING;
                _this.OPEN = WSocket.OPEN;
                _this.CLOSING = WSocket.CLOSING;
                _this.CLOSED = WSocket.CLOSED;

                //-------]>

                if (url) {
                    var tWsUrlParse = url.trim().split(/(^wss?:\/\/)/i);

                    var wsUrl = tWsUrlParse.pop().replace(/^[:\/\/]*/, "");
                    var wsProtocol = (tWsUrlParse.pop() || "").trim();
                    var wsSecProtocol = !!(wsProtocol && wsProtocol.match(/^wss:\/\//i));

                    var secure = options.secure;

                    //------------]>

                    if (typeof secure === "undefined") {
                        secure = wsProtocol ? wsSecProtocol : !!document.location.protocol.match(/^https/i);
                    }

                    //------------]>

                    _this._connect((secure ? "wss" : "ws") + "://" + wsUrl);
                }
                return _this;
            }

            _createClass(Io, [{
                key: "emit",
                value: function emit(name, data) {
                    data = this._pack(name, data);

                    if (data) {
                        this.send(data);
                        return data.byteLength;
                    }

                    return 0;
                }
            }, {
                key: "text",
                value: function text(data) {
                    this.send(toString(data));
                }
            }, {
                key: "json",
                value: function json(data) {
                    this.send(JSON.stringify(data));
                }
            }, {
                key: "send",
                value: function send(data) {
                    var st = this.readyState;

                    //------------]>

                    try {
                        if (st !== this.CLOSING && st !== this.CLOSED) {
                            this._ws.send(data);
                        } else {
                            throw new Error("WebSocket is already in CLOSING or CLOSED state.");
                        }
                    } catch (e) {
                        this._emit("error", e);
                    }
                }
            }, {
                key: "disconnect",
                value: function disconnect() {
                    var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;
                    var reason = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

                    var st = this.readyState;

                    if (st !== this.CLOSING && st !== this.CLOSED) {
                        this._ws.close(code, reason);
                    }

                    //------------]>

                    return this;
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
                            var t = field.split(/\(([\[\{]?)(\@?)([\}\]]?)\)$/);

                            var name = t.shift().trim();
                            var useHolderArray = t.shift() === "[";
                            var holderNew = t.shift() === "@";

                            var schema = data[field];
                            var packet = bPack(schema, holderNew, useHolderArray);

                            //-------]>

                            packet.offset = sysInfoHeader.maxSize;

                            //-------]>

                            testName(name);
                            callback(name, packet);
                        });
                    }

                    function testName(n) {
                        var r = ["restoring", "restored", "open", "close", "disconnected", "terminated", "packet", "message", "arraybuffer", "error", "ping", "pong"];

                        if (r.some(function (e) {
                            return e === n;
                        })) {
                            throw new Error("Used a reserved name: " + n);
                        }
                    }
                }
            }, {
                key: "sendPacketTransform",
                value: function sendPacketTransform(callback) {
                    this._sendPacketTransform = callback;
                    return this;
                }
            }, {
                key: "recvPacketTransform",
                value: function recvPacketTransform(callback) {
                    this._recvPacketTransform = callback;
                    return this;
                }
            }, {
                key: "_connect",
                value: function _connect(url) {
                    try {
                        this._ws = new WSocket(url);
                    } catch (e) {
                        this._emit("error", e);
                        return;
                    }

                    //------------]>

                    var w = this._ws;

                    //------------]>

                    w.onmessage = wsOnMessage.bind(w, this);
                    w.onopen = wsOnOpen.bind(w, this);
                    w.onclose = wsOnClose.bind(w, this);
                    w.onerror = wsOnError.bind(w, this);

                    w.binaryType = "arraybuffer";
                }
            }, {
                key: "_reconnect",
                value: function _reconnect() {
                    this._connect(this.url);
                }
            }, {
                key: "_pack",
                value: function _pack(name, data) {
                    var pk = this._packMapByName.get(name);

                    if (pk) {
                        var _pk = _slicedToArray(pk, 2),
                            id = _pk[0],
                            srz = _pk[1];

                        var deflateCb = this._sendPacketTransform;

                        data = sysInfoHeader.pack(id, srz.pack(data));

                        return deflateCb ? deflateCb(name, data) : data;
                    }

                    return null;
                }
            }, {
                key: "bufferedAmount",
                get: function get() {
                    return this._ws && this._ws.bufferedAmount || 0;
                }
            }, {
                key: "readyState",
                get: function get() {
                    return this._ws ? this._ws.readyState : this.CLOSED;
                }
            }, {
                key: "url",
                get: function get() {
                    return this._ws && this._ws.url || "";
                }
            }]);

            return Io;
        }(XEE);

        //---------------]>

        return WSocket ? io : null;

        //---------------]>

        function io(url) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var app = new Io(url, options);

            if (Array.isArray(io.__staticPackets)) {
                app.packets.apply(app, _toConsumableArray(io.__staticPackets));
            }

            return app;
        }

        //--------)>

        function wsOnMessage(socket, event) {
            var data = event.data;

            //-----------]>

            socket._emit("message", data, event);

            if (typeof data === "string") {
                socket._emit("text", data, event);

                if (socket.listenerCount("json")) {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        data = void e;
                    }

                    if (typeof data !== "undefined") {
                        socket._emit("json", data, event);
                    }
                }

                return;
            } else if (socket._emit("arraybuffer", data, event)) {
                return;
            }

            //-----------]>

            data = new Uint8Array(data);

            //-----------]>

            var inflateCb = socket._recvPacketTransform;

            if (inflateCb) {
                data = inflateCb(data);

                if (!data) {
                    return;
                }
            }

            //-----------]>

            var dataByteLength = data.byteLength;

            var offset = 0;

            //-----------]>

            var _loop = function _loop() {
                var pktId = sysInfoHeader.unpack(data, offset, dataByteLength);
                var pktSchema = socket._unpackMapById[pktId];

                //-----------]>

                if (!pktSchema) {
                    return "break";
                }

                //-----------]>

                var _pktSchema = _slicedToArray(pktSchema, 2),
                    name = _pktSchema[0],
                    srz = _pktSchema[1];

                var message = srz.unpack(data, offset, dataByteLength, cbMoveOffset);

                //-----------]>

                if (typeof message === "undefined") {
                    return "break";
                }

                //-----------]>

                if (socket.listenerCount("packet")) {
                    socket._emit("packet", name, message, function () {
                        return socket._emit(name, message);
                    });
                } else {
                    socket._emit(name, message);
                }
            };

            while (offset < dataByteLength) {
                var _ret = _loop();

                if (_ret === "break") break;
            }

            //-----------]>

            function cbMoveOffset(size) {
                offset += size;
            }
        }

        function wsOnOpen(socket, event) {
            var rcAttemptsCount = socket._reconnectionAttemptsCount;

            //--------]>

            socket._reconnectionAttemptsCount = 0;

            if (socket.reconnecting) {
                socket.reconnecting = false;
                socket._emit("restored", rcAttemptsCount);
            }

            socket._emit("open");
        }

        function wsOnClose(socket, event) {
            var code = event.code,
                reason = event.reason;

            //--------]>

            socket._emit("close", code, reason, event);

            if (event.wasClean) {
                socket._emit("disconnected", code, reason, event);
            } else {
                var rcAttemptsCount = socket._reconnectionAttemptsCount;

                //--------]>

                socket._emit("terminated", code, event);

                //--------]>

                if (rcAttemptsCount < socket._reconnectionAttempts) {
                    socket._reconnectionAttemptsCount++;

                    setTimeout(function () {
                        socket.reconnecting = true;
                        socket._reconnect();

                        socket._emit("restoring", rcAttemptsCount);
                    }, socket._reconnectionDelay);
                } else {
                    socket.reconnecting = false;

                    socket._emit("unrestored", rcAttemptsCount);
                }
            }
        }

        function wsOnError(socket, event) {
            var error = new Error(event.message || event.data || "");
            error.event = event;

            socket._emit("error", error);
        }
    };

    //-----------------------------------------------------

    module.exports = ws;

    //# sourceMappingURL=sockizy.min.map
    return ws(window.WebSocket || window.MozWebSocket, toString, EE, bPack);
}({});
