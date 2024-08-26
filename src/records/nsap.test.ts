import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test NSAP", () => {
    const input = `bsdi1.example.\t\t3600\tIN\tNSAP\t0x47.0005.80.005a00.0000.0001.e133.ffffff000161.00`;
    const expected = `bsdi1.example.\t\t3600\tIN\tNSAP\t0x47000580005a0000000001e133ffffff00016100`;
    let nsap: RR | undefined;

    it("should parse", () => {
        nsap = parseRecord(input);
        expect(nsap.header.type).to.be.equals(RRType.NSAP);
    });

    it("should present", () => {
        const out = nsap?.present();
        expect(out).to.be.equals(expected);
    });
});

describe("test NSAPPTR", () => {
    const input = `0.0.0.7.4.NSAP.INT.\t\t3600\tIN\tNSAPPTR\tbsdi1.nsap.nist.gov.`;
    let nsap: RR | undefined;

    it("should parse", () => {
        nsap = parseRecord(input);
        expect(nsap.header.type).to.be.equals(RRType.NSAPPTR);
    });

    it("should present", () => {
        const out = nsap?.present();
        expect(out).to.be.equals(input);
    });
});
