import { PacketBuffer } from "./buffer";
import { binaryToString, stringToBinary } from "./encoding";
import { Message } from "./message";
import { expect } from "chai";
import { CharacterString } from "./packet";

function trimStart(input: string): string {
    return input.trim().replace(/^ +/gm, "");
}

describe("test CharacterString()", () => {
    it("should be expressed in textual representation", () => {
        expect(new CharacterString(``).present()).to.equal(``);
        expect(new CharacterString(` `).present()).to.equal(`" "`);
        expect(new CharacterString(`\0`).present()).to.equal(`\\000`);
        expect(new CharacterString(`"`).present()).to.equal(`\\"`);
        expect(new CharacterString(` a b `).present()).to.equal(`" a b "`);
        expect(new CharacterString(`a " b`).present()).to.equal(`"a \\" b"`);
        expect(new CharacterString(`a\nb`).present()).to.equal(`a\\010b`);
    });
});

describe("test pack()", () => {
    const expected = "000201000001000000000000076578616d706c6503636f6d0000010001";

    it("should pack message", () => {
        const query = Message.unpack(stringToBinary(expected, "hex"));
        expect(query.toString()).to.equal(trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 2
            ;; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;example.com.		IN	A
        `));

        const buf = PacketBuffer.alloc(1024);
        const n = query.pack(buf);

        const actual = binaryToString(buf.freeze(n).slice(), 'hex');
        expect(actual).to.equal(expected);
    });
});
