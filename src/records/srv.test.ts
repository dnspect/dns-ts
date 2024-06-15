import { expect } from "chai";
import { parseRecord } from "./";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test SRV", () => {
    const input = `_foobar._tcp.example.com.\t\t3600\tIN\tSRV\t0 1 9 old-slow-box.example.com.`;
    let srv: RR | undefined;

    it("should parse", () => {
        srv = parseRecord(input);
        expect(srv.header.type).to.be.equals(RRType.SRV);
    });

    it("should present", () => {
        const out = srv?.present();
        expect(out).to.be.equals(input);
    });
});
