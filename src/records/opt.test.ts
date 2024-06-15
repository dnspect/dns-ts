import { expect } from "chai";
import { OptHeader } from "./";
import { Rcode } from "../types";

describe("test OptHeader", () => {
    it("should parse dig", () => {
        const input = `EDNS: version: 0, flags: do; udp: 512`;
        const oh = OptHeader.parse(input);
        expect(oh.version()).to.be.equals(0);
        expect(oh.dnssecOk()).to.be.true;
        expect(oh.udpPayloadSize()).to.be.equals(512);
        expect(oh.extendedRcode()).to.be.equals(Rcode.NOERROR);
    });

    it("should parse kdig", () => {
        const input = `Version: 0; flags:; UDP size: 1232 B; ext-rcode: REFUSED`;
        const oh = OptHeader.parse(input);
        expect(oh.version()).to.be.equals(0);
        expect(oh.dnssecOk()).to.be.false;
        expect(oh.udpPayloadSize()).to.be.equals(1232);
        expect(oh.extendedRcode()).to.be.equals(Rcode.REFUSED);
    });

    it("should present", () => {
        const expected = `; EDNS: version: 1, flags: do; udp: 1232`;
        const oh = new OptHeader();
        oh.setVersion(1);
        oh.setDnssecOk(true);
        oh.setExtendedRcode(Rcode.REFUSED);
        oh.setUdpPayloadSize(1232);

        expect(oh.present()).to.be.equals(expected);
    });
});
