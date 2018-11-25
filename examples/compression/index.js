//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const sockizy  = require("./../../index.js");
const pako  = require("pako");

//-----------------------------------------------------

const schema = [
    "id:uint32",

    "expBase:uint32",
    "expJob:uint32",

    "name:str24",

    "hp:uint32",
    "mp:uint32",

    "str:uint32",
    "agi:uint32",
    "vit:uint32",
    "int:uint32",
    "dex:uint32",
    "luk:uint32",

    "eqHead:uint16",
    "eqBody:uint16",
    "weaponLH:uint16",
    "weaponRH:uint16",

    "x:int32",
    "y:int32"
];

const data = {
    id: 10,
    name: "1337Potato",

    expBase: 13243,
    expJob: 23424,

    hp: 500,
    mp: 100,

    str: 12,
    agi: 23,
    vit: 34,
    int: 46,
    dex: 58,
    luk: 69,

    eqHead: 1,
    eqBody: 1,
    weaponLH: 1,
    weaponRH: 2,

    x: 5,
    y: 8
};

const deflateParams = {
    "strategy": pako.Z_DEFAULT_STRATEGY,
    "level": 9,
    "memLevel": 9,
    "windowBits": 15
};

//-----------------------------------------------------

const io = sockizy({
    "packets": [
        null, // srv.on
        null, // srv.emit
        {     // srv.on + srv.emit
            "game.hero": schema,
            "game.hero.deflate": schema
        }
    ]
}).listen();

//-----------------------------------------------------

io.sendPacketTransform(function(type, data) {
    console.log("sendPacketTransform | ", type);

    return type === "game.hero.deflate" ? pako.deflate(data, deflateParams) : data;
});

io.recvPacketTransform(function(data) {
    console.log("recvPacketTransform");

    try {
        return pako.inflate(data);
    }
    catch(e) {
        //console.log(e); // game.hero
    }

    return Buffer.from(data);
});

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    socket.on("game.hero", function(data) {
        const bytes = this.emit("game.hero", data);
        console.log("Number of bytes sent:", bytes);
    });

    socket.on("game.hero.deflate", function(data) {
        const bytes = this.emit("game.hero.deflate", data);
        console.log("Number of bytes sent (deflate):", bytes);
    });
});

io.on("packet", function(name, data, socket, accept) {
    console.log(`io.packet: ${name} |---v`);
    console.log(JSON.stringify(data, null, "  "));

    accept();
});
