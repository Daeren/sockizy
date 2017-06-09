[![Codacy][cod_b]][cod_l]

```
npm -g install sockizy
git clone https://github.com/Daeren/sockizy.git
```


* SSL
* Cluster
* Binary (Little/Big - Endian)
* Relative and absolute zero-copy operations wherever possible


#### Goals:
1. Low memory usage;
2. Maximum performance;
3. Flexibility;
4. Games.


#### Index

* [Start](#refStart)
* [SSL](#refSSL)
* [Verify](#refVerifyClient)
* [Packets](#refPackets)
* [Bundle](#refBundle)
* [Server API](#refAPIServer)
* [Client API](#refAPIClient)



<a name="refStart"></a>
#### Start

Server:

```javascript
const rSockizy = require("sockizy");

//-----------------------------------------------------

const io = rSockizy(1337, {"maxPayload": 1024 * 16}, true);

//-----------------------------------------------------

if(io.isMaster) {
    console.log(`Master ${process.pid} is running`);
    return;
}

console.log(`Worker ${process.pid} started | id: ${io.workerId}`);

//-----------------------------------------------------

io.on("connection", function(socket, request) {
    socket.on("message", console.log);
    socket.send("cluster.srv#2easy");
});
```

Client:

```javascript
<script src="http://localhost:1337"></script>

<script>
    const socket = io("wss://localhost:1337");
	
    socket.on("message", console.log);
    socket.send("cluster.cl#2easy");
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

const io = rSockizy(1337, {ssl, "maxPayload": 1024 * 16});
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
    setTimeout(callback, 1000 * 2, true);
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

        "monster": [
            "lvl:uint8",
            "hp:uint8"
        ]
    },

    // Shared | server.socket.on | server.socket.emit

    {
        "chat.message": [
            "uid:uint32",
            "text:str"
        ],
        "hero": [
            "name:str32",
            "lvl:int8",
            "hp:uint8",
            "x:uint16",
            "y:uint16"
        ]
    }
);


// Client

io.packets(
    // Pack | server.socket.on

    {
        "rtt": null
    },

    // Unpack | server.socket.emit

    {
        "rtt": null
    },

    // Shared | server.socket.on | server.socket.emit

    {
        "chat.message": [
            "uid:uint32",
            "text:str"
        ],
        "hero": [
            "name:str32",
            "lvl:int8",
            "hp:uint8",
            "x:uint16",
            "y:uint16"
        ]
    }
);


// Server

io.emit("monster", {lvl: 13, hp: 69});

// Client

io.on("monster", console.log);

// Server or Client

io.emit("rtt");
io.emit("chat.message", [0, "Helword"]);

io.emit("hero", {name: "D", lvl: 13, hp: 69, x: -8, y: -8});
io.emit("hero", ["D", 13, 69, -8, -8]);
```



<a name="refBundle"></a>
#### Bundle (only Server)

```javascript
io.packets(
    null,
    null,
    {
        "test.some.message": [
            "text:str"
        ]
    }
);

io.on("connection", function(socket, request) {
    socket.on("test.some.message", function(data) {
        const isBroadcast = true;
        const bd = this.bundle(isBroadcast);

        for(let i = 0; i < 10; i++) { 
            bd.write("test.some.message", {text: `Helword: ${i}`});
        }

        bd.write("test.some.message");
        bd.end("chat.message", ["Helword: end"]);
    });
});
```



<a name="refAPIServer"></a>

##### Packet type

| Name              | Note                                 |
|-------------------|--------------------------------------|
|                   | -                                    |
| str<Size (byte)>  | default: max 256                     |
| int<Size (bit)>   | size: 8, 16, 32                      |
| uint<Size (bit)>  | size: 8, 16, 32                      |
| float<Size (bit)> | size: 32, 64                         |


##### Server options

| Name              | Note                                 |
|-------------------|--------------------------------------|
|                   | -                                    |
| port              | default: undefined                   |
| host              | default: *                           |
| server            | default: http.Server                 |
| path              | default: "/"                         |
| cluster           | default: false                       |
|                   | -                                    |
| ssl               |                                      |
| numCPUs           | default: max(cpu - 1, 1)             |
| maxSockets        | Infinity                             |
|                   | -                                    |
| maxPayload 		| default: 1024                        |
| perMessageDeflate | default: false                       |
| noDelay           | default: true                        |
|                   | -                                    |
| ping              | default: {"interval": 1000}          |
| clientJs          | default: true                        |


##### Bundle: app.bundle(), socket.bundle([isBroadcast])

| Name              | Note                                 |
|-------------------|--------------------------------------|
|                   | -                                    |
| write(name, data) | returns: number of bytes written     |
| end([name, data]) | returns: number of bytes sent        |


##### Server: app([port, options, isCluster])

| Name                                 |                  | Note                                        |
|--------------------------------------|------------------|---------------------------------------------|
|                                      | **app.property** |                                             |
| cluster                              |                  |                                             |
| isMaster                             |                  |                                             |
|                                      | -                |                                             |
| workers                              |                  |                                             |
| workerId                             |                  |                                             |
|                                      | -                |                                             |
| wss                                  |                  | uws                                         |
|                                      | **app.method**   |                                             |
| emit(name, data)                     |                  | data: hashTable or array; returns: bool     |
| bundle()                             |                  |                                             |
| text(data)                           |                  |                                             |
| broadcast(data[, options])           |                  | native                                      |
|                                      | -                |                                             |
| listen([port, host, callback])       |                  | default: "localhost:1337"                   |
| close([callback])                    |                  |                                             |
|                                      | -                |                                             |
| packets([unpack, pack, shared])      |                  | return this;                                |
| verifyClient(func(info[, callback])) |                  | return this;                                |
|                                      | -                |                                             |
| on(name, listener)                   |                  | return this;                                |
| off([name, listener])                |                  | return this;                                |
|                                      | **app.events**   |                                             |
| connection (socket)                  |                  |                                             |
| packet (name, data, socket)          |                  |                                             |
| error (data, socket)                 |                  |                                             |
|                                      | **socket.method**|                                             |
| emit(name, data[, isBroadcast])      |                  | data: hashTable or array; returns: bool     |
| bundle([isBroadcast])                |                  |                                             |
| send(data[, options])                |                  | native                                      |
|                                      | -                |                                             |
| disconnect([code, reason])           |                  |                                             |
| terminate()                          |                  |                                             |
|                                      | -                |                                             |
| ping([message])                      |                  |                                             |
|                                      | -                |                                             |
| on(name, listener)                   |                  | return this;                                |
| off([name, listener])                |                  | return this;                                |
|                                      | **socket.events**|                                             |
| close (code, reason)                 |                  |                                             |
| disconnected (code, reason)          |                  |                                             |
| terminated (code)                    |                  |                                             |
|                                      | -                |                                             |
| message (data)                       |                  |                                             |
| text (data)                          |                  |                                             |
| arraybuffer (data)                   |                  | intercepts and blocks unpacking of packets  |
|                                      | -                |                                             |
| ping (message)                       |                  |                                             |
| pong (message)                       |                  |                                             |



<a name="refAPIClient"></a>

##### Client: app([url, options])

| Name                                 |                  | Note                                        |
|--------------------------------------|------------------|---------------------------------------------|
|                                      | **app.property** |                                             |
| url                                  |                  | string (read only)                          |
| reconnecting                         |                  | bool (read only)                            |
|                                      | **app.method**   |                                             |
| isSupported()                        |                  |                                             |
|                                      | -                |                                             |
| emit(name, data)                     |                  | data: hashTable or array; returns: bool     |
| text(data)                           |                  |                                             |
| send(data)                           |                  | native                                      |
|                                      | -                |                                             |
| connect(url)                         |                  |                                             |
| disconnect(code, reason)             |                  |                                             |
|                                      | -                |                                             |
| packets([pack, unpack, shared])      |                  | return this;                                |
|                                      | -                |                                             |
| on(name, listener)                   |                  | return this;                                |
| off([name, listener])                |                  | return this;                                |
|                                      | **app.events**   |                                             |
| restoring ()                         |                  |                                             |
| restored ()                          |                  |                                             |
|                                      | -                |                                             |
| open ()                              |                  |                                             |
| close (code, reason, event)          |                  |                                             |
| disconnected (code, reason, event)   |                  |                                             |
| terminated (code, event)             |                  |                                             |
|                                      | -                |                                             |
| packet (name, data)                  |                  |                                             |
| message (data, event)                |                  |                                             |
| text (data, event)                   |                  |                                             |
| arraybuffer (data, event)            |                  | intercepts and blocks unpacking of packets  |
| error (data)                         |                  |                                             |



## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666

[cod_b]: https://img.shields.io/codacy/3307552f95d34748bf5a7b573f5815d8.svg
[cod_l]: https://www.codacy.com/app/daeren/sockizy/dashboard
