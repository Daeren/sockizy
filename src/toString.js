//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

module.exports = toString;

//-----------------------------------------------------

function toString(data) {
    if(data === null) {
        return "";
    }

    switch(typeof(data)) {
        case "string":      return data;

        case "undefined":   return "";
        case "boolean":     return data ? "true" : "false";
        case "number":      return isNaN(data) ? "" : data.toString();
        case "bigint":      return data.toString();
        case "symbol":      return data.toString();

        default:            return JSON.stringify(data);
    }
}