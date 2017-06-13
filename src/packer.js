//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const packer = (function() {
    const holyBuffer = typeof(Buffer) !== "undefined" ? Buffer : (function() {
            const MAX_ARGUMENTS_LENGTH = 0x1000;
            const K_MAX_LENGTH = 0x7fffffff;

            const Buffer = function() {};

            //---------------------]>

            Buffer.alloc = alloc;
            Buffer.byteLength = byteLength;

            Buffer.prototype = Object.create(null);
            Buffer.prototype.write = write;
            Buffer.prototype.toString = function(encoding, start, end) {
                start = start || 0;
                end = end || this.length;

                if(end === 0) {
                    return "";
                }

                return utf8Slice(this, start, end);
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
                            }
                            else if(i + 1 === length) {
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
                    }
                    else if(leadSurrogate) {
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
                    }
                    else if(codePoint < 0x800) {
                        if((units -= 2) < 0) {
                            break;
                        }

                        bytes.push(
                            codePoint >> 0x6 | 0xC0,
                            codePoint & 0x3F | 0x80
                        );
                    }
                    else if(codePoint < 0x10000) {
                        if((units -= 3) < 0) {
                            break;
                        }

                        bytes.push(
                            codePoint >> 0xC | 0xE0,
                            codePoint >> 0x6 & 0x3F | 0x80,
                            codePoint & 0x3F | 0x80
                        );
                    }
                    else if(codePoint < 0x110000) {
                        if((units -= 4) < 0) {
                            break;
                        }

                        bytes.push(
                            codePoint >> 0x12 | 0xF0,
                            codePoint >> 0xC & 0x3F | 0x80,
                            codePoint >> 0x6 & 0x3F | 0x80,
                            codePoint & 0x3F | 0x80
                        );
                    }
                    else {
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
                    }
                    else if(codePoint > 0xFFFF) {
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
                buf.write = Buffer.prototype.write;
                buf.toString = Buffer.prototype.toString;

                return buf;
            }

            function byteLength(string) {
                return utf8ToBytes(string).length;
            }

            //--------)>

            function alloc(size) {
                return createBuffer(size);
            }

            //--------)>

            function write(string, offset, length) {
                offset = offset || 0;
                length = length || this.length;

                const remaining = this.length - offset;

                if(!length || length > remaining) {
                    length = remaining;
                }

                return blitBuffer(utf8ToBytes(string, this.length - offset), this, offset, length);
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

    const sysOffset = 1;

    //-------------------------]>

    return {isBigEndian, createPacket, getId};

    //-------------------------]>

    function createPacket(schema) {
        if(!Array.isArray(schema)) {
            schema = new Array();
        }

        //-----------------]>

        const schLen        = schema.length;

        const fields        = new Array(schLen);
        const buffers       = new Array(schLen);

        const zeroUI16      = new Uint8Array(2);

        let pktDataHolder   = Object.create(null),
            pktMinSize      = 0,
            pktHasStr       = false,

            pktBufStrict    = null,
            pktBufPack      = null;

        //-----------------]>

        const TYPE_STR      = 1;
        const TYPE_INT      = 2;
        const TYPE_UINT     = 4;
        const TYPE_FLOAT    = 8;

        //-----------------]>

        for(let e, i = 0; i < schLen; ++i) {
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

        pktMinSize += sysOffset;

        if(!pktHasStr) {
            pktBufStrict = new Uint8Array(pktMinSize);
        }

        //-----------------]>

        return {pack, unpack};

        //-----------------]>

        function pack(id, data) {
            const isArray   = Array.isArray(data);

            let tIdx,
                fieldIdx    = schLen,
                pktSize     = sysOffset;

            //--------]>

            while(fieldIdx--) {
                let field = fields[fieldIdx];
                let [name, type, bytes, bufType, bufBytes, bufAType, bufABytes] = field;

                let input = data[isArray ? fieldIdx : name];

                //------]>

                switch(type) {
                    case TYPE_STR: {
                        if(input) {
                            let offset = bufAType.byteLength;
                            let byteLen = input ? bufType.write(input, offset) : 0;

                            //-----]>

                            bufAType[0] = byteLen;

                            if(isBigEndian) {
                                bufType[0] = bufABytes[1];
                                bufType[1] = bufABytes[0];
                            }
                            else {
                                bufType[0] = bufABytes[0];
                                bufType[1] = bufABytes[1];
                            }

                            //-----]>

                            byteLen += offset;

                            bufBytes = bufType;
                            bufType._blen = byteLen;

                            bytes = byteLen;
                        }
                        else {
                            bufBytes = zeroUI16;
                        }

                        break;
                    }

                    default: {
                        bufType[0] = input;

                        if(isBigEndian && bufType.byteLength > 1) {
                            bufBytes.reverse();
                        }
                    }
                }

                //------]>

                if(pktBufStrict) {
                    tIdx = 0;

                    while(bytes--) {
                        pktBufStrict[pktSize++] = bufBytes[tIdx++];
                    }
                }
                else {
                    buffers[fieldIdx] = bufBytes;
                    pktSize += bytes;
                }
            }

            //--------]>

            let result = pktBufStrict;

            //--------]>

            if(!result) {
                result = pktBufPack && pktBufPack.length === pktSize ? pktBufPack : (pktBufPack = new Uint8Array(pktSize));

                fieldIdx = schLen;
                tIdx = sysOffset;

                //--------]>

                while(fieldIdx--) {
                    for(let b = buffers[fieldIdx], i = 0, l = (b._blen || b.length); i < l; ++i) {
                        result[tIdx++] = b[i];
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

            if(!bin || typeof(bin) !== "object" || !pktHasStr && bin.byteLength !== pktMinSize || bin.byteLength < pktMinSize) {
                return null;
            }

            if(!schLen) {
                if(cbEndInfo) {
                    cbEndInfo(sysOffset);
                }

                return target;
            }

            //--------]>

            let field,
                fieldIdx = schLen,

                name, type, bytes, bufType, bufBytes, bufAType, bufABytes;

            let pktOffset           = offset + sysOffset;

            const pktOffsetStart    = pktOffset;

            //--------]>

            while(fieldIdx--) {
                field = fields[fieldIdx];
                [name, type, bytes, bufType, bufBytes, bufAType, bufABytes] = field;

                //------]>

                for(let i = 0; i < bytes; ++i) {
                    if(pktOffset >= length) {
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
                    case TYPE_STR: {
                        if(isBigEndian) {
                            bufABytes.reverse();
                        }

                        //--------]>

                        const byteLen = bufAType[0];

                        //--------]>

                        if(!byteLen || byteLen >= length) {
                            target[name] = "";
                        }
                        else {
                            const needMem = Math.min(bufType.length, byteLen);

                            for(let i = 0; i < needMem; ++i) {
                                bufType[i] = bin[pktOffset++];
                            }

                            target[name] = bufType.toString("utf8", 0, needMem);
                        }

                        break;
                    }

                    default: {
                        if(isBigEndian && bufType.byteLength > 1) {
                            bufBytes.reverse();
                        }

                        target[name] = bufType[0];
                    }
                }
            }

            if(cbEndInfo) {
                cbEndInfo(sysOffset + pktOffset - pktOffsetStart);
            }

            //--------]>

            return target;
        }

        //-----------------]>

        function buildTypedBuf(type, size) {
            switch(type) {
                case TYPE_STR:
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
                    throw new Error(`Unknown type: ${type}`);
            }
        }
    }

    //-----------)>

    function getId(data) {
        return data[0];
    }
})();

//-----------------------------------------------------

module.exports = packer;
