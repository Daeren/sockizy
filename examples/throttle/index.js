//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const sockizy  = require("./../../index.js");

//-----------------------------------------------------

const io = sockizy().listen(); // default: localhost:1337

//-----------------------------------------------------

io.packets(
    null,
    null,
    {
        "ok": ["key:u8"],
        "bad": null
    }
);

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    console.log("event: connection");


    socket.on("ok", function(data) {
        console.log("event: ok |", data);
        console.log("Number of bytes sent:", socket.emit("ok"), "| Event: ok");
    });

    socket.on("bad", function(data) {
        console.log("event: bad |", data);
    });
});

io.on("packet", function(name, data, socket, accept) {
    console.log(`io.packet: ${name} |---v`);

    if(data && data.key === 13) {
        accept();
    }
});
