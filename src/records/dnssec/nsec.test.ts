import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test NSEC", () => {
    const input = `com.\t\t86400\tIN\tNSEC\tcommbank. NS DS RRSIG NSEC`;
    let nsec: RR | undefined;

    it("should parse", () => {
        nsec = parseRecord(input);
        expect(nsec.header.type).to.be.equals(RRType.NSEC);
    });

    it("should present", () => {
        const out = nsec?.present();
        expect(out).to.be.equals(input);
    });
});
