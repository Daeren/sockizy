//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/
/*global describe, it*/

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const expect    = rChai.expect;

const rPacker = require("./../src/packer");

//-----------------------------------------------------

const gDataWithStrings = {
    data:   JSON.stringify({x:1, b: "b".repeat(1)}),
    name:   "DT | (っ◕‿◕)っ ♥ | Привет",
    status: "X  | (っ◕‿◕)っ ♥  Да",
    e8:     "",
    e:      "",
    lvl:    -300.2,
    hp:     100.44,
    gm:     Infinity,
    x:      300.9,
    y:      -300.52
};

const gDataWithoutStrings = {
    lvl:    -300.2,
    hp:     100.44,
    gm:     Infinity,
    x:      300.9,
    y:      -300.52
};

//------)>

const gExpDataWithStrings = {
    data:   JSON.stringify({x:1, b: "b".repeat(1)}),
    name:   "DT | (っ◕‿◕)っ ♥ | Привет",
    status: "X  | (っ◕‿◕)っ ♥  Да",
    e8:     "",
    e3:     "",
    e2:     0,
    e1:     "",
    e:      "",
    lvl:    -44,
    hp:     100,
    gm:     0,
    x:      300.8999938964844,
    y:      -300.52
};

const gExpDataWithoutStrings = {
    lvl:    -44,
    hp:     100,
    gm:     0,
    x:      300.8999938964844,
    y:      -300.52
};

//------)>

const gSchemaWithStrings = [
    "data:str",
    "name:str",
    "status:str",
    "e8:str",
    "e:str",
    "e1:str",
    "e2:int8",
    "e3:str",
    "lvl:int8",
    "hp:uint16",
    "gm:uint8",
    "x:float32",
    "y:float64"
];

const gSchemaWithoutStrings = [
    "lvl:int8",
    "hp:uint16",
    "gm:uint8",
    "x:float32",
    "y:float64"
];

//------)>

const gJsonExpDataWithStrings = JSON.stringify(gExpDataWithStrings);
const gJsongExpDataWithoutStrings = JSON.stringify(gExpDataWithoutStrings);

const gMid = 136;

//------)>

let srzDataWithStrings;
let srzDataWithoutStrings;

let packDataWithStrings;
let packDataWithoutStrings;

let unpackDataWithStrings;
let unpackDataWithoutStrings;

//-----------------------------------------------------

function testUnpackData(d1, d2) {
    for(let k in d1) {
        let t1 = d2[k];
        let t2 = d1[k];

        if(typeof(t1) === "number") {
            expect(t2).to.be.closeTo(t1, 0.001);
        } else {
            expect(t2).to.equal(t1);
        }
    }
}

//-----------------------------------------------------

describe("Packer", function() {

    this.timeout(1000 * 10);

    //-----------------]>

    it("Base", function() {
        expect(rPacker.isBigEndian).to.be.a("boolean");
        expect(rPacker.createPacket).to.be.a("function");
        expect(rPacker.getId).to.be.a("function");
    });

    //-----------------]>

    it("Common: createPacket", function() {
        srzDataWithStrings = rPacker.createPacket(gSchemaWithStrings);
        srzDataWithoutStrings = rPacker.createPacket(gSchemaWithoutStrings);
    });


    it("Common: pack", function() {
        srzDataWithStrings = rPacker.createPacket(gSchemaWithStrings);
        srzDataWithoutStrings = rPacker.createPacket(gSchemaWithoutStrings);

        packDataWithStrings = srzDataWithStrings.pack(gMid, gDataWithStrings);
        packDataWithoutStrings = srzDataWithoutStrings.pack(gMid, gDataWithoutStrings);
    });

    it("Common: unpack", function() {
        srzDataWithStrings = rPacker.createPacket(gSchemaWithStrings);
        srzDataWithoutStrings = rPacker.createPacket(gSchemaWithoutStrings);

        packDataWithStrings = srzDataWithStrings.pack(gMid, gDataWithStrings);
        packDataWithoutStrings = srzDataWithoutStrings.pack(gMid, gDataWithoutStrings);

        unpackDataWithStrings = srzDataWithStrings.unpack(packDataWithStrings, 0, packDataWithStrings.length);
        unpackDataWithoutStrings = srzDataWithoutStrings.unpack(packDataWithoutStrings, 0, packDataWithoutStrings.length);

        testUnpackData(unpackDataWithStrings, gExpDataWithStrings);
        testUnpackData(unpackDataWithoutStrings, gExpDataWithoutStrings);
    });

    it("Common: unpack | StrCut & StrLen & SchOrder", function() {
        const schema = rPacker.createPacket([
            "msg:str4",
            "num:int8"
        ]);

        const schemaOverflow = rPacker.createPacket([
            "msg:str10",
            "num:int8"
        ]);

        const dataLong = {
            "msg": "1234567890",
            "num": 13
        };

        const dataShort = {
            "msg": "1234",
            "num": 13
        };

        const packet = schema.pack(0, dataLong);
        const packetOverflow = schemaOverflow.pack(0, dataLong);

        const data = schema.unpack(packet, 0, packet.length);
        const dataOverflow = schema.unpack(packetOverflow, 0, packetOverflow.length);

        testUnpackData(data, dataShort);
        testUnpackData(dataOverflow, dataShort);
    });


    it("Common: getId | WithStrings", function() {
        srzDataWithStrings = rPacker.createPacket(gSchemaWithStrings);
        packDataWithStrings = srzDataWithStrings.pack(gMid, gDataWithStrings);

        expect(rPacker.getId(packDataWithStrings)).to.be.a("number").and.equal(gMid);
    });

    it("Common: getId | WithoutStrings", function() {
        srzDataWithoutStrings = rPacker.createPacket(gSchemaWithoutStrings);
        packDataWithoutStrings = srzDataWithoutStrings.pack(gMid, gDataWithoutStrings);

        expect(rPacker.getId(packDataWithoutStrings)).to.be.a("number").and.equal(gMid);
    });

});
