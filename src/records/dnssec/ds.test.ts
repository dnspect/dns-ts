import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test DS", () => {
    const input = `com.\t\t86400\tIN\tDS\t19718 13 2 8ACBB0CD28F41250A80A491389424D341522D946B0DA0C0291F2D3D771D7805A`;
    let ds: RR | undefined;

    it("should parse", () => {
        ds = parseRecord(input);
        expect(ds.header.type).to.be.equals(RRType.DS);
    });

    it("should present", () => {
        const out = ds?.present();
        expect(out).to.be.equals(input);
    });
});
