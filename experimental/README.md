#### Index

* [Session](#refSession)
* [Server API](#refAPIServer)



<a name="refSession"></a>
#### Session

```javascript
const io = sockizy(1337, null, true).session();

//-----------------------------------------------------

if(io.isMaster) {
    return;
}

//-----------------------------------------------------

io.packets(
    {
        "common.signIn": [
            "login:str24",
            "password:str24"
        ],
        "common.signOut": null
    }
);

//-----------------------------------------------------

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

    socket.on("common.signOut", async function(data) {
        if(!this.session.uid) {
            return;
        }

        await this.session.delete();
    });

    //----------------------------]>

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
socket.on("session", data => {});      // notify: all sockets
socket.on("session.clear", uid => {}); // notify: all sockets
socket.on("session.end", uid => {});   // notify: a single(last) socket


socket.session.uid;


socket.session.set(uid[, callback(error, num)])
socket.session.delete([callback(error)])
socket.session.clear([uid = this.uid][, callback(error)])

socket.session.count([uid = this.uid][, callback(error, num)])
socket.session.size([callback(error, num)])

// event: "session"
socket.session.emit(message[, uid = this.uid])

//-----]>

io.session.clear([uid][, callback(error)])

io.session.count(uid[, callback(error, num)])
io.session.size([callback(error, num)])

io.session.emit(message[, uid])
*/
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
|                   | -                                    |
| cluster           | default: false                       |
| forkTimeout       | default: 5 (sec); off: 0             |
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
| json(data)                           |                     |                                             |
| broadcast(data[, options])           |                     | native                                      |
|                                      | -                   |                                             |
| listen([port, host, callback])       |                     | default: "localhost:1337"                   |
| close([callback])                    |                     |                                             |
|                                      | -                   |                                             |
| packets([ns][,unpack, pack, shared]) |                     | return this;                                |
| verifyClient(func(info[, callback])) |                     | return this;                                |
| session([store])                     |                     | default: memory; return this;               |
|                                      | -                   |                                             |
| on(name, listener)                   |                     | return this;                                |
| off([name, listener])                |                     | return this;                                |
|                                      | **app.events**      |                                             |
| connection (socket)                  |                     |                                             |
| close (socket, code, reason)         |                     |                                             |
| packet (name, data, socket)          |                     |                                             |
| error (data, socket)                 |                     |                                             |
|                                      | **socket.property** |                                             |
| readyState                           |                     | number (read only)                          |
|                                      | -                   |                                             |
| remotePort                           |                     | (read only)                                 |
| remoteAddress                        |                     | (read only)                                 |
| remoteFamily                         |                     | (read only)                                 |
|                                      | -                   |                                             |
| dropPackets                          |                     | true/false                                  |
|                                      | **socket.method**   |                                             |
| emit(name, data[, isBroadcast])      |                     | data: hashTable or array; returns: bool     |
| bundle([isBroadcast])                |                     |                                             |
| text (data, isBroadcast)             |                     |                                             |
| json (data, isBroadcast)             |                     |                                             |
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
| json (data)                          |                     |                                             |
| arraybuffer (data)                   |                     | intercepts and blocks unpacking of packets  |
|                                      | -                   |                                             |
| ping (message)                       |                     |                                             |
| pong (message)                       |                     |                                             |
|                                      | -                   |                                             |
| *myEvent* (data)                     |                     |                                             |
