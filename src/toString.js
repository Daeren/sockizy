//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const toString = (function() {
    return function(data) {
        if(data === null) {
            data = "";
        }
        else {
            switch(typeof(data)) {
                case "string": break;

                case "undefined": data = ""; break;
                case "number": data = isNaN(data) ? "" : (data + ""); break;
                case "symbol": data = data.toString(); break;

                default:
                    data = JSON.stringify(data);
            }
        }

        return data;
    };
})();

//-----------------------------------------------------

module.exports = toString;
