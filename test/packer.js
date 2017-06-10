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

let gSrzDataWithStrings;
let gSrzDataWithoutStrings;

let gPackDataWithStrings;
let gPackDataWithoutStrings;

let gUnpackDataWithStrings;
let gUnpackDataWithoutStrings;

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
        gSrzDataWithStrings = rPacker.createPacket(gSchemaWithStrings);
        gSrzDataWithoutStrings = rPacker.createPacket(gSchemaWithoutStrings);
    });


    it("Common: pack", function() {
        gPackDataWithStrings = gSrzDataWithStrings.pack(gMid, gDataWithStrings);
        gPackDataWithoutStrings = gSrzDataWithoutStrings.pack(gMid, gDataWithoutStrings);
    });

    it("Common: unpack", function() {
        gUnpackDataWithStrings = gSrzDataWithStrings.unpack(gPackDataWithStrings, 0, gPackDataWithStrings.length);
        gUnpackDataWithoutStrings = gSrzDataWithoutStrings.unpack(gPackDataWithoutStrings, 0, gPackDataWithoutStrings.length);

        testUnpackData(gUnpackDataWithStrings, gExpDataWithStrings);
        testUnpackData(gUnpackDataWithoutStrings, gExpDataWithoutStrings);
    });


    it("Common: getId | WithStrings", function() {
        expect(rPacker.getId(gPackDataWithStrings)).to.be.a("number").and.equal(gMid);
    });

    it("Common: getId | WithoutStrings", function() {
        expect(rPacker.getId(gPackDataWithoutStrings)).to.be.a("number").and.equal(gMid);
    });

});
