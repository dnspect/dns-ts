import { expect } from "chai";
import { UnknownOption } from "./unknown-option";
import { OptCode } from "./option";

describe("test construction", () => {
    it("should create unknown from requested size", () => {
        expect(new UnknownOption(0 as OptCode, new Uint8Array([0x12])).toString()).to.equal(`; Unknown EDNS option code 0 (length 1) data: 12`);
        expect(new UnknownOption(16 as OptCode, new Uint8Array([0x12, 0x34])).toString()).to.equal(`; Unknown EDNS option code 16 (length 2) data: 1234`);
    });
});

describe("test parse", () => {
    const dig1 = `Unknown EDNS option code 65001 (length 4) data: 12345678`;
    const dig2 = `EDNS0 Option Code: 65001, Length: 4, Data: 0x12345678`;

    it("should parse ex. 1", () => {
        expect(UnknownOption.parse(dig1).present()).to.equal(`; ${dig1}`);
    });

    it("should parse ex. 2", () => {
        expect(UnknownOption.parse(dig2).present()).to.equal(`; ${dig1}`);
    });
});
