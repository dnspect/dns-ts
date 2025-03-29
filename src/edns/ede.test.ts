import { expect } from "chai";
import { ExtendedError, ExtendedErrorCode } from "./ede";

describe("test construction", () => {
    it("should fail to create EDE", () => {
        expect(() => ExtendedError.fromData([0])).to.throw(Error, `try to access beyond buffer length: read 2 start from 0`);
    });

    it("should create EDE from data", () => {
        expect(ExtendedError.fromData([0, 1]).toString()).to.equal(`; EDE: 1 (Unsupported DNSKEY Algorithm)`);
        expect(ExtendedError.fromData([0, 1, 65]).toString()).to.equal(`; EDE: 1 (Unsupported DNSKEY Algorithm): (A)`);
    });

    it("should create EDE from code", () => {
        expect(ExtendedError.fromCode(ExtendedErrorCode.OtherError).toString()).to.equal(`; EDE: 0 (Other Error)`);
        expect(ExtendedError.fromCode(ExtendedErrorCode.OtherError, "custom").toString()).to.equal(
            `; EDE: 0 (Other Error): (custom)`
        );
    });
});

describe("test parse", () => {
    const dig = `49152 (Unknown Code): (blabla. https://foo.bar/)`;
    it("should parse dig", () => {
        expect(ExtendedError.parse(dig).present()).to.equal(`; EDE: ${dig}`);
    });
    it("should parse kdig", () => {
        const kdig = `49152 (Unknown Code): 'blabla. https://foo.bar/'`;
        expect(ExtendedError.parse(kdig).present()).to.equal(`; EDE: ${dig}`);
    });
});
