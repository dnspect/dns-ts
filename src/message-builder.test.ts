import { expect } from "chai";
import { MessageBuilder } from "./message-builder";
import { Opcode, RRType, Rcode } from "./types";
import { Address4, Address6 } from "@dnspect/ip-address-ts";
import { NSID } from "./edns";
import { PacketBuffer } from "./buffer";

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

describe("test build full message", () => {
    const mb = new MessageBuilder();

    const header = mb.header();
    header.setId(26584);
    header.setQR(true);
    header.setRD(true);
    header.setRA(true);
    header.setAD(true);
    header.setRcode(Rcode.NOERROR);

    const question = mb.question();
    question.push_in("example.com.", RRType.TXT);

    const answer = mb.answer();
    answer.push_txt("example.com.", 78033, ["v=spf1 -all"]);
    answer.push_txt("example.com.", 78033, ["wgyf8z8cgvm2qmxpnbnldrcltvk4xqfn"]);

    const additional = mb.additional();
    additional.opt((ob) => {
        ob.setDnssecOk(false);
        ob.setUdpPayloadSize(1232);
    });

    const msg = mb.build();

    it("should build message", () => {
        const buf = PacketBuffer.alloc(512);
        const n = msg.pack(buf);
        expect(n).to.equals(131);
        expect(buf.freeze(n).dump("hex")).to.be.equals("67d881a00001000200000001076578616d706c6503636f6d0000100001076578616d706c6503636f6d0000100001000130d1000c0b763d73706631202d616c6c076578616d706c6503636f6d0000100001000130d100212077677966387a386367766d32716d78706e626e6c6472636c74766b347871666e00002904d0000000000000");
    });

    it("should build message (compressed)", () => {
        const msg = mb.build();
        const buf = PacketBuffer.alloc(512).withCompressor();
        const n = msg.pack(buf);
        expect(n).to.equals(109);
        expect(buf.freeze(n).dump("hex")).to.be.equals("67d881a00001000200000001076578616d706c6503636f6d0000100001c00c00100001000130d1000c0b763d73706631202d616c6cc00c00100001000130d100212077677966387a386367766d32716d78706e626e6c6472636c74766b347871666e00002904d0000000000000");
    });

    // 2904d0000000000000
    // 2904d0000080000000
});
