import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test DS", () => {
    const examples = [
        // https://datatracker.ietf.org/doc/html/rfc4034#section-5.4
        [
            `dskey.example.com. 86400 IN DS 60485 5 1 ( 2BB183AF5F22588179A53B0A
                                              98631FAD1A292118 ) ;  key id = 60485`,
            `dskey.example.com.\t\t86400\tIN\tDS\t60485 5 1 2BB183AF5F22588179A53B0A98631FAD1A292118`,
        ],
        // https://datatracker.ietf.org/doc/html/rfc4509#section-2.3
        [
            `dskey.example.com. 86400 IN DS 60485 5 2   ( D4B7D520E7BB5F0F67674A0C
                                                CEB1E3E0614B93C4F9E99B83
                                                83F6A1E4469DA50A ) ;  key id = 60485`,
            `dskey.example.com.\t\t86400\tIN\tDS\t60485 5 2 D4B7D520E7BB5F0F67674A0CCEB1E3E0614B93C4F9E99B8383F6A1E4469DA50A`,
        ]
    ];

    for (const ex of examples) {
        let ds: RR | undefined;

        it("should parse", () => {
            ds = parseRecord(ex[0]);
            expect(ds.header.type).to.be.equals(RRType.DS);
        });

        it("should present", () => {
            const out = ds?.present();
            expect(out).to.be.equals(ex[1]);
        });
    }
});
