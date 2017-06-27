//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

function main(io, evHandler) {
    const sessions  = new Map();
    const sockets   = new Map();

    const wid       = io.workerId;
    const prcSend   = wid > 0 ? process.send.bind(process) : onWorkerMessage;
    const rpcMap    = new Map();

    let socketIdInc = 0,
        rpcIdInc    = 0;

    //------------------------]>

    if(io.isMaster) {
        io.workers.forEach((worker) => worker.on("message", onWorkerMessage));
    }
    else {
        if(wid > 0) {
            process.on("message", onMasterMessage);
        }

        io.on("connection", onIoConncetion);
    }

    //------------------------]>

    function prcSendWrapper(self, data, callback) {
        if(callback) {
            const C_IDX_MSG_DATA = 2;

            data[C_IDX_MSG_DATA] = data[C_IDX_MSG_DATA] || {};

            data[C_IDX_MSG_DATA].rid = rpcIdInc;
            data[C_IDX_MSG_DATA].wid = wid;

            rpcMap.set(rpcIdInc, (a, b) => callback.call(self, a, b));
            rpcIdInc = ++rpcIdInc % Number.MAX_SAFE_INTEGER
        }

        prcSend(data);
    }

    //-----------)>

    function onIoConncetion(socket) {
        const sid = socketIdInc.toString(32);
        const sidx = wid + ":" + sid;

        //---------]>

        socketIdInc = ++socketIdInc % Number.MAX_SAFE_INTEGER

        sockets.set(sid, socket);

        //---------]>

        socket.session = {
            emit(message, uid = this.uid) {
                if(typeof(uid) !== "undefined") {
                    prcSendWrapper(this, [1, "wss.userSession.customEv", {uid, message}]);
                }

                return this;
            },

            set(uid, callback) {
                if(typeof(uid) !== "undefined" && uid !== null) {
                    if(typeof(this.uid) !== "undefined" && this.uid !== null) {
                        if(callback) {
                            callback(new Error("The 'uid' has already been set"));
                        }
                    }
                    else {
                        this.uid = uid;

                        prcSendWrapper(this, [1, "wss.userSession.setSocket", {uid, sidx}], callback);
                    }

                }
                else if(callback) {
                    callback(new Error("Not specified 'uid'"));
                }

                return this;
            },

            size(callback) {
                prcSendWrapper(this, [1, "wss.userSession.size"], callback);
                return this;
            },

            delete(callback) {
                const uid = this.uid;

                if(typeof(uid) !== "undefined" && uid !== null) {
                    this.uid = null;

                    prcSendWrapper(this, [1, "wss.userSession.deleteSocket", {uid, sidx}], callback);
                }
                else if(callback) {
                    callback();
                }

                return this;
            },

            clear(callback) {
                const uid = this.uid;

                if(typeof(uid) !== "undefined" && uid !== null) {
                    this.uid = null;

                    prcSendWrapper(this, [1, "wss.userSession.clear", {uid}], callback);
                }
                else if(callback) {
                    callback();
                }

                return this;
            }
        };

        //---------]>

        socket.on("close", function() {
            sockets.delete(sid);
            this.session.delete();
        });
    }

    function onMasterMessage([type, id, data, params]) {
        if(!type) {
            return;
        }

        switch(id) {
            case "wss.userSession.customEv": {
                const socket = sockets.get(params);

                if(!socket) {
                    return;
                }

                if(typeof(evHandler) === "function") {
                    evHandler(socket, data);
                }

                socket._emit("session", data);

                break;
            }

            case "wss.userSession.callback": {
                const {rid, error} = params;
                const func = rpcMap.get(rid);

                rpcMap.delete(rid);
                func(error, data);

                break;
            }
        }
    }

    function onWorkerMessage([type, id, data, params]) {
        if(!type) {
            return;
        }

        switch(id) {
            case "wss.userSession.customEv": {
                const {rid, uid, message} = data;
                const s = sessions.get(uid);

                //--------]>

                if(!s) {
                    break;
                }

                for(let e of s.keys()) {
                    e = e.split(":");

                    //--------]>

                    const workerId = parseInt(e[0], 10) - 1;
                    const sid = e[1];

                    const result = [1, id, message, sid];

                    //--------]>

                    if(workerId >= 0) {
                        io.workers[workerId].send(result);
                    }
                    else {
                        onMasterMessage(result);
                    }
                }

                break;
            }

            case "wss.userSession.setSocket": {
                const {uid, sidx} = data;

                let s = sessions.get(uid);

                //--------]>

                if(!s) {
                    s = new Map();
                    sessions.set(uid, s);
                }

                s.set(sidx, true);

                sendCallback(null, sessions.size);

                break;
            }

            case "wss.userSession.deleteSocket": {
                const {uid, sidx} = data;
                const s = sessions.get(uid);

                //--------]>

                if(!s) {
                    sendCallback(`Not found 'uid': ${uid}`);
                    break;
                }

                s.delete(sidx);

                if(!s.size) {
                    sessions.delete(uid);
                }

                sendCallback(null);

                break;
            }

            case "wss.userSession.clear": {
                sessions.delete(data.uid);
                sendCallback(null);

                break;
            }

            case "wss.userSession.size": {
                sendCallback(null, sessions.size);
                break;
            }
        }

        function sendCallback(error, message) {
            const rid = data.rid;

            if(typeof(rid) === "undefined") {
                return;
            }

            const workerId = data.wid - 1;
            const result = [1, "wss.userSession.callback", message, {rid, error}];

            if(workerId >= 0) {
                io.workers[workerId].send(result);
            }
            else {
                onMasterMessage(result);
            }
        }
    }
}

//-----------------------------------------------------

module.exports = main;
