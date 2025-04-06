import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test DHCID", () => {
    // https://datatracker.ietf.org/doc/html/rfc4701#section-3.6
    const examples = [
        // Example 1: DHCPv6 client identifier with FQDN "chi6.example.com"
        [
            `chi6.example.com. 3600 IN DHCID ( AAIBY2/AuCccgoJbsaxcQc9TUapptP69l
                                     OjxfNuVAA2kjEA= )`,
            `chi6.example.com.\t\t3600\tIN\tDHCID\tAAIBY2/AuCccgoJbsaxcQc9TUapptP69lOjxfNuVAA2kjEA=`,
        ],
        // Example 2: DHCP client-identifier option (IPv4 client) with FQDN "chi.example.com"
        [
            `chi.example.com. 3600 IN DHCID ( AAEBOSD+XR3Os/0LozeXVqcNc7FwCfQdW
                                     L3b/NaiUDlW2No= )`,
            `chi.example.com.\t\t3600\tIN\tDHCID\tAAEBOSD+XR3Os/0LozeXVqcNc7FwCfQdWL3b/NaiUDlW2No=`,
        ],
        // Example 3: MAC address as identity with FQDN "client.example.com"
        [
            `client.example.com. 3600 IN DHCID ( AAABxLmlskllE0MVjd57zHcWmEH3pCQ6V
                                     ytcKD//7es/deY= )`,
            `client.example.com.\t\t3600\tIN\tDHCID\tAAABxLmlskllE0MVjd57zHcWmEH3pCQ6VytcKD//7es/deY=`,
        ],
    ];

    for (const i in examples) {
        let record: RR | undefined;

        it(`should parse DHCID example ${+i + 1}`, () => {
            record = parseRecord(examples[i][0]);
            expect(record.header.type).to.equal(RRType.DHCID);
        });

        it(`should present DHCID example ${+i + 1}`, () => {
            const out = record?.present();
            expect(out).to.equal(examples[i][1]);
        });
    }
});
