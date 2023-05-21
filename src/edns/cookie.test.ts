import { expect } from "chai";
import { Cookie } from "./cookie";
import { OptCode } from "./option";

describe("test construction", () => {
    it("should fail to create cookie", () => {
        expect(() => Cookie.from([]).toString()).to.throw(Error, `malformed cookie option: invalid length 0`);
        expect(() => Cookie.from(new Uint8Array(9)).toString()).to.throw(Error, `malformed cookie option: invalid length 9`);
        expect(() => Cookie.from(new Uint8Array(41)).toString()).to.throw(Error, `malformed cookie option: invalid length 41`);
    });

    it("should create cookie from data", () => {
        expect(Cookie.from([0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7]).toString()).to.equal(`; Cookie: 0001020304050607`);
        expect(Cookie.from([0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf]).toString()).to.equal(`; Cookie: 000102030405060708090a0b0c0d0e0f`);
        expect(() => Cookie.from(new Uint8Array(40)).toString()).to.not.throw;
    });
});

describe("test properties", () => {
    it("should have correct optCode", () => {
        expect(Cookie.from(new Uint8Array(8)).optCode).to.equal(OptCode.Cookie);
        expect(Cookie.from(new Uint8Array(16)).optCode).to.equal(OptCode.Cookie);
    });
});
