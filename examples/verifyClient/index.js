//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
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
}).listen();

//-----------------------------------------------------

// Async

io.verifyClient(function(info, callback) {
    setTimeout(callback, 1000 * 2, false, 400, "Client verification failed");
});

// Sync

// io.verifyClient(function(info) {
//     return true;
// });
