import { expect } from "chai";
import { PacketBuffer } from "./buffer";
import { IN_ADDR_ARPA_ZONE, IP6_ARPA_ZONE, ROOT_ZONE } from "./fqdn";

describe("test PacketBuffer()", () => {
    it("should construct", () => {
        expect(() => PacketBuffer.alloc(1024)).to.not.throw;
        expect(() => PacketBuffer.from(new Uint8Array())).to.not.throw;
    });
});

describe("test Reader implementation", () => {
    // TODO
});

describe("test writeName()", () => {
    it("should compress names", () => {
        const buf = PacketBuffer.alloc(1024).withCompressor();

        expect(buf.writeName(ROOT_ZONE, false)).to.equals(1);
        expect(buf.writeName(ROOT_ZONE, true)).to.equals(1);
        expect(buf.writeName(IN_ADDR_ARPA_ZONE, true)).to.equals(14);
        expect(buf.writeName(IP6_ARPA_ZONE, true)).to.equals(6);
        expect(buf.writeName(IP6_ARPA_ZONE, true)).to.equals(2);
        expect(buf.writeName(IP6_ARPA_ZONE, false)).to.equals(10);
    });
});
