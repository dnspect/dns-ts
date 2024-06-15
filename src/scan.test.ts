import { expect } from "chai";
import { Lexer, scanHeader, scanRdata } from "./scan";
import { ParseError } from "./error";
import { Header } from "./rr";
import { Class, RRType } from "./types";
import { ROOT_ZONE } from "./fqdn";

describe("test Lexer", () => {
    it("should error", () => {
        expect(() => Lexer.from(String.raw`\0`).next()).to.throw(
            ParseError,
            "bad \\DDD escape encountered at ln 1, col 2"
        );
        expect(() => Lexer.from(String.raw`\00`).next()).to.throw(
            ParseError,
            "bad \\DDD escape encountered at ln 1, col 2"
        );
        expect(() => Lexer.from(String.raw`\00a`).next()).to.throw(
            ParseError,
            "bad \\DDD escape encountered at ln 1, col 2"
        );
        expect(() => Lexer.from(`\\${String.fromCharCode(0)}`).next()).to.throw(
            ParseError,
            "bad \\X escape encountered at ln 1, col 2"
        );
    });

    it("should get token", () => {
        const lexer = Lexer.from(` "abc def"(;note    \n   "z")`);
        expect(lexer.next().toString()).to.be.equal("Blank");
        expect(lexer.next().toString()).to.be.equal("String(abc def)");
        expect(lexer.next().toString()).to.be.equal("OpenParen");
        expect(lexer.next().toString()).to.be.equal("Comment(note)");
        expect(lexer.next().toString()).to.be.equal("Newline");
        expect(lexer.next().toString()).to.be.equal("Blank");
        expect(lexer.next().toString()).to.be.equal("String(z)");
        expect(lexer.next().toString()).to.be.equal("CloseParen");
        expect(lexer.next().toString()).to.be.equal("EOF");
        expect(lexer.next().toString()).to.be.equal("EOF");
    });
});

describe("test scanHeader()", () => {
    it("should error", () => {
        expect(() => scanHeader(Lexer.from(""))).to.throw(ParseError, "missing resource record owner");
        expect(() => scanHeader(Lexer.from(". IN A"))).to.throw(ParseError, "missing resource record TTL");
        expect(() => scanHeader(Lexer.from(". 3600 A"))).to.throw(ParseError, "missing resource record class");
        expect(() => scanHeader(Lexer.from(". 3600 IN "))).to.throw(ParseError, "missing resource record type");
        expect(() => scanHeader(Lexer.from(". 3600 IN INVALID"))).to.throw(
            ParseError,
            "invalid resource record type: INVALID"
        );
    });

    it("should get header", () => {
        expect(scanHeader(Lexer.from(String.raw`. 3600 IN A`)).same(new Header(ROOT_ZONE, RRType.A, Class.IN, 3600))).to
            .be.true;
        expect(
            scanHeader(Lexer.from(String.raw`:<>%{}|^\`?/.a-b\009\010k\@#\(\032\)\".test. 3600 IN A`)).same(
                new Header(`:<>%{}|^\`?/.a-b\t\nk@#( )".test.`, RRType.A, Class.IN, 3600)
            )
        ).to.be.true;
    });
});

describe("test scanRdata()", () => {
    it("should error", () => {
        expect(() => scanRdata(Lexer.from(")"))).to.throw(ParseError, "open parenthesis is missing");
        expect(() => scanRdata(Lexer.from("("))).to.throw(ParseError, "close parenthesis is missing");
    });

    it("should get RDATA", () => {
        expect(scanRdata(Lexer.from(""))).to.have.ordered.members([]);
        expect(scanRdata(Lexer.from(" \t"))).to.have.ordered.members([]);
        expect(scanRdata(Lexer.from(" \t a (\n b)\n c")).map((cs) => cs.raw())).to.have.ordered.members(["a", "b"]);
        expect(
            scanRdata(
                Lexer.from(`NSEC 5 1 3600 20040509183619 (
                              20040409183619 38519 example.
                              O0k558jHhyrC97ISHnislm4kLMW48C7U7cBm;comment1
                              FTfhke5iVqNRVTB1STLMpgpbDIC9hcryoO0V ;comment2
                              Z9ME5xPzUEhbvGnHd5sfzgFVeGxr5Nyyq4tW ; comment3
                              SDBgIBiLQUv1ivy29vhXy7WgR62dPrZ0PWvm ;\tcomment4
                              jfFJ5arXf4nPxp/kEowGgBRzY/U= );comment5`)
            ).map((cs) => cs.raw())
        ).to.have.ordered.members([
            "NSEC",
            "5",
            "1",
            "3600",
            "20040509183619",
            "20040409183619",
            "38519",
            "example.",
            "O0k558jHhyrC97ISHnislm4kLMW48C7U7cBm",
            "FTfhke5iVqNRVTB1STLMpgpbDIC9hcryoO0V",
            "Z9ME5xPzUEhbvGnHd5sfzgFVeGxr5Nyyq4tW",
            "SDBgIBiLQUv1ivy29vhXy7WgR62dPrZ0PWvm",
            "jfFJ5arXf4nPxp/kEowGgBRzY/U=",
        ]);
    });
});
