import { expect } from "chai";
import { CharacterString, QuoteMode } from "./char";

describe("test CharacterString()", () => {
    it("should empty", () => {
        expect(new CharacterString(``).present()).to.be.empty;
    });

    it("should quote", () => {
        [" ", "(", ")", ";", "@"].forEach((ch) => {
            expect(new CharacterString(ch).present()).to.equal(`"${ch}"`);
        });

        ["", "a", "b"].forEach((ch) => {
            expect(new CharacterString(ch).present(QuoteMode.Always)).to.equal(`"${ch}"`);
        });
    });

    it("should \\X escape", () => {
        ['"', "\\"].forEach((ch) => {
            expect(new CharacterString(ch).present(), "need \\X escape").to.equal(`\\${ch}`);
        });

        ["(", ")", ";", "@"].forEach((ch) => {
            expect(new CharacterString(ch).present(QuoteMode.Never)).to.equal(`\\${ch}`);
        });

        expect(new CharacterString(String.raw`" a \ b`).present()).to.equal(String.raw`"\" a \\ b"`);
    });

    it("should \\DDD escape", () => {
        expect(new CharacterString(` `).present(QuoteMode.Never)).to.equal(String.raw`\032`);
        expect(new CharacterString(`\0`).present()).to.equal(String.raw`\000`);
        expect(new CharacterString(`a\nb\t`).present()).to.equal(String.raw`a\010b\009`);
    });
});
