import { stringToBinary, binaryToString } from "../encoding";
import { ParseError } from "../error";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { CharacterString } from "../char";
import { Uint16, Uint8 } from "../types";

/**
 * The DHCID (DHCP Identifier) record is used to associate a DHCP client identity with a domain name.
 *
 * The record contains a digest generated from the client's identifier and FQDN,
 * ensuring only the rightful DHCP client can update the DNS entry.
 *
 * RDATA format (RFC 4701):
 * ```
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |    identifier type (16 bits)  |  digest type  |               |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+               +
 * |                        digest (binary)                        |
 * |                                                               |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4701 | RFC 4701}
 */
export class DHCID extends RR {
    identifierType!: Uint16; // 2 bytes
    digestType!: Uint8;      // 1 byte
    digest!: Uint8Array;     // variable length

    unpackRdata(rdata: Slice): void {
        this.identifierType = rdata.readUint16();
        this.digestType = rdata.readUint8();
        this.digest = rdata.readUint8Array();
    }

    packRdata(buf: Writer): number {
        let n = buf.writeUint16(this.identifierType);
        n += buf.writeUint8(this.digestType);
        n += buf.write(this.digest);
        return n;
    }

    parseRdata(rdata: CharacterString[]): void {
        if (rdata.length === 0) {
            throw new ParseError("Missing fields in DHCID RDATA");
        }

        const str = rdata.reduce((v, cur) => v += cur.raw(), "");
        const data = stringToBinary(str, "base64");

        // At lease has 3 bytes, the first two bytes is the identifier type and
        // the third one is digest type.
        if (data.byteLength < 3) {
            throw new ParseError("Invalid DHCID RDATA");
        }

        this.identifierType = (data[0] << 8) | data[1];
        this.digestType = data[2];

        this.digest = data.slice(3);
    }

    presentRdata(): string {
        const data = new Uint8Array(3 + this.digest.byteLength);
        data[0] = this.identifierType >>> 8;
        data[1] = this.identifierType & 0xff;
        data[2] = this.digestType;
        data.set(this.digest, 3);
        return binaryToString(data, "base64");
    }
}
