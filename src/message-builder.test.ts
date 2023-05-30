import { expect } from "chai";
import { MessageBuilder } from "./message-builder";
import { Opcode, RRType, Rcode } from "./types";
import { Address4, Address6 } from "@dnspect/ip-address-ts";
import { NSID } from "./edns";

describe("test build message header", () => {
    const mb = new MessageBuilder();
    const hb = mb.header();

    it("should header have zero values", () => {
        const msg = mb.build();

        expect(msg.header.id).to.equal(0);
        expect(msg.header.isQuery()).to.true;
        expect(msg.header.isResponse()).to.false;
        expect(msg.header.opcode()).to.equal(Opcode.QUERY);
        expect(msg.header.rcode()).to.equal(Rcode.NOERROR);
        expect(msg.header.qdCount).to.equal(0);
    });

    it("should set random identifier", () => {
        hb.randomId();
        const msg = mb.build();

        expect(msg.header.id).to.gt(0);
    });

    it("should build header", () => {
        hb.randomId();
        hb.setRcode(Rcode.NXDOMAIN);
        hb.setQR(true);
        const msg = mb.build();

        expect(msg.header.id).to.gt(0);
        expect(msg.header.isQuery()).to.false;
        expect(msg.header.isResponse()).to.true;
        expect(msg.header.rcode()).to.equal(Rcode.NXDOMAIN);
    });
});

describe("test build questions", () => {
    const mb = new MessageBuilder();
    const qb = mb.question();

    it("should build nothing in question section", () => {
        const msg = mb.build();
        expect(msg.header.qdCount).to.equal(0);
        expect(msg.firstQuestion()).to.null;
    });

    it("should build one question", () => {
        qb.push_in("example.com", RRType.A);
        const msg = mb.build();

        expect(msg.header.qdCount).to.equal(1);
        expect(msg.question.length).to.equal(1);
        expect(msg.question[0].toString()).to.equal(`;example.com.\t\tIN\tA`);
    });

    it("should build two questions", () => {
        qb.push_in("www.example.com", RRType.AAAA);
        const msg = mb.build();

        expect(msg.header.qdCount).to.equal(2);
        expect(msg.question.length).to.equal(2);
        expect(msg.question[0].toString()).to.equal(`;example.com.\t\tIN\tA`);
        expect(msg.question[1].toString()).to.equal(`;www.example.com.\t\tIN\tAAAA`);
    });
});

describe("test build answers", () => {
    const mb = new MessageBuilder();
    const ab = mb.answer();

    it("should build nothing in answer section", () => {
        const msg = mb.build();
        expect(msg.header.anCount).to.equal(0);
        expect(msg.answer.length()).to.equal(0);
    });

    it("should build one record", () => {
        ab.push_a("example.com", 3600, Address4.parse("203.0.113.1"));
        const msg = mb.build();

        expect(msg.header.anCount).to.equal(1);
        expect(msg.answer.length()).to.equal(1);
        expect(msg.answer.last()?.toString()).to.equal(`example.com.\t\t3600\tIN\tA\t203.0.113.1`);
    });

    it("should build two records", () => {
        ab.push_a("example.com", 3600, Address4.parse("203.0.113.2"));
        const msg = mb.build();

        expect(msg.header.anCount).to.equal(2);
        expect(msg.answer.length()).to.equal(2);
        expect(msg.answer.first()?.toString()).to.equal(`example.com.\t\t3600\tIN\tA\t203.0.113.1`);
        expect(msg.answer.last()?.toString()).to.equal(`example.com.\t\t3600\tIN\tA\t203.0.113.2`);
    });
});

describe("test build additional", () => {
    const mb = new MessageBuilder();
    const ar = mb.additional();

    it("should build nothing in additional section", () => {
        const msg = mb.build();
        expect(msg.header.arCount).to.equal(0);
        expect(msg.additional.length()).to.equal(0);
    });

    it("should build one record", () => {
        ar.push_a("example.com", 3600, Address4.parse("203.0.113.1"));
        const msg = mb.build();

        expect(msg.header.arCount).to.equal(1);
        expect(msg.additional.length()).to.equal(1);
        expect(msg.additional.last()?.toString()).to.equal(`example.com.\t\t3600\tIN\tA\t203.0.113.1`);
    });

    it("should build two records", () => {
        ar.push_aaaa("example.com", 3600, Address6.parse("2001:db8::1"));
        const msg = mb.build();

        expect(msg.header.arCount).to.equal(2);
        expect(msg.additional.length()).to.equal(2);
        expect(msg.additional.first()?.toString()).to.equal(`example.com.\t\t3600\tIN\tA\t203.0.113.1`);
        expect(msg.additional.last()?.toString()).to.equal(`example.com.\t\t3600\tIN\tAAAA\t2001:db8::1`);
    });

    it("should build OPT record", () => {
        ar.opt((ob) => {
            ob.setDnssecOk(true);
            ob.setUdpPayloadSize(1232);
            ob.push(NSID.fromString("abc"));
        });

        const msg = mb.build();

        expect(msg.header.arCount).to.equal(3);
        expect(msg.additional.length()).to.equal(3);
        expect(msg.additional.last()?.toString()).to.equal(`; EDNS: version: 0, flags: do; udp: 1232\n; NSID: 61 62 63 ("abc")`);
    });
});
