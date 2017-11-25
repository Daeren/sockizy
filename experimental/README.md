#### Index

* [Session](#refSession)



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
