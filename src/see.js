//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

class SEE {
    constructor() {
        this._events = Object.create(null);
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
            this._events = Object.create(null);
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
        const ev    = this._events[name];
        const func  = typeof(ev) === "function" && ev;

        const evLen = func || ev && ev.length;

        //--------------]>

        if(!evLen) {
            if(name === "error") {
                throw arguments[1];
            }

            return false;
        }

        //--------------]>

        const argsLen = arguments.length;

        //--------------]>

        if(func) {
            switch(argsLen) {
                case 1: func.call(this); break;
                case 2: func.call(this, arguments[1]); break;
                case 3: func.call(this, arguments[1], arguments[2]); break;
                case 4: func.call(this, arguments[1], arguments[2], arguments[3]); break;

                default:
                    const args = new Array(argsLen - 1);

                    for(let i = 1; i < argsLen; i++) {
                        args[i - 1] = arguments[i];
                    }

                    func.apply(this, args);
            }

            return true;
        }

        switch(argsLen) {
            case 1:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this);
                }

                break;

            case 2:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1]);
                }

                break;

            case 3:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1], arguments[2]);
                }

                break;

            case 4:
                for(let i = 0; i < evLen; i++) {
                    ev[i].call(this, arguments[1], arguments[2], arguments[3]);
                }

                break;

            default:
                const args = new Array(argsLen - 1);

                for(let i = 1; i < argsLen; i++) {
                    args[i - 1] = arguments[i];
                }

                for(let i = 0; i < evLen; i++) {
                    ev[i].apply(this, args);
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

//-----------------------------------------------------

module.exports = SEE;
