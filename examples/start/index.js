//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const rSockize  = require("./../../index.js");

//-----------------------------------------------------

const io = rSockize(); // Default: localhost:1337

//-----------------------------------------------------

io.packets(
    null,
    null,
    {
        "chat.message": [
            "uid:uint32",
            "text:str8"
        ]
    }
);

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    socket.on("chat.message", function(data) {
        console.log("event: chat.message");

        this.emit("chat.message", [13, "Hello"]);
    });
});

io.on("packet", function(name, data, socket) {
    console.log(`io.packet: ${name} |---v`);
    console.log(JSON.stringify(data, null, "  "));
});
