﻿//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const SEE = (function() {
    class EE {
        constructor() {
            this._events = Object.create(null);
        }


        on(type, listener) {
            const ev = this._events[type];

            if(typeof(ev) === "function") {
                this._events[type] = [ev, listener];
            }
            else {
                this._events[type] = ev ? this._arrayCloneWith(ev, ev.length, listener) : listener;
            }

            return this;
        }

        off(type, listener) {
            const argsLen = arguments.length;

            //--------------]>

            if(!argsLen) {
                this._events = Object.create(null);
                return this;
            }

            //--------------]>

            const ev = this._events[type];

            if(typeof(ev) === "function") {
                if(argsLen === 1 || ev === listener) {
                    this._events[type] = null;
                }

                return this;
            }

            //--------------]>

            const evLen = ev && ev.length;

            //--------------]>

            if(!evLen) {
                return this;
            }

            //--------------]>

            if(argsLen === 1) {
                if(evLen === 1) {
                    ev.pop();
                }
                else {
                    this._events[type] = new Array();
                }
            }
            else if(evLen === 1) {
                if(ev[0] === listener) {
                    ev.pop();
                }
            }
            else if(ev.indexOf(listener) >= 0) {
                this._events[type] = this._arrayCloneWithout(ev, evLen, listener);
            }

            //--------------]>

            return this;
        }

        listenerCount(eventName) {
            const events = this._events;

            if(events) {
                const ev = events[eventName];

                if(typeof(ev) === "function") {
                    return 1;
                }
                else if(ev) {
                    return ev.length;
                }
            }

            return 0;
        }


        _emit(type) {
            const events = this._events[type];

            //--------------]>

            if(!events) {
                if(type === "error") {
                    const error = arguments[1];

                    if(error instanceof Error) {
                        throw error;
                    }
                    else {
                        const e = new Error(`Unhandled "error" event. (${error})`);
                        e.context = error;

                        throw e;
                    }
                }

                return false;
            }

            //--------------]>

            const isFn = typeof(events) === "function";
            const argsLen = arguments.length;

            //--------------]>

            switch(argsLen) {
                case 1: emitNone(events, isFn, this); break;
                case 2: emitOne(events, isFn, this, arguments[1]); break;
                case 3: emitTwo(events, isFn, this, arguments[1], arguments[2]); break;
                case 4: emitThree(events, isFn, this, arguments[1], arguments[2], arguments[3]); break;

                default: {
                    const args = new Array(argsLen - 1);

                    for(let i = 1; i < argsLen; ++i) {
                        args[i - 1] = arguments[i];
                    }

                    emitMany(events, isFn, this, args);
                }
            }

            //--------------]>

            return true;
        }

        _arrayCloneWithout(arr, n, listener) {
            const copy = new Array(n - 1);

            let t,
                i = 0;

            while(n--) {
                t = arr[n];

                if(listener !== t) {
                    copy[i] = t;
                    ++i;
                }
            }

            return copy;
        }

        _arrayCloneWith(arr, n, listener) {
            const copy = new Array(n + 1);

            copy[n] = listener;

            while(n--) {
                copy[n] = arr[n];
            }

            return copy;
        }
    }

    //-----------------------]>

    return EE;

    //-----------------------]>

    function emitNone(handler, isFn, self) {
        if(isFn) {
            handler.call(self);
        }
        else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self);
            }
        }
    }
    function emitOne(handler, isFn, self, arg1) {
        if(isFn) {
            handler.call(self, arg1);
        }
        else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1);
            }
        }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
        if(isFn) {
            handler.call(self, arg1, arg2);
        }
        else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1, arg2);
            }
        }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
        if(isFn) {
            handler.call(self, arg1, arg2, arg3);
        }
        else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1, arg2, arg3);
            }
        }
    }
    function emitMany(handler, isFn, self, args) {
        if(isFn) {
            handler.apply(self, args);
        }
        else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].apply(self, args);
            }
        }
    }
})();

//-----------------------------------------------------

module.exports = SEE;
