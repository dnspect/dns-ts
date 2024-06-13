import { Writer } from "../buffer";
import { binaryToString } from "../encoding";
import { ParseError } from "../error";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint32, Uint8 } from "../types";

const DIGEST_MIN_LEN = 12;

/**
 * Resource Record that provides a cryptographic message digest over DNS zone data at rest.
 *
 * The ZONEMD Resource Record conveys the digest data in the zone itself. When used in combination
 * with DNSSEC, ZONEMD allows recipients to verify the zone contents for data integrity and origin
 * authenticity. This provides assurance that received zone data matches published data, regardless
 * of how the zone data has been transmitted and received. When used without DNSSEC, ZONEMD functions
 * as a checksum, guarding only against unintentional changes.
 *
 * ZONEMD RDATA format:
 *
 * ```
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                             Serial                            |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |    Scheme     |Hash Algorithm |                               |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+                               |
 * |                             Digest                            |
 * /                                                               /
 * /                                                               /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *
 * ```
 */
export class ZONEMD extends RR {
    /**
     *  the serial number from the zone's SOA record for which the zone digest was generated.
     *
     * It is included here to clearly bind the ZONEMD RR to a particular version of the zone's
     * content. Without the serial number, a stand-alone ZONEMD digest has no obvious association
     * to any particular instance of a zone.
     */
    serial!: Uint32;

    /**
     * Identifies the methods by which data is collated and presented as input to the hashing
     * function.
     */
    scheme!: Uint8;

    /**
     * Identifies the cryptographic hash algorithm used to construct the digest.
     */
    algorithm!: Uint8;

    /**
     * A variable-length sequence of octets containing the output of the hash algorithm.
     *
     * The length of the Digest field is determined by deducting the fixed size of the Serial, Scheme,
     * and Hash Algorithm fields from the RDATA size in the ZONEMD RR header.
     *
     * The Digest field MUST NOT be shorter than 12 octets. Digests for the SHA384 and SHA512 hash
     * algorithms specified herein are never truncated. Digests for future hash algorithms MAY be
     * truncated but MUST NOT be truncated to a length that results in less than 96 bits (12 octets)
     * of equivalent strength.
     */
    digest!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.serial = rdata.readUint32();
        this.scheme = rdata.readUint8();
        this.algorithm = rdata.readUint8();

        const len = this.header.rdlength - 6;
        if (len < DIGEST_MIN_LEN) {
            throw new ParseError(
                `digest field MUST NOT be shorter than 12 octets, got ${len}`
            );
        }
        this.digest = rdata.readUint8Array(len);
    }

    packRdata(buf: Writer): number {
        return (
            buf.writeUint32(this.serial) +
            buf.writeUint8(this.scheme) +
            buf.writeUint8(this.algorithm) +
            buf.write(this.digest)
        );
    }

    parseRdata(_rdata: string): void {
        throw new ParseError(`unimplemented!`);
    }

    /**
     * @override
     */
    rdataString(): string {
        const digest = binaryToString(this.digest, "hex").toUpperCase();
        return `${this.serial} ${this.scheme} ${this.algorithm} ${digest}`;
    }
}
