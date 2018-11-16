[![Codacy][cod_b]][cod_l]

```
npm -g install sockizy
git clone https://github.com/Daeren/sockizy.git
```


* Binary (Little/Big - Endian)
* Relative and absolute zero-copy operations wherever possible
* [Throttle][4]
* [FileUpload][3]
* IE11


#### Goals:
1. Low memory usage;
2. Maximum performance;
3. Flexibility;
4. Games.


#### Index

* [SSL](#refSSL)
* [Verify](#refVerifyClient)
* [Packets](#refPackets)
* [Bundle](#refBundle)
* [Server API](#refAPIServer)
* [Client API](#refAPIClient)


Server:

```javascript
const sockizy = require("sockizy");

//-----------------------------------------------------

const io = sockizy(1337, {
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
});

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    socket.on("chat.message", function() {
        const bytes = this.emit("chat.message", {uid: 13, text: "Hello"});
        console.log("Number of bytes sent:", bytes);
    });
});
```

Client:

```javascript
<script src="//localhost:1337"></script>

<script>
    const socket = io("localhost:1337");
    socket.on("chat.message", console.log);
</script>
```



<a name="refSSL"></a>
#### SSL

```javascript
const ssl = {
    "dir":       "/www/site",

    "key":       "/3_site.xx.key",
    "cert":      "/2_site.xx.crt",
    "ca":       [
        "/AddTrustExternalCARoot.crt",
        "/COMODORSAAddTrustCA.crt",
        "/COMODORSADomainValidationSecureServerCA.crt"
    ]
};

//-----------------------------------------------------

const io = sockizy(1337, {ssl, "maxPayload": 1024});
```



<a name="refVerifyClient"></a>
#### Verify

```javascript
/*
    const info = {
        "origin": request.headers.origin,
        "secure": request.connection.authorized !== undefined || request.connection.encrypted !== undefined,
        "req":    request
    };
*/

// Async

io.verifyClient(function(info, callback) {
    setTimeout(callback, 1000 * 2, false, 400, "Client verification failed");
});

// Sync

io.verifyClient(function(info) {
    return true;
});
```



<a name="refPackets"></a>
#### Packets

```javascript
// (!) order is important


// Server

io.packets(
    // Unpack | server.socket.on
    {
        "rtt": null
    },

    // Pack | server.socket.emit
    {
        "rtt": null,

        "game.monster": [
            "lvl:uint8",
            "hp:uint8"
        ]
    },

    // Shared | server.socket.on | server.socket.emit
    {
        "user.gold": "uint16",
        "chat.message": [
            "uid:uint32",
            "text:str"
        ],
        "game.hero": [
            "name:str32",
            "lvl:int8",
            "hp:uint8",
            "x:uint16",
            "y:uint16"
        ]
    }
);


// Client

socket.packets(
    // Pack | server.socket.on
    {
        "rtt": null
    },

    // Unpack | server.socket.emit
    {
        "rtt": null,
        "game.monster": [
            "lvl:uint8",
            "hp:uint8"
        ]
    },

    // Shared | server.socket.on | server.socket.emit
    {
        "user.gold": "uint16",
        "chat.message": [
            "uid:uint32",
            "text:str"
        ],
        "game.hero": [
            "name:str32",
            "lvl:int8",
            "hp:uint8",
            "x:uint16",
            "y:uint16"
        ]
    }
);


// Server

io.emit("user.gold", 20);
io.emit("game.monster", {lvl: 13, hp: 69});


// Client

socket.on("game.monster", console.log);


// Server or Client

socket.emit("rtt");
socket.emit("chat.message", [0, "Helword"]);

socket.emit("game.hero", {name: "D", lvl: 13, hp: 69, x: -8, y: -8});
socket.emit("game.hero", ["D", 13, 69, -8, -8]);
```



<a name="refBundle"></a>
#### Bundle (only Server)

```javascript
io.packets(
    null,
    null,
    {
        "on.arg.asArray.zCopy ([])": [
            "text:str"
        ],
        "on.arg.asArray.new ([@])": [
            "text:str"
        ],

        "on.arg.asHashTable.zCopy.default": [
            "text:str"
        ],
        "on.arg.asHashTable.new ({@})": [
            "text:str"
        ]
    }
);

io.on("connection", function(socket, request) {
    socket.on("on.arg.asHashTable.new", function(data) {
        const bd = this.bundle(true);

        for(let i = 0; i < 10; ++i) { 
            bd.write("on.arg.asArray.zCopy", {text: `Helword: ${i}`});
        }

        bd.write("on.arg.asArray.zCopy");
        bd.end("on.arg.asArray.zCopy");
    });
});
```



<a name="refAPIServer"></a>

##### Packet type

| Name                | Alias   | Note                                                             |
|---------------------|---------|------------------------------------------------------------------|
|                     | -       |                                                                  |
| bin<size (byte)>    | b       | default: 1024 (0-65535); server: Buffer; client: Uint8Array;     |
| str<size (byte)>    | s       | default: 256 (0-65535)                                           |
| int<size (bit)>     | i       | size: 8, 16, 32                                                  |
| uint<size (bit)>    | u       | size: 8, 16, 32                                                  |
| float<size (bit)>   | f       | size: 32, 64                                                     |
| json<size (byte)>   | j       | default: 8192 (0-65535)                                          |


##### Server options

| Name              | Note                                     |
|-------------------|------------------------------------------|
|                   | -                                        |
| port              | default: undefined                       |
| host              | default: *                               |
| server            | default: http.Server                     |
| path              | default: "/"                             |
|                   | -                                        |
| ssl               |                                          |
|                   | -                                        |
| maxPayload        | default: 1024 * 32                       |
| perMessageDeflate | default: false                           |
| noDelay           | default: true                            |
|                   | -                                        |
| ping              | default: {"interval": 10000} (ms)        |
| clientJs          | default: true                            |
| packets           | dependencies: clientJs;(autointegration) |


##### Bundle: app.bundle(), socket.bundle([isBroadcast])

| Name              | Note                                 |
|-------------------|--------------------------------------|
|                   | -                                    |
| write(name, data) | returns: number of bytes written     |
| end([name, data]) | returns: number of bytes sent        |


##### Server: app([port, options])

| Name                                   |                     | Note                                        |
|----------------------------------------|---------------------|---------------------------------------------|
|                                        | **app.property**    |                                             |
| wss                                    |                     | uws                                         |
|                                        | **app.method**      |                                             |
| emit(name[, data])                     |                     | returns: number of bytes sent               |
| bundle()                               |                     |                                             |
| text(data)                             |                     |                                             |
| json(data)                             |                     |                                             |
| broadcast(data[, options])             |                     | native                                      |
|                                        | -                   |                                             |
| listen([port, host, callback])         |                     | default: "localhost:1337"                   |
| close([callback])                      |                     |                                             |
|                                        | -                   |                                             |
| packets([unpack, pack, shared])        |                     | return this;                                |
| verifyClient(func(info[, callback]))   |                     | return this;                                |
|                                        | -                   |                                             |
| on(name, listener)                     |                     | return this;                                |
| off([name, listener])                  |                     | return this;                                |
|                                        | **app.events**      |                                             |
| connection (socket, request)           |                     |                                             |
| close (socket, code, reason, wasClean) |                     |                                             |
| packet (name, data, socket, accept)    |                     |                                             |
| listening ()                           |                     |                                             |
| error (e)                              |                     |                                             |
|                                        | **socket.property** |                                             |
| readyState                             |                     | number (read only)                          |
| upgradeReq                             |                     | object (read only)                          |
|                                        | -                   |                                             |
| remotePort                             |                     | (read only)                                 |
| remoteAddress                          |                     | (read only)                                 |
| remoteFamily                           |                     | (read only)                                 |
|                                        | **socket.method**   |                                             |
| emit(name, [data, isBroadcast])        |                     | returns: number of bytes sent               |
| bundle([isBroadcast])                  |                     |                                             |
| text (data[, isBroadcast])             |                     |                                             |
| json (data[, isBroadcast])             |                     |                                             |
| send(data[, options])                  |                     | native                                      |
|                                        | -                   |                                             |
| disconnect([code, reason])             |                     | code: 4000-4999                             |
| terminate()                            |                     |                                             |
|                                        | -                   |                                             |
| ping([message])                        |                     |                                             |
|                                        | -                   |                                             |
| on(name, listener)                     |                     | return this;                                |
| once(name, listener)                   |                     | return this;                                |
| off([name, listener])                  |                     | return this;                                |
|                                        | **socket.events**   |                                             |
| close (code, reason, wasClean)         |                     |                                             |
| disconnected (code, reason)            |                     |                                             |
| terminated (code)                      |                     |                                             |
| error (e)                              |                     |                                             |
|                                        | -                   |                                             |
| message (data)                         |                     |                                             |
| text (data)                            |                     |                                             |
| json (data)                            |                     |                                             |
| arraybuffer (data)                     |                     | intercepts and blocks unpacking of packets  |
|                                        | -                   |                                             |
| ping (message)                         |                     |                                             |
| pong (message)                         |                     |                                             |
|                                        | -                   |                                             |
| *myEvent* (data)                       |                     |                                             |



<a name="refAPIClient"></a>

##### Client options

| Name                      | Note                                 |
|---------------------------|--------------------------------------|
|                           | -                                    |
| secure                    |                                      |
| reconnectionDelay         | default: 1 sec (minimum)             |
| reconnectionAttempts      | default: Infinity                    |


##### Client: app([url, options])

| Name                                 |                  | Note                                        |
|--------------------------------------|------------------|---------------------------------------------|
|                                      | **app.property** |                                             |
| url                                  |                  | string (read only)                          |
| reconnecting                         |                  | bool (read only)                            |
| bufferedAmount                       |                  | number (read only)                          |
| readyState                           |                  | number (read only)                          |
|                                      | **app.method**   |                                             |
| emit(name[, data])                   |                  | returns: number of bytes sent               |
| text(data)                           |                  |                                             |
| json(data)                           |                  |                                             |
| send(data)                           |                  | native                                      |
|                                      | -                |                                             |
| disconnect(code, reason)             |                  | code: 4000-4999                             |
|                                      | -                |                                             |
| packets([pack, unpack, shared])      |                  | return this;                                |
|                                      | -                |                                             |
| on(name, listener)                   |                  | return this;                                |
| once(name, listener)                 |                  | return this;                                |
| off([name, listener])                |                  | return this;                                |
|                                      | **app.events**   |                                             |
| restoring (attempts)                 |                  |                                             |
| restored (attempts)                  |                  |                                             |
| unrestored (attempts)                |                  |                                             |
|                                      | -                |                                             |
| open ()                              |                  |                                             |
| close (code, reason, event)          |                  | code: 1003 - invalid packet                 |
| disconnected (code, reason, event)   |                  |                                             |
| terminated (code, event)             |                  |                                             |
|                                      | -                |                                             |
| message (data, event)                |                  |                                             |
| text (data, event)                   |                  |                                             |
| json (data, event)                   |                  |                                             |
| arraybuffer (data, event)            |                  | intercepts and blocks unpacking of packets  |
| packet (name, data, accept)          |                  |                                             |
| error (e)                            |                  |                                             |
|                                      | -                |                                             |
| *myEvent* (data)                     |                  |                                             |



## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666
[3]: https://github.com/Daeren/sockizy/tree/master/examples/fileUpload
[4]: https://github.com/Daeren/sockizy/tree/master/examples/throttle

[cod_b]: https://img.shields.io/codacy/3307552f95d34748bf5a7b573f5815d8.svg
[cod_l]: https://www.codacy.com/app/daeren/sockizy/dashboard
