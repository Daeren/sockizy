//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

const Uint8ArraySlice = `
    function (begin, end) {
        //If 'begin' is unspecified, Chrome assumes 0, so we do the same
        if(begin === void 0) {
            begin = 0;
        }

        //If 'end' is unspecified, the new ArrayBuffer contains all
        //bytes from 'begin' to the end of this ArrayBuffer.
        if(end === void 0) {
            end = this.byteLength;
        }

        //Chrome converts the values to integers via flooring
        begin = Math.floor(begin);
        end = Math.floor(end);

        //If either 'begin' or 'end' is negative, it refers to an
        //index from the end of the array, as opposed to from the beginning.
        if(begin < 0) {
            begin += this.byteLength;
        }
        if (end < 0) {
            end += this.byteLength;
        }

        //The range specified by the 'begin' and 'end' values is clamped to the 
        //valid index range for the current array.
        begin = Math.min(Math.max(0, begin), this.byteLength);
        end = Math.min(Math.max(0, end), this.byteLength);

        //If the computed length of the new ArrayBuffer would be negative, it 
        //is clamped to zero.
        if(end - begin <= 0) {
            return new ArrayBuffer(0);
        }

        var len = end - begin;
        
        var result = new ArrayBuffer(len);
        var resultBytes = new Uint8Array(result);
        var sourceBytes = new Uint8Array(this, begin, len);


        while(len--) {
            resultBytes[len] = sourceBytes[len];
        }
        
        // some problems with IE11
        //resultBytes.set(sourceBytes);

        return resultBytes;
    }
`;

//-----------------------------------------------------

module.exports = function(grunt) {
    require("load-grunt-tasks")(grunt);
    require("time-grunt")(grunt);

    grunt.initConfig({
        concat: {
            dist: {
                options: {
                    sourceMap: true,
                    sourceMapName: "public/sockizy.min.js.map"
                },
                src: [
                    "node_modules/xee/index.js",
                    "node_modules/2pack/index.js",
                    "src/toString.js",
                    "scripts/clientApp.js"
                ],
                dest: "public/sockizyES6_tmp.js",
            }
        },

        wrap: {
            basic: {
                src: ["public/sockizyES6_tmp.js"],
                dest: "public/sockizyES6.js",
                options: {
                    wrapper: [
                        `const io = (function(module) {
                        "use strict";
                        
                        if(!Uint8Array.prototype.slice) {
                            Object.defineProperty(Uint8Array.prototype, "slice", {
                                "value": ${Uint8ArraySlice}
                            });
                        }`,

                        "return ws(window.WebSocket || window.MozWebSocket, toString, EE, bPack); })({});"
                    ]
                }
            }
        },

        babel: {
            options: {
                presets: ["es2015", "es2016", "es2017"]
            },
            dist: {
                files: {
                    "public/sockizy.js": "public/sockizyES6.js"
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    "public/sockizy.min.js": ["public/sockizy.js"]
                }
            }
        },

        clean: [
            "public/sockizyES6_tmp.js",
            "public/sockizyES6.js"
        ]
    });

    grunt.registerTask("default", ["concat", "wrap", "babel", "uglify", "clean"]);
};