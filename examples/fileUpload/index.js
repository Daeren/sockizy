﻿//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const sockizy  = require("./../../index.js");

//-----------------------------------------------------

const io = sockizy().listen();

//-----------------------------------------------------

io.packets(
    null,
    null,
    {
        "upload.file.init": [
            "id:u8",
            "name:s256",
            "type:s128",
            "size:u32",
            "begin:u32"
        ],

        "upload.file.body": [
            "id:u8",
            "chunk:b16384"
        ],

        "upload.file.next": [
            "id:u8"
        ]
    }
);

//-----------------------------------------------------

const fs = require("fs");

function bindDownload(socket) {
    const upload = socket.upload = socket.upload || Object.create(null);

    //---------]>

    socket.on("upload.file.init", function(data) {
        const {id, size} = data;

        if(upload[id]) {
            return;
        }

        upload[id] = {
            "stream":   fs.createWriteStream("./store/" + (Date.now() + Math.random()).toString(32) + "test.jpg"),
            "size":     size,
            "bytes":    0
        };

        socket.emit("upload.file.next", [id]);
    });

    socket.on("upload.file.body", function(data) {
        console.log("upload.file.body", data && data.chunk);

        const {id, chunk} = data;
        const u = upload[id]

        if(!chunk || !u) {
            return;
        }

        u.stream.write(chunk);
        u.bytes += chunk.byteLength;

        console.log(u.bytes, u.size);

        if(u.bytes >= u.size) {
            u.stream.end();
            delete upload[id];
        }
        else {
            socket.emit("upload.file.next", [id]);
        }
    });
}

io.on("connection", function(socket, request) {
    bindDownload(socket, function(info, stream) {
    });
});

io.on("packet", function(name, data, socket) {
    console.log("socket.packet: " + name + " |---v");
});
