import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test NSEC3", () => {
    const input = `CK0POJMG874LJREF7EFN8430QVIT8BSM.com.\t\t86400\tIN\tNSEC3\t1 1 0 - CK0Q2D6NI4I7EQH8NA30NS61O48UL8G5 NS SOA RRSIG DNSKEY NSEC3PARAM`;
    let nsec3: RR | undefined;

    it("should parse", () => {
        nsec3 = parseRecord(input);
        expect(nsec3.header.type).to.be.equals(RRType.NSEC3);
    });

    it("should present", () => {
        const out = nsec3?.present();
        expect(out).to.be.equals(input);
    });
});
