import { Writer } from "../../buffer";
import { binaryToString } from "../../encoding";
import { ParseError } from "../../error";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { Uint16, Uint8 } from "../../types";
import { NSEC3HashAlgorithm } from "./algorithm";

/**
 * The NSEC3PARAM RR contains the NSEC3 parameters (hash algorithm, flags, iterations, and salt)
 * needed by authoritative servers to calculate hashed owner names.
 *
 * The presence of an NSEC3PARAM RR at a zone apex indicates that the specified parameters may be
 * used by authoritative servers to choose an appropriate set of NSEC3 RRs for negative responses.
 * The NSEC3PARAM RR is not used by validators or resolvers.
 *
 * If an NSEC3PARAM RR is present at the apex of a zone with a Flags field value of zero, then there
 * MUST be an NSEC3 RR using the same hash algorithm, iterations, and salt parameters present at
 * every hashed owner name in the zone. That is, the zone MUST contain a complete set of NSEC3 RRs
 * with the same hash algorithm, iterations, and salt parameters.
 *
 * The owner name for the NSEC3PARAM RR is the name of the zone apex.
 *
 * The type value for the NSEC3PARAM RR is 51.
 *
 * The NSEC3PARAM RR RDATA format is class independent.
 *
 * The class MUST be the same as the NSEC3 RRs to which this RR refers.
 *
 * RDATA wire format:
 *
 * ```
 *                       1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |   Hash Alg.   |     Flags     |          Iterations           |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |  Salt Length  |                     Salt                      /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc5155#section-4 | RFC 5155}
 */
export class NSEC3PARAM extends RR {
    /**
     * The Hash Algorithm field identifies the cryptographic hash algorithm used to construct the
     * hash-value.
     */
    hashAlg!: NSEC3HashAlgorithm;
    /**
     * The Flags field contains 8 one-bit flags that can be used to indicate different processing.
     * All undefined flags must be zero.
     */
    flags!: Uint8;
    /**
     * The Iterations field defines the number of additional times the hash function has been
     * performed.
     *
     * More iterations result in greater resiliency of the hash value against dictionary attacks,
     * but at a higher computational cost for both the server and resolver.
     */
    iterations!: Uint16;
    /**
     * Salt, if present, is encoded as a sequence of binary octets.
     *
     * The length of this field is determined by the preceding Salt Length field.
     */
    salt!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.hashAlg = rdata.readUint8();
        this.flags = rdata.readUint8();
        this.iterations = rdata.readUint16();
        this.salt = rdata.readUint8Array(rdata.readUint8());
    }

    packRdata(buf: Writer): number {
        return buf.writeUint8(this.hashAlg) +
            buf.writeUint8(this.flags) +
            buf.writeUint16(this.iterations) +
            buf.writeUint8(this.salt.length) +
            buf.write(this.salt);
    }

    parseRdata(_rdata: string): void {
        throw new ParseError(`unimplemented!`);
    }

    /**
     * Returns a dig-like output of the NSEC3PARAM record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc5155#section-4.3 | NSEC3PARAM RR Presentation Format}
     * @returns
     */
    rdataString(): string {
        const salt = this.salt.length === 0 ? "-" : binaryToString(this.salt, "hex");
        return `${this.hashAlg} ${this.flags} ${this.iterations} ${salt}`;
    }
}
