import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test NSEC3PARAM", () => {
    const input = `com.\t\t86400\tIN\tNSEC3PARAM\t1 0 0 -`;
    let np: RR | undefined;

    it("should parse", () => {
        np = parseRecord(input);
        expect(np.header.type).to.be.equals(RRType.NSEC3PARAM);
    });

    it("should present", () => {
        const out = np?.present();
        expect(out).to.be.equals(input);
    });
});
