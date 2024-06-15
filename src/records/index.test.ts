import { expect } from "chai";
import { parseRecord, scanRecord } from "./index";
import { ParseError } from "../error";
import { Header } from "../rr";
import { Class, RRType } from "../types";
import { Lexer } from "../scan";

const badInputs = new Map();
badInputs.set("", "missing resource record owner");
badInputs.set("3600 IN A ...", `top-level domain label "3600" should not be numeric`);
badInputs.set(". IN", "missing resource record type");
badInputs.set(". IN A ...", "missing resource record TTL");
badInputs.set(". 3600 A ...", "missing resource record class");
badInputs.set(". 3600 IN A ", "missing RDATA");
badInputs.set(`. 3600 IN A "`, "missing closing quote for the opening quote at col 12");
badInputs.set(`. 3600 IN A """`, `unescaped '"' encountered at ln 1, col 14`);

const goodInputs = new Map();
goodInputs.set(`. 3600 IN A 203.0.113.1`, ".\t\t3600\tIN\tA\t203.0.113.1");
goodInputs.set(`. 3600 IN A "203.0.113.1"`, ".\t\t3600\tIN\tA\t203.0.113.1");
goodInputs.set(`. 3600 IN TXT 1.2 "3.4"`, `.\t\t3600\tIN\tTXT\t"1.2" "3.4"`);
goodInputs.set(`. 3600 IN TXT "1.2 3.4"`, `.\t\t3600\tIN\tTXT\t"1.2 3.4"`);
goodInputs.set(`. 3600 IN TXT "1.2 3.4" ;comment "ignored"`, `.\t\t3600\tIN\tTXT\t"1.2 3.4"`);
goodInputs.set(`. 3600 IN TXT (("1" "2");c12\n3;c3\n4);c4`, `.\t\t3600\tIN\tTXT\t"1" "2" "3" "4"`);

describe("test scanRecord()", () => {
    it("should parse error", () => {
        badInputs.forEach((expected, input) => {
            expect(() => scanRecord(Lexer.from(input), null)).to.throw(ParseError, expected);
        });
    });

    it("should scan", () => {
        goodInputs.forEach((expected, input) => {
            expect(scanRecord(Lexer.from(input), null).toString()).to.be.equals(expected);
        });
    });

    it("should scan with started header", () => {
        const startedHeader = new Header(".", RRType.A, Class.IN, 3600);
        expect(
            scanRecord(Lexer.from(" 3600 IN A 203.0.113.1"), startedHeader).toString()
        ).to.be.equals(".\t\t3600\tIN\tA\t203.0.113.1");
        expect(scanRecord(Lexer.from(" IN A 203.0.113.1"), startedHeader).toString()).to.be.equals(
            ".\t\t3600\tIN\tA\t203.0.113.1"
        );
        expect(scanRecord(Lexer.from(" A 203.0.113.1"), startedHeader).toString()).to.be.equals(
            ".\t\t3600\tIN\tA\t203.0.113.1"
        );
    });
});

describe("test parseRecord()", () => {
    it("should parse error", () => {
        badInputs.forEach((err, input) => {
            expect(() => parseRecord(input)).to.throw(ParseError, err);
        });
    });

    it("should parse", () => {
        goodInputs.forEach((expected, input) => {
            expect(parseRecord(input).toString()).to.be.equals(expected);
        });
    });
});
