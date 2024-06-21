import { expect } from "chai";
import { TypeBitMaps } from "./type-bitmaps";
import { RRType } from "../../types";
import { Slice } from "../../packet";
import { stringToBinary } from "../../encoding";
import { PacketBuffer } from "../../buffer";

describe("test TypeBitMaps", () => {
    it("should parse()", () => {
        expect(TypeBitMaps.parse("").toString()).to.be.empty;
        expect(TypeBitMaps.parse("A TXT CNAME").toString()).to.be.equals("A TXT CNAME");
    });

    it("should unpack", () => {
        const s = Slice.from(stringToBinary("00 08 22 00 00 00 00 03 80 01", "hex-ws"));
        const bitmap = TypeBitMaps.unpack(s);
        expect(bitmap.toString()).to.be.equals("NS SOA RRSIG NSEC DNSKEY ZONEMD");
    });

    it("should pack", () => {
        const types = [RRType.NS, RRType.SOA, RRType.RRSIG, RRType.NSEC, RRType.DNSKEY, RRType.ZONEMD];
        const bitmap = new TypeBitMaps(types);

        const buf = PacketBuffer.alloc(512);
        const n = bitmap.pack(buf);
        const actual = buf.freeze(n).dump("hex-ws");
        expect(actual).to.be.equals("00 08 22 00 00 00 00 03 80 01");
    });
});




// 40 05 00 0c 54 0b 0d 04 c0 01 01 c0
// A HINFO MX AAAA LOC SRV NAPTR CERT SSHFP RRSIG NSEC TLSA SMIMEA HIP OPENPGPKEY SVCB HTTPS URI CAA
