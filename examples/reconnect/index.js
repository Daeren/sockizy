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
        "call": null,
        "terminate": null
    }
);

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    socket.id = Date.now().toString(32);
    socket.count = socket.count || 0;


    console.log("event: connection |", socket.id, socket.count);


    socket.on("call", function(data) {
        console.log("event: call |", socket.id, ++socket.count);
    });

    socket.on("terminate", function(data) {
        console.log("event: terminate |", socket.id, socket.count);
        socket.terminate();
    });
});


io.on("restored", function(socket, request) {
    console.log("event: restored |", socket.id, socket.count);
});

io.on("unrestored", function(socket, timeout) {
    console.log("event: unrestored |", socket.id, socket.count, timeout);
});


io.on("close", function(socket, code, reason, wasClean) {
    console.log("event: close |", socket.id, socket.count, code, reason, wasClean);
});

io.on("packet", function(name, data, socket, accept) {
    console.log(`io.packet: ${name} |---v`);

    accept();
});
