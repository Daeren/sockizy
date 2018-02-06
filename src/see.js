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

        once(type, listener) {
            return this.on(type, function ls() {
                this.off(type, ls);
                listener.apply(this, arguments);
            });
        }

        off(type, listener) {
            const argsLen = arguments.length;

            if(!argsLen) {
                this._events = Object.create(null);
                return this;
            }

            //--------------]>

            const ev = this._events[type];

            if(argsLen === 1) {
                delete this._events[type];
                return this;
            }

            if(typeof(ev) === "function") {
                if(ev === listener) {
                    delete this._events[type];
                }

                return this;
            }

            //--------------]>

            const evLen = ev && ev.length;

            if(!evLen) {
                return this;
            }

            //--------------]>

            if(evLen === 1) {
                if(ev[0] === listener) {
                    delete this._events[type];
                }
            }
            else if(ev.indexOf(listener) >= 0) {
                if(evLen - 1) {
                    this._events[type] = this._arrayCloneWithout(ev, evLen, listener);
                }
                else {
                    delete this._events[type];
                }
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


        _emit(type, ...args) {
            const events = this._events[type];

            //--------------]>

            if(!events) {
                if(type === "error") {
                    const error = arguments[1];

                    if(error instanceof(Error)) {
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

            if(typeof(events) === "function") {
                events.apply(this, args);
            }
            else {
                for(let i = 0, len = events.length; i < len; ++i) {
                    events[i].apply(this, args);
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
})();

//-----------------------------------------------------

module.exports = SEE;
