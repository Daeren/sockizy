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

const io = sockizy({
    "packets": [
        null, // srv.on
        null, // srv.emit
        {     // srv.on + srv.emit
            "chat.message": [
                "uid:uint32",
                "text:str8"
            ]
        }
    ]
}).listen(); // default: localhost:1337

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    console.log("event: connection");

    socket.on("chat.message", function(data) {
        const exist = this.emit("chat.message", [13, "Hello"]);

        console.log("event: chat.message | ", !!exist);
    });
});

io.on("packet", function(name, data, socket, accept) {
    console.log(`io.packet: ${name} |---v`);
    console.log(JSON.stringify(data, null, "  "));

    accept();
});
