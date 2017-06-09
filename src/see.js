//-----------------------------------------------------
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
            this._events = {};
        }


        on(name, listener) {
            const ev = this._events[name];

            if(typeof(ev) === "function") {
                this._events[name] = [ev, listener];
            } else {
                this._events[name] = ev ? this._arrayCloneWith(ev, ev.length, listener) : listener;
            }

            return this;
        }

        off(name, listener) {
            const argsLen = arguments.length;

            //--------------]>

            if(!argsLen) {
                this._events = {};
                return this;
            }

            //--------------]>

            const ev = this._events[name];

            if(typeof(ev) === "function") {
                if(argsLen === 1 || ev === listener) {
                    this._events[name] = null;
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
                } else {
                    this._events[name] = new Array();
                }
            } else if(evLen === 1) {
                if(ev[0] === listener) {
                    ev.pop();
                }
            } else if(ev.indexOf(listener) >= 0) {
                this._events[name] = this._arrayCloneWithout(ev, evLen, listener);
            }

            //--------------]>

            return this;
        }


        _emit(name) {
            const events = this._events[name];

            //--------------]>

            if(!events) {
                if(name === "error") {
                    let error = arguments[1];

                    if(error instanceof Error) {
                        throw error;
                    } else {
                        let e = new Error('Unhandled "error" event. (' + error + ')');
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

                    for(let i = 1; i < argsLen; i++) {
                        args[i - 1] = arguments[i];
                    }

                    emitMany(events, isFn, this, args);
                }
            }

            //--------------]>

            return true;
        }

        _arrayCloneWithout(arr, n, listener) {
            const copy = new Array(--n);

            let t;

            while(n--) {
                t = arr[n];

                if(listener !== t) {
                    copy[n] = t;
                }
            }

            return copy;
        }

        _arrayCloneWith(arr, n, listener) {
            const copy = new Array(n + 1);

            while(n--) {
                copy[n] = arr[n];
            }

            copy[n] = listener;

            return copy;
        }
    }

    //-----------------------]>

    return EE;

    //-----------------------]>

    function emitNone(handler, isFn, self) {
        if(isFn) {
            handler.call(self);
        } else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self);
            }
        }
    }
    function emitOne(handler, isFn, self, arg1) {
        if(isFn) {
            handler.call(self, arg1);
        } else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1);
            }
        }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
        if(isFn) {
            handler.call(self, arg1, arg2);
        } else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1, arg2);
            }
        }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
        if(isFn) {
            handler.call(self, arg1, arg2, arg3);
        } else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].call(self, arg1, arg2, arg3);
            }
        }
    }
    function emitMany(handler, isFn, self, args) {
        if(isFn) {
            handler.apply(self, args);
        } else {
            for(let i = 0, len = handler.length; i < len; ++i) {
                handler[i].apply(self, args);
            }
        }
    }

})();

//-----------------------------------------------------

module.exports = SEE;
