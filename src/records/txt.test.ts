import { expect } from "chai";
import { TXT } from "./txt";
import { Header } from "../rr";
import { Class, RRType } from "../types";
import { CharacterString } from "../char";

describe("test stringify", () => {
    const txt = new TXT(new Header('example.com', RRType.TXT, Class.IN, 300));
    txt.content = [new CharacterString('abc'), new CharacterString('d "hi" e')];

    it("should generate dns-json object", () => {
        expect(JSON.stringify(txt.toJsonObject())).to.be.equal(JSON.stringify({
            "name": "example.com.",
            "type": 16,
            "TTL": 300,
            "data": String.raw`"abc" "d \"hi\" e"`,
        }));
    });

    it("should generate dig-like text", () => {
        expect(txt.toString()).to.be.equal('example.com.\t\t300\tIN\tTXT\t"abc" "d \\"hi\\" e"');
    });
});
