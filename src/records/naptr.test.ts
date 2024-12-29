import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";
import { RRType } from "../types";

// https://datatracker.ietf.org/doc/html/rfc2915#section-7.1
describe("test NAPTR (ex 1)", () => {
    const input = `cid.urn.arpa.\t\t3600\tIN\tNAPTR\t100 10 "" "" "/urn:cid:.+@([^\\\\.]+\\\\.)(.*)$/\\\\2/i" .`;
    let naptr: RR | undefined;

    it("should parse", () => {
        naptr = parseRecord(input);
        expect(naptr.header.type).to.be.equals(RRType.NAPTR);
    });

    it("should present", () => {
        const out = naptr?.present();
        expect(out).to.be.equals(input);
    });
});

// https://datatracker.ietf.org/doc/html/rfc2915#section-7.2
describe("test NAPTR (ex 2)", () => {
    const input = `cid.urn.arpa.\t\t3600\tIN\tNAPTR\t100 100 "s" "ftp+I2R" "" _ftp._tcp.foo.com.`;
    let naptr: RR | undefined;

    it("should parse", () => {
        naptr = parseRecord(input);
        expect(naptr.header.type).to.be.equals(RRType.NAPTR);
    });

    it("should present", () => {
        const out = naptr?.present();
        expect(out).to.be.equals(input);
    });
});

// https://datatracker.ietf.org/doc/html/rfc2915#section-7.3
describe("test NAPTR (ex 3)", () => {
    const input = `cid.urn.arpa.\t\t3600\tIN\tNAPTR\t100 10 "u" "sip+E2U" "!^.*$!sip:information@tele2.se!" .`;
    let naptr: RR | undefined;

    it("should parse", () => {
        naptr = parseRecord(input);
        expect(naptr.header.type).to.be.equals(RRType.NAPTR);
    });

    it("should present", () => {
        const out = naptr?.present();
        expect(out).to.be.equals(input);
    });
});
