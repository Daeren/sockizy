//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

"use strict";

//-----------------------------------------------------

module.exports = function(grunt) {
    require("load-grunt-tasks")(grunt)
    require("time-grunt")(grunt);

    grunt.initConfig({
        concat: {
            dist: {
                src: ["src/see.js","src/packer.js", "scripts/clientApp.js"],
                dest: "public/sockizyES6_tmp.js",
            }
        },

        wrap: {
            basic: {
                src: ["public/sockizyES6_tmp.js"],
                dest: "public/sockizyES6.js",
                options: {
                    wrapper: ["const io = (function(module) {\n'use strict';\n\n", "\n})({});"]
                }
            }
        },

        babel: {
            options: {
                sourceMap: true,
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