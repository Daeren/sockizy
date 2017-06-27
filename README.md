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
* [Session](#refSession)
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
<script src="//localhost:1337"></script>

<script>
    const socket = io("localhost:1337");
	
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



<a name="refSession"></a>
#### Session

```javascript
const io = rSockizy(1337, null, true).session();

if(io.isMaster) {
    return;
}

io.packets(
    {
        "common.signIn": [
            "login:str24",
            "password:str24"
        ]
    }
);

io.on("connection", function(socket, request) {
    socket.on("session", function(data) {
        io.text(data);
    });

    socket.on("common.signIn", async function(data) {
        if(this.session.uid || this.userAuthPrc) {
            return;
        }

        //-----------]>

        const C_MAX_USER_CONN = 1;

        let user, count, size,
            response;

        //-----------]>

        this.userAuthPrc = true;

        //-----------]>

        try {
            user = await auth(data.login, data.password);

            if(user) {
                count = await this.session.count(user.id);

                if(count < C_MAX_USER_CONN) {
                    size = await this.session.set(user.id);
                }
            }
        } catch(e) {}

        //-----------]>

        if(user) {
            if(size) {
                response = "USER.OK | " + user.id + " | " + size;
            }
            else if(count) {
                response = "USER.MAX.CONN | " + C_MAX_USER_CONN + " | " + count;
            }
            else {
                response = "USER.ERROR";
            }
        }
        else {
            response = "USER.BAD | " + data.login + " | " + data.password;
        }

        //-----------]>

        this.userAuthPrc = false;
        
        this.session.emit(response /*, targetUid*/);
        this.text(response);
		
    });

    function auth(login, password) {
        if(login !== "D" || password !== "13" && password !== "6") {
            return Promise.resolve(null);
        }

        return Promise.resolve({
            "id":    parseInt(password),
            "token": "x"
        });
    }
});


/*
socket.on("session", function(data) {});
socket.on("session.clear", function(uid) {});


socket.session.uid;


socket.session.set(uid[, callback(error, num)])
socket.session.delete([callback(error)])
socket.session.clear([uid = this.uid][, callback(error)])

socket.session.count(uid[, callback(error, num)])
socket.session.size([callback(error, num)])

socket.session.emit(message[, uid = this.uid])
*/
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
        "ev.on.arg.asArray.copy ([])": [
            "text:str"
        ],
        "ev.on.arg.asArray.new ([@])": [
            "text:str"
        ],
		
        "ev.on.arg.asHashTable.copy.default": [
            "text:str"
        ],
        "ev.on.arg.asHashTable.new ({@})": [
            "text:str"
        ]
    }
);

io.on("connection", function(socket, request) {
    socket.on("ev.on.arg.asHashTable.new", function(data) {
        const bd = this.bundle(true);

        for(let i = 0; i < 10; ++i) { 
            bd.write("ev.on.arg.asArray.copy", {text: `Helword: ${i}`});
        }

        bd.write("ev.on.arg.asArray.copy");
        bd.end("ev.on.arg.asArray.copy", ["Helword: end"]);
    });
});
```



<a name="refAPIServer"></a>

##### Packet type

| Name              | Alias   | Note                       |
|-------------------|---------|----------------------------|
|                   | -       |                            |
| str<size (byte)>  | s       | default: max 256           |
| int<size (bit)>   | i       | size: 8, 16, 32            |
| uint<size (bit)>  | u       | size: 8, 16, 32            |
| float<size (bit)> | f       | size: 32, 64               |


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
| promise           | default: Promise                     |
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

| Name                                 |                     | Note                                        |
|--------------------------------------|---------------------|---------------------------------------------|
|                                      | **app.property**    |                                             |
| cluster                              |                     |                                             |
| isMaster                             |                     |                                             |
|                                      | -                   |                                             |
| workers                              |                     |                                             |
| workerId                             |                     |                                             |
|                                      | -                   |                                             |
| wss                                  |                     | uws                                         |
|                                      | **app.method**      |                                             |
| emit(name, data)                     |                     | data: hashTable or array; returns: bool     |
| bundle()                             |                     |                                             |
| text(data)                           |                     |                                             |
| broadcast(data[, options])           |                     | native                                      |
|                                      | -                   |                                             |
| listen([port, host, callback])       |                     | default: "localhost:1337"                   |
| close([callback])                    |                     |                                             |
|                                      | -                   |                                             |
| packets([unpack, pack, shared])      |                     | return this;                                |
| verifyClient(func(info[, callback])) |                     | return this;                                |
| session([store])                     |                     | default: memory; return this;               |
|                                      | -                   |                                             |
| on(name, listener)                   |                     | return this;                                |
| off([name, listener])                |                     | return this;                                |
|                                      | **app.events**      |                                             |
| connection (socket)                  |                     |                                             |
| packet (name, data, socket)          |                     |                                             |
| error (data, socket)                 |                     |                                             |
|                                      | **socket.property** |                                             |
| readyState                           |                     | number (read only)                          |
|                                      | -                   |                                             |
| remotePort                           |                     | (read only)                                 |
| remoteAddress                        |                     | (read only)                                 |
| remoteFamily                         |                     | (read only)                                 |
|                                      | **socket.method**   |                                             |
| emit(name, data[, isBroadcast])      |                     | data: hashTable or array; returns: bool     |
| bundle([isBroadcast])                |                     |                                             |
| send(data[, options])                |                     | native                                      |
|                                      | -                   |                                             |
| disconnect([code, reason])           |                     |                                             |
| terminate()                          |                     |                                             |
|                                      | -                   |                                             |
| ping([message])                      |                     |                                             |
|                                      | -                   |                                             |
| on(name, listener)                   |                     | return this;                                |
| off([name, listener])                |                     | return this;                                |
|                                      | **socket.events**   |                                             |
| close (code, reason)                 |                     |                                             |
| disconnected (code, reason)          |                     |                                             |
| terminated (code)                    |                     |                                             |
|                                      | -                   |                                             |
| message (data)                       |                     |                                             |
| text (data)                          |                     |                                             |
| arraybuffer (data)                   |                     | intercepts and blocks unpacking of packets  |
|                                      | -                   |                                             |
| ping (message)                       |                     |                                             |
| pong (message)                       |                     |                                             |
|                                      | -                   |                                             |
| *myEvent* (data)                     |                     |                                             |



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
| isSupported()                        |                  |                                             |
|                                      | -                |                                             |
| emit(name, data)                     |                  | data: hashTable or array; returns: bool     |
| text(data)                           |                  |                                             |
| send(data)                           |                  | native                                      |
|                                      | -                |                                             |
| connect(url[, secure])               |                  |                                             |
| disconnect(code, reason)             |                  |                                             |
|                                      | -                |                                             |
| packets([pack, unpack, shared])      |                  | return this;                                |
|                                      | -                |                                             |
| on(name, listener)                   |                  | return this;                                |
| off([name, listener])                |                  | return this;                                |
|                                      | **app.events**   |                                             |
| restoring (attempts)                 |                  |                                             |
| restored (attempts)                  |                  |                                             |
| unrestored (attempts)                |                  |                                             |
|                                      | -                |                                             |
| open ()                              |                  |                                             |
| close (code, reason, event)          |                  |                                             |
| disconnected (code, reason, event)   |                  |                                             |
| terminated (code, event)             |                  |                                             |
|                                      | -                |                                             |
| message (data, event)                |                  |                                             |
| text (data, event)                   |                  |                                             |
| arraybuffer (data, event)            |                  | intercepts and blocks unpacking of packets  |
| packet (name, data)                  |                  |                                             |
| error (data)                         |                  |                                             |
|                                      | -                |                                             |
| *myEvent* (data)                     |                  |                                             |



## License

MIT

----------------------------------
[@ Daeren][1]
[@ Telegram][2]


[1]: http://666.io
[2]: https://telegram.me/io666

[cod_b]: https://img.shields.io/codacy/3307552f95d34748bf5a7b573f5815d8.svg
[cod_l]: https://www.codacy.com/app/daeren/sockizy/dashboard
