import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test APL", () => {
    // https://datatracker.ietf.org/doc/html/rfc3123#section-8
    const examples = [
        // ; RFC 1101-like announcement of address ranges for foo.example
        `foo.example.\t\t3600\tIN\tAPL\t1:192.168.32.0/21 !1:192.168.38.0/28`,
        // ; CIDR blocks covered by classless delegation
        `42.168.192.in-addr.arpa.\t\t3600\tIN\tAPL\t1:192.168.42.0/26 1:192.168.42.64/26 1:192.168.42.128/25`,
        // ; Zone transfer restriction
        `_axfr.sbo.example.\t\t3600\tIN\tAPL\t1:127.0.0.1/32 1:172.16.64.0/22`,
        // ; List of address ranges for multicast
        `multicast.example.\t\t3600\tIN\tAPL\t1:224.0.0.0/4 2:ff00::/8`,
    ]
    for (const i in examples) {
        let apl: RR | undefined;

        it(`should parse ex ${i + 1}`, () => {
            apl = parseRecord(examples[i]);
            expect(apl.header.type).to.be.equals(RRType.APL);
        });

        it(`should present ex ${i + 1}`, () => {
            const out = apl?.present();
            expect(out).to.be.equals(examples[i]);
        });
    }
});
