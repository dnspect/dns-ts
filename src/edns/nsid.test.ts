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
