import { expect } from "chai";
import { ClientSubnet } from "./client-subnet";
import { Prefix } from "@dnspect/ip-address-ts";

describe("test construction", () => {
    it("should fail to create client-subnet", () => {
        expect(() => ClientSubnet.from([0, 0, 0, 0])).to.throw(Error, `invalid address family: 0`);
        expect(() => ClientSubnet.from([0, 3, 0, 0])).to.throw(Error, `invalid address family: 3`);
        expect(() => ClientSubnet.from([0, 1])).to.throw(Error, `insufficient bytes remaining for read: needs 1, have 0`);
        expect(() => ClientSubnet.from([0, 1, 0, 0])).to.throw(Error, `insufficient bytes remaining for read: needs 4, have 0`);
        expect(() => ClientSubnet.from([0, 2, 0, 0])).to.throw(Error, `insufficient bytes remaining for read: needs 16, have 0`);
        expect(() => ClientSubnet.from([0, 1, 33, 0, 0, 0, 0, 0])).to.throw(Error, `invalid source prefix length 33 for address family 1`);
        expect(() => ClientSubnet.from([0, 1, 24, 33, 0, 0, 0, 0])).to.throw(Error, `invalid scope prefix length 33 for address family 1`);
    });

    it("should create client-subnet from data", () => {
        expect(ClientSubnet.from([0, 1, 24, 12, 1, 2, 3, 0]).toString()).to.equal(`; CLIENT-SUBNET: 1.2.3.0/24/12`);
    });

    it("should create client-subnet from IP prefix", () => {
        expect(ClientSubnet.fromPrefix(Prefix.parse('1.2.3.0/24')).toString()).to.equal(`; CLIENT-SUBNET: 1.2.3.0/24/0`);
    });
});

describe("test properties", () => {
    it("should have correct optCode", () => {
        expect(ClientSubnet.from([0, 1, 24, 0, 1, 2, 3, 0]).sourcePrefixLength).to.equal(24);
        expect(ClientSubnet.from([0, 1, 24, 12, 1, 2, 3, 0]).scopePrefixLength).to.equal(12);
    });
});
