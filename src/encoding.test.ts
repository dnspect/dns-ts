import { expect } from "chai";
import { stringToBinary } from "./encoding";

describe("test stringToBinary()", () => {
    it("should convert hex", () => {
        const actual = stringToBinary("00082200000000038001", "hex");
        expect(Array.from(actual)).to.have.ordered.members([0x00, 0x08, 0x22, 0x00, 0x00, 0x00, 0x00, 0x03, 0x80, 0x01]);
    });

    it("should convert hex-ws", () => {
        const actual = stringToBinary("00 08 22 00 00 00 00 03 80 01", "hex-ws");
        expect(Array.from(actual)).to.have.ordered.members([0x00, 0x08, 0x22, 0x00, 0x00, 0x00, 0x00, 0x03, 0x80, 0x01]);
    });
});
