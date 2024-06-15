import { PacketBuffer } from "./buffer";
import { binaryToString, stringToBinary } from "./encoding";
import { Message } from "./message";
import { expect } from "chai";

function trimStart(input: string): string {
    return input.trim().replace(/^ +/gm, "");
}

describe("test pack()", () => {
    const expected = "000201000001000000000000076578616d706c6503636f6d0000010001";

    it("should pack message", () => {
        const query = Message.unpack(stringToBinary(expected, "hex"));
        expect(query.toString()).to.equal(
            trimStart(`
            ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 2
            ;; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0

            ;; QUESTION SECTION:
            ;example.com.		IN	A
        `)
        );

        const buf = PacketBuffer.alloc(1024);
        const n = query.pack(buf);

        const actual = binaryToString(buf.freeze(n).slice(), "hex");
        expect(actual).to.equal(expected);
    });
});
