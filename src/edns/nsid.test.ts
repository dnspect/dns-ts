import { expect } from "chai";
import { NSID } from "./nsid";
import { OptCode } from "./option";

describe("test construction", () => {
    it("should create nsid from string", () => {
        expect(NSID.fromString("").toString()).to.equal(`; NSID:`);
        expect(NSID.fromString("abc").toString()).to.equal(`; NSID: 61 62 63 ("abc")`);
    });
});

describe("test properties", () => {
    it("should have correct optCode", () => {
        expect(NSID.fromString("").optCode).to.equal(OptCode.NSID);
        expect(NSID.fromString("abc").optCode).to.equal(OptCode.NSID);
    });
});

describe("test parse", () => {
    const dig = `67 70 64 6e 73 2d 73 65 61 ("gpdns-sea")`;
    it("should parse dig", () => {
        expect(NSID.parse(dig).present()).to.equal(`; NSID: ${dig}`);
    });
    it("should parse kdig", () => {
        const kdig = `6770646E732D736561 "gpdns-sea"`;
        expect(NSID.parse(kdig).present()).to.equal(`; NSID: ${dig}`);
    });
});
