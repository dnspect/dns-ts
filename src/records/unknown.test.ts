import { expect, use } from "chai";
import { Unknown } from "./unknown";
import { Header } from "../rr";
import { Class, RRType } from "../types";
import { stringToBinary } from "../encoding";
import { A, parseRecord } from ".";
import chaibytes from "chai-bytes";

use(chaibytes);

describe("test stringify", () => {
    const unknown = new Unknown(new Header('example.com', 62347 as RRType, 32 as Class, 300));
    unknown.data = stringToBinary("0A000001", "hex");
    it("should generate dns-json object", () => {
        expect(JSON.stringify(unknown.toJsonObject())).to.be.equal(JSON.stringify({
            "name": "example.com.",
            "class": 32,
            "type": 62347,
            "TTL": 300,
            "data": String.raw`\# 4 0a000001`,
        }));
    });
    it("should generate dig-like text", () => {
        expect(unknown.toString()).to.be.equal('example.com.\t\t300\tCLASS32\tTYPE62347\t\\# 4 0a000001');
    });
});

describe("test RFC-3597 examples", () => {
    it("should parse example 01", () => {
        const header = new Header('a.example', 731 as RRType, 32 as Class, 300);
        const rdata = new Uint8Array([0xab, 0xcd, 0xef, 0x01, 0x23, 0x45]);
        const actual = parseRecord(`a.example.     300 CLASS32 TYPE731 \\# 6 abcd (
                                                            ef 01 23 45 )`);
        expect(actual).to.be.an.instanceOf(Unknown);
        expect(actual.header.same(header)).to.be.true;
        expect((actual as Unknown).data).to.equalBytes(rdata);
    });

    it("should parse example 02", () => {
        const header = new Header('b.example', 62347 as RRType, Class.HS, 300);
        const rdata = new Uint8Array(0);
        const actual = parseRecord(`b.example.\t\t300\tHS\tTYPE62347\t\\# 0`);
        expect(actual).to.be.an.instanceOf(Unknown);
        expect(actual.header.same(header)).to.be.true;
        expect((actual as Unknown).data).to.equalBytes(rdata);
    });

    it("should parse example 03", () => {
        const header = new Header('e.example', RRType.A, Class.IN, 300);
        const addressBytes = [10, 0, 0, 1];
        const actual = parseRecord(`e.example.\t\t300\tIN\tA\t\\# 4 0A000001`);
        expect(actual).to.be.an.instanceOf(A);
        expect(actual.header.same(header)).to.be.true;
        expect((actual as A).address.bytes()).to.equalBytes(addressBytes);
    });

    it("should parse example 04", () => {
        const header = new Header('e.example', RRType.A, Class.IN, 300);
        const addressBytes = [10, 0, 0, 2];
        const actual = parseRecord(`e.example.\t\t300\tCLASS1\tTYPE1\t10.0.0.2`);
        expect(actual).to.be.an.instanceOf(A);
        expect(actual.header.same(header)).to.be.true;
        expect((actual as A).address.bytes()).to.equalBytes(addressBytes);
    });
});
