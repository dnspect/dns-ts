import { Writer } from "../../buffer";
import { binaryToString } from "../../encoding";
import { ParseError } from "../../error";
import { CharacterString } from "../../char";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { Uint16, Uint8 } from "../../types";
import { SecurityAlgorithm } from "./algorithm";

/**
 * A zone signs its authoritative RRsets by using a private key and stores the corresponding public
 * key in a DNSKEY RR.
 *
 * A resolver can then use the public key to validate signatures covering the RRsets in the zone,
 * and thus to authenticate them.
 *
 * The DNSKEY RR is not intended as a record for storing arbitrary public keys and MUST NOT be used
 * to store certificates or public keys that do not directly relate to the DNS infrastructure.
 *
 * RDATA wire format:
 * ```
 *
 *                      1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |              Flags            |    Protocol   |   Algorithm   |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * /                                                               /
 * /                            Public Key                         /
 * /                                                               /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#section-2 | RFC 4034}
 */
export class DNSKEY extends RR {
    /**
     * Bit 7 of the Flags field is the Zone Key flag. If bit 7 has value 1, then the DNSKEY record
     * holds a DNS zone key, and the DNSKEY RR's owner name MUST be the name of a zone.  If bit 7
     * has value 0, then the DNSKEY record holds some other type of DNS public key and MUST NOT be
     * used to verify RRSIGs that cover RRsets.
     */
    flags!: Uint16;
    /**
     * The Protocol Field MUST have value 3, and the DNSKEY RR MUST be treated as invalid during
     * signature verification if it is found to be some value other than 3.
     */
    protocol!: Uint8;
    /**
     * The Algorithm field identifies the public key's cryptographic algorithm and determines the
     * format of the Public Key field.
     */
    algorithm!: SecurityAlgorithm;
    /**
     * The Public Key Field holds the public key material.
     *
     * The format depends on the algorithm of the key being stored and is described in separate documents.
     */
    publicKey!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.flags = rdata.readUint16();
        this.protocol = rdata.readUint8();
        this.algorithm = rdata.readUint8();
        this.publicKey = rdata.readUint8Array(this.header.rdlength - 4);
    }

    packRdata(buf: Writer): number {
        return buf.writeUint16(this.flags) +
            buf.writeUint8(this.protocol) +
            buf.writeUint8(this.algorithm) +
            buf.write(this.publicKey);
    }

    parseRdata(_rdata: CharacterString[]): void {
        throw new ParseError(`unimplemented!`);
    }

    /**
     * Returns a dig-like output of the DNSKEY record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc4034#section-2.2 | DNSKEY RR Presentation Format}
     * @returns
     */
    presentRdata(): string {
        const key = binaryToString(this.publicKey, 'base64');
        return `${this.flags} ${this.protocol} ${this.algorithm} ${key}`;
    }
}
