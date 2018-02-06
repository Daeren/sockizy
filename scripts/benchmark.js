//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const SEE = require("./../src/see");
const EE = require("events");

//-----------------------------------------------------

testEE(EE);
console.log("------------------");
testEE(SEE, true);
console.log("------------------");

//-----------------------------------------------------

function testEE(p, custom) {
    let l, t;

    class MyEmitter extends p {}

    const ee = new MyEmitter();

    //-----------------]>

    ee.on("data", function(data) {
        data + 1;
    });

    ee.on("data2", function(data) {
    });

    //-----------------]>

    l = 1000 * 1000 * 1;

    console.time("on() x 1");

    while(l--) {
        if(custom) {
            ee._emit("data");
        } else {
            ee.emit("data");
        }
    }

    console.timeEnd("on() x 1");

    //-----------------]>

    l = 1000 * 1000 * 1;

    console.time("on() x 1 + [data] x 1");

    while(l--) {
        if(custom) {
            ee._emit("data", 1);
        } else {
            ee.emit("data", 1);
        }
    }

    console.timeEnd("on() x 1 + [data] x 1");

    //-----------------]>

    ee.on("data", function(data) {
        data + 1;
    });

    ee.on("data2", function(data) {
    });

    //-----------------]>

    l = 1000 * 1000 * 1;

    console.time("on() x 2");

    while(l--) {
        if(custom) {
            ee._emit("data");
        } else {
            ee.emit("data");
        }
    }

    console.timeEnd("on() x 2");

    //-----------------]>

    l = 1000 * 1000 * 1;

    console.time("on() x 2 + [data] x 1");

    while(l--) {
        if(custom) {
            ee._emit("data", 1);
        } else {
            ee.emit("data", 1);
        }
    }

    console.timeEnd("on() x 2 + [data] x 1");
}
