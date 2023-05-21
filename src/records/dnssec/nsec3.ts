import { Base32Spec, Decoder } from "../../base32";
import { Writer } from "../../buffer";
import { binaryToString } from "../../encoding";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { Uint16, Uint8 } from "../../types";
import { NSEC3HashAlgorithm } from "./algorithm";
import { TypeBitMaps } from "./type-bitmaps";

/**
 * The NSEC3 Resource Record (RR) provides authenticated denial of existence for DNS Resource Record
 * Sets.
 *
 * As described in {@link https://datatracker.ietf.org/doc/html/rfc5155#section-3 | RFC 5155}.
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
 *  |  Hash Length  |             Next Hashed Owner Name            /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  /                         Type Bit Maps                         /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#section-5 | RFC 4034}
 */
export class NSEC3 extends RR {
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
    /**
     * The next hashed owner name is not base32 encoded, unlike the owner name of the NSEC3 RR.
     * It is the unmodified binary hash value.
     * It does not include the name of the containing zone.
     * The length of this field is determined by the preceding Hash Length field.
     */
    nexHashedOwnerName!: Uint8Array;
    /**
     * The Type Bit Maps field identifies the RRSet types that exist at the original owner name of
     * the NSEC3 RR.
     */
    typeBitMaps!: TypeBitMaps;

    unpackRdata(rdata: Slice): void {
        this.hashAlg = rdata.readOctet();
        this.flags = rdata.readOctet();
        this.iterations = rdata.readUint16();
        this.salt = rdata.readUint8Array(rdata.readOctet());
        this.nexHashedOwnerName = rdata.readUint8Array(rdata.readOctet());
        this.typeBitMaps = TypeBitMaps.unpack(rdata.readSlice(rdata.remaining()));
    }

    /**
     * @param buf
     * @returns
     */
    packRdata(buf: Writer): number {
        return buf.writeUint8(this.hashAlg) +
            buf.writeUint8(this.flags) +
            buf.writeUint16(this.iterations) +
            buf.writeUint8(this.salt.length) +
            buf.write(this.salt) +
            buf.writeUint8(this.nexHashedOwnerName.length) +
            buf.write(this.nexHashedOwnerName) +
            this.typeBitMaps.pack(buf);
    }

    /**
     * Returns a dig-like output of the NSEC3 record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc5155#section-3.3 | NSEC3 RR Presentation Format}
     * @returns
     */
    toString(): string {
        const salt = this.salt.length === 0 ? "-" : binaryToString(this.salt, "hex");
        const decoder = new Decoder(Base32Spec.ExtendedHex);
        const nextHashedOwnerName = this.nexHashedOwnerName.length === 0 ? "" : decoder.decode(this.salt);
        return `${this.header}\t${this.hashAlg} ${this.flags} ${this.iterations} ${salt} ${nextHashedOwnerName} ${this.typeBitMaps}`;
    }
}
