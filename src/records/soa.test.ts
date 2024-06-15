import { expect } from "chai";
import { parseRecord } from ".";
import { RR } from "../rr";

describe("test SOA", () => {
    const input = `.\t\t86400\tIN\tSOA\ta.root-servers.net. nstld.verisign-grs.com. 2024061600 1800 900 604800 86400`;
    let soa: RR | undefined;

    it("should parse", () => {
        soa = parseRecord(input);
        expect(soa.header.name.isRoot()).to.be.true;
    });

    it("should present", () => {
        const out = soa?.present();
        expect(out).to.be.equals(input);
    });
});
