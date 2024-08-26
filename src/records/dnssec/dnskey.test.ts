import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test DNSKEY", () => {
    const input = `com.\t\t9975\tIN\tDNSKEY\t256 3 13 cCRwZIITlPXwDm0yKpGVYSmWLL4OpEHxA7+Rt3jS0W1N4EMOaF8doSzrJuM7aDbgAR7jtQ9SNCvYZCH2xSyfaQ==`;
    let dk: RR | undefined;

    it("should parse", () => {
        dk = parseRecord(input);
        expect(dk.header.type).to.be.equals(RRType.DNSKEY);
    });

    it("should present", () => {
        const out = dk?.present();
        expect(out).to.be.equals(input);
    });
});

describe("test KEY", () => {
    const input = `com.\t\t9975\tIN\tKEY\t256 3 13 cCRwZIITlPXwDm0yKpGVYSmWLL4OpEHxA7+Rt3jS0W1N4EMOaF8doSzrJuM7aDbgAR7jtQ9SNCvYZCH2xSyfaQ==`;
    let key: RR | undefined;

    it("should parse", () => {
        key = parseRecord(input);
        expect(key.header.type).to.be.equals(RRType.KEY);
    });

    it("should present", () => {
        const out = key?.present();
        expect(out).to.be.equals(input);
    });
});
