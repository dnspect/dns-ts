import { expect } from "chai";
import { Question } from "./question";
import { FQDN } from "./fqdn";
import { Class, RRType } from "./types";
import { ParseError } from "./error";

describe("test stringify", () => {
    const q = new Question(FQDN.parse("example.com"), RRType.AAAA, Class.IN);

    it("should get string", () => {
        expect(q.toString()).to.be.equal("example.com.\t\tIN\tAAAA");
    });

    it("should get dig-like text", () => {
        expect(q.present()).to.be.equal(";example.com.\t\tIN\tAAAA");
    });

    it("should get dns-json object", () => {
        expect(JSON.stringify(q.toJsonObject())).to.be.equal(JSON.stringify({ name: "example.com.", type: 28 }));
    });
});

describe("test parse", () => {
    it("should error", () => {
        expect(() => Question.parse("")).to.throw(ParseError, "invalid question: ");
        expect(() => Question.parse(".")).to.throw(ParseError, "invalid question: ");
        expect(() => Question.parse(". IN")).to.throw(ParseError, "invalid question: ");
        expect(() => Question.parse(". XX A")).to.throw(ParseError, "invalid QCLASS: XX");
        expect(() => Question.parse(". IN XX")).to.throw(ParseError, "invalid QTYPE: XX");
    });

    it("should parse", () => {
        expect(Question.parse(". IN A").toString()).to.be.equal(".\t\tIN\tA");
    });
});
