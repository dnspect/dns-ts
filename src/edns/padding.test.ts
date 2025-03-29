import { expect } from "chai";
import { Padding } from "./padding";

describe("test construction", () => {
    it("should create padding from requested size", () => {
        expect(new Padding(0).toString()).to.equal(`; PADDING: 0`);
        expect(new Padding(10).toString()).to.equal(`; PADDING: 10`);
    });
});

describe("test parse", () => {
    const dig = `5`;
    const kdig = `5 B`;

    it("should parse dig", () => {
        expect(Padding.parse(dig).present()).to.equal(`; PADDING: ${dig}`);
    });

    it("should parse kdig", () => {
        expect(Padding.parse(kdig).present()).to.equal(`; PADDING: ${dig}`);
    });
});
