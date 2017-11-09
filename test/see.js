//-----------------------------------------------------
//
// Author: Daeren
// Site: 666.io
//
//-----------------------------------------------------

/*jshint expr: true*/
/*global describe, it*/

"use strict";

//-----------------------------------------------------

const rChai     = require("chai");

const expect    = rChai.expect;

const rSee = require("./../src/see");

//-----------------------------------------------------

describe("SEE", function() {

    this.timeout(1000 * 10);

    //-----------------]>

    it("Base", function() {
        const ee = new rSee();

        expect(ee.on).to.be.a("function");
        expect(ee.off).to.be.a("function");
    });

    //-----------------]>

    it("on: x1", function(done) {
        const ee = new rSee();

        ee.on("msg", function() {
            done();
        });

        ee._emit("msg");
    });

    it("on: x2", function(done) {
        const ee = new rSee();

        let count = 0;

        ee.on("msg", function() {
            count++;
        });

        ee.on("msg", function() {
            expect(count).to.be.a("number").and.equal(1);
            done();
        });

        ee._emit("msg");
    });

    //-----------------]>

    it("on: x2 | data.arg.1", function(done) {
        const ee = new rSee();

        ee.on("msg", function(data) {
            expect(data).to.be.a("number").and.equal(136);
            done();
        });

        ee._emit("msg", 136);
    });

    it("on: x2 | data.arg.many", function(done) {
        const ee = new rSee();

        ee.on("msg", function() {
            for(let i = 0; i < arguments.length; i++) {
                expect(arguments[i]).to.be.a("number").and.equal(i + 1);
            }

            done();
        });

        ee._emit("msg", 1, 2, 3, 4, 5, 6);
    });

    //-----------------]>

    it("off", function(done) {
        const ee = new rSee();

        function fNope() {
            done("Nope");
        }

        ee.on("msg", fNope);
        ee.off("msg", fNope);
        ee._emit("msg");

        ee.on("msg", fNope);
        ee.off("msg");
        ee._emit("msg");

        ee.on("msg", fNope);
        ee.off();
        ee._emit("msg");

        ee.on("msg", function() {
            let j = 4;

            [1,2,3,4].forEach(function(e) {
                const name = "id." + e;

                ee.on(name, onTest);

                setTimeout(function() {
                    ee._emit(name);
                });

                //--------]>

                function onTest(data) {
                    ee.off(name, onTest);

                    j--;

                    if(!j) {
                        done();
                    }
                }
            });
        });
        ee._emit("msg");
    });

    it("listenerCount", function() {
        const ee = new rSee();


        function fNope() {
            done("Nope");
        }

        function fNope2() {
            done("Nope");
        }


        ee.on("msg", fNope);
        ee.off("msg", fNope);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(0);


        ee.on("msg", fNope);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(1);


        ee.on("msg", fNope);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(2);


        ee.on("msg", fNope2);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(3);


        ee.off("msg", fNope);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(2);


        ee.off("msg", fNope2);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(1);


        ee.on("msg", fNope);
        ee.on("msg", fNope);
        ee.on("msg", fNope2);
        ee.on("msg", fNope2);

        ee.on("msgX", fNope);

        expect(ee.listenerCount("msg")).to.be.a("number").and.equal(5);
    });

});
