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
            return "";
        }

        switch(typeof(data)) {
            case "string":      return data;

            case "undefined":   return "";
            case "number":      return isNaN(data) ? "" : (data + "");
            case "symbol":      return data.toString();

            default:            return JSON.stringify(data);
        }
    };
})();

//-----------------------------------------------------

module.exports = toString;
