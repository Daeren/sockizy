﻿//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

function main(io, evHandler) {
    const C_IPC_ID              = 9;
    const C_IDX_MSG_DATA        = 2;
    const C_MAX_SAFE_INTEGER    = Number.MAX_SAFE_INTEGER;

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

    function prcSendWrapper(self, name, message, callback) {
        const data = [C_IPC_ID, name, message];

        if(callback) {
            data[C_IDX_MSG_DATA] = data[C_IDX_MSG_DATA] || {};

            data[C_IDX_MSG_DATA].rid = rpcIdInc;
            data[C_IDX_MSG_DATA].wid = wid;

            rpcMap.set(rpcIdInc, (a, b) => callback.call(self, a, b));
            rpcIdInc = ++rpcIdInc % C_MAX_SAFE_INTEGER
        }

        prcSend(data);
    }

    //-----------)>

    function onIoConncetion(socket) {
        const sid = socketIdInc.toString(32);
        const sidx = wid + ":" + sid;

        //---------]>

        socketIdInc = ++socketIdInc % C_MAX_SAFE_INTEGER;

        sockets.set(sid, socket);

        //---------]>

        socket.session = {
            _reset() {
                this.uid = null;
            },


            set(uid, callback) {
                if(arguments.length <= 1) {
                    return new io.Promise((resolve, reject) => {
                        this.set(uid, (error, result) => error ? reject(error) : resolve(result));
                    });
                }

                if(typeof(uid) !== "undefined" && uid !== null) {
                    if(typeof(this.uid) !== "undefined" && this.uid !== null) {
                        if(callback) {
                            callback(new Error("The 'uid' has already been set"));
                        }
                    }
                    else {
                        this.uid = uid;
                        prcSendWrapper(this, "wss.userSession.set", {uid, sidx}, callback);
                    }
                }
                else if(callback) {
                    callback(new Error("Not specified 'uid'"));
                }
            },

            clear(uid = this.uid, callback = null) {
                if(arguments.length <= 1) {
                    return new io.Promise((resolve, reject) => {
                        this.clear(uid, (error, result) => error ? reject(error) : resolve(result));
                    });
                }

                if(typeof(uid) !== "undefined" && uid !== null) {
                    prcSendWrapper(this, "wss.userSession.clear", {uid}, callback);
                }
                else if(callback) {
                    callback(null);
                }
            },


            count(uid, callback) {
                if(arguments.length <= 1) {
                    return new io.Promise((resolve, reject) => {
                        this.count(uid, (error, result) => error ? reject(error) : resolve(result));
                    });
                }

                if(typeof(uid) !== "undefined" && uid !== null) {
                    prcSendWrapper(this, "wss.userSession.count", {uid}, callback);
                }
                else if(callback) {
                    callback(new Error("Not specified 'uid'"));
                }
            },

            size(callback) {
                if(arguments.length <= 0) {
                    return new io.Promise((resolve, reject) => {
                        this.size((error, result) => error ? reject(error) : resolve(result));
                    });
                }

                prcSendWrapper(this, "wss.userSession.size", null, callback);
            },


            emit(message, uid = this.uid) {
                if(typeof(uid) !== "undefined") {
                    prcSendWrapper(this, "wss.userSession.emit", {uid, message});
                    return true;
                }

                return false;
            },

            delete(callback) {
                const uid = this.uid;

                if(arguments.length <= 0) {
                    return new io.Promise((resolve, reject) => {
                        this.delete((error, result) => error ? reject(error) : resolve(result));
                    });
                }

                if(typeof(uid) !== "undefined" && uid !== null) {
                    this._reset();
                    prcSendWrapper(this, "wss.userSession.delete", {uid, sidx}, callback);
                }
                else if(callback) {
                    callback(null);
                }
            }
        };

        //---------]>

        socket.on("close", function() {
            sockets.delete(sid);
            this.session.delete(null);
        });
    }

    function onMasterMessage([type, id, data, params]) {
        if(type !== C_IPC_ID) {
            return;
        }

        switch(id) {
            case "wss.userSession.customEv": {
                const {sid, event} = params;
                const socket = sockets.get(sid);

                if(!socket) {
                    return;
                }

                if(event === "session.clear") {
                    socket.session._reset(null);
                }

                if(typeof(evHandler) === "function") {
                    evHandler(event, data, socket);
                }

                socket._emit(event, data);

                break;
            }

            case "wss.userSession.callback": {
                const {rid, error} = params;
                const func = rpcMap.get(rid);

                rpcMap.delete(rid);
                func(error, data);

                break;
            }

            default: {
                throw new Error(`Unknown id: ${id}`);
            }
        }
    }

    function onWorkerMessage([type, id, data, params]) {
        if(type !== C_IPC_ID) {
            return;
        }

        switch(id) {
            case "wss.userSession.set": {
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

            case "wss.userSession.clear": {
                const {uid} = data;

                sendCustomEv(uid, "session.clear", uid);
                sessions.delete(uid);
                sendCallback(null);

                break;
            }


            case "wss.userSession.count": {
                const s = sessions.get(data.uid);
                sendCallback(null, s ? s.size : 0);

                break;
            }

            case "wss.userSession.size": {
                sendCallback(null, sessions.size);
                break;
            }


            case "wss.userSession.emit": {
                const {uid, message} = data;
                sendCustomEv(uid, "session", message);

                break;
            }

            case "wss.userSession.delete": {
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


            default: {
                throw new Error(`Unknown id: ${id}`);
            }
        }

        //---------]>

        function sendCustomEv(uid, event, message) {
            const s = sessions.get(uid);

            //--------]>

            if(!s) {
                return;
            }

            for(let e of s.keys()) {
                e = e.split(":");

                //--------]>

                const workerId = parseInt(e[0], 10) - 1;
                const sid = e[1];

                const result = [C_IPC_ID, "wss.userSession.customEv", message, {sid, event}];

                //--------]>

                if(workerId >= 0) {
                    io.workers[workerId].send(result);
                }
                else {
                    onMasterMessage(result);
                }
            }
        }

        function sendCallback(error, message) {
            const rid = data.rid;

            if(typeof(rid) === "undefined") {
                return;
            }

            const workerId = data.wid - 1;
            const result = [C_IPC_ID, "wss.userSession.callback", message, {rid, error}];

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
