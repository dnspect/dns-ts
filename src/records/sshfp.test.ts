import { expect } from "chai";
import { parseRecord } from "./";
import { RR } from "../rr";
import { RRType } from "../types";

describe("test SSHFP", () => {
    const input = `host.example.com.\t\t3600\tIN\tSSHFP\t4 2 123456789abcdef67890123456789abcdef67890123456789abcdef123456789`;
    let np: RR | undefined;

    it("should parse", () => {
        np = parseRecord(input);
        expect(np.header.type).to.be.equals(RRType.SSHFP);
    });

    it("should present", () => {
        const out = np?.present();
        expect(out).to.be.equals(input);
    });
});
