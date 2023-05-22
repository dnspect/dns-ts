import { Writer } from "../../buffer";
import { binaryToString } from "../../encoding";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { Uint16, Uint8 } from "../../types";
import { SecurityAlgorithm } from "./algorithm";

/**
 * The DS Resource Record refers to a DNSKEY RR and is used in the DNS DNSKEY authentication process.
 *
 * A DS RR refers to a DNSKEY RR by storing the key tag, algorithm number, and a digest of the DNSKEY
 * RR. Note that while the digest should be sufficient to identify the public key, storing the key
 * tag and key algorithm helps make the identification process more efficient. By authenticating the
 * DS record, a resolver can authenticate the DNSKEY RR to which the DS record points.
 *
 * The DS RR and its corresponding DNSKEY RR have the same owner name, but they are stored in
 * different locations. The DS RR appears only on the upper (parental) side of a delegation, and is
 * authoritative data in the parent zone
 *
 * RDATA wire format:
 *
 * ```
 *                      1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |           Key Tag             |  Algorithm    |  Digest Type  |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * /                                                               /
 * /                            Digest                             /
 * /                                                               /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#section-5 | RFC 4034}
 */
export class DS extends RR {
    /**
     * The Key Tag field lists the key tag of the DNSKEY RR referred to by the DS record, in network
     * byte order.
     *
     * The Key Tag used by the DS RR is identical to the Key Tag used by RRSIG RRs.
     */
    keyTag!: Uint16;
    /**
     * The Algorithm field lists the algorithm number of the DNSKEY RR referred to by the DS record.
     *
     * The algorithm number used by the DS RR is identical to the algorithm number used by RRSIG and
     * DNSKEY RRs.
     */
    algorithm!: SecurityAlgorithm;
    /**
     * The DS RR refers to a DNSKEY RR by including a digest of that DNSKEY RR.
     *
     * The Digest Type field identifies the algorithm used to construct the digest.
     */
    digestType!: Uint8;
    /**
     * The DS record refers to a DNSKEY RR by including a digest of that DNSKEY RR.
     *
     * The digest is calculated by concatenating the canonical form of the fully qualified owner
     * name of the DNSKEY RR with the DNSKEY RDATA, and then applying the digest algorithm.
     *
     * ```
     *   digest = digest_algorithm( DNSKEY owner name | DNSKEY RDATA);
     *
     *    "|" denotes concatenation
     *
     *   DNSKEY RDATA = Flags | Protocol | Algorithm | Public Key.
     * ```
     *
     * The size of the digest may vary depending on the digest algorithm and DNSKEY RR size. As of
     * the time of this writing, the only defined digest algorithm is SHA-1, which produces a 20
     * octet digest.
     */
    digest!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.keyTag = rdata.readUint16();
        this.algorithm = rdata.readUint8();
        this.digestType = rdata.readUint8();
        this.digest = rdata.readUint8Array(this.header.rdlength - 4);
    }

    packRdata(buf: Writer): number {
        return buf.writeUint16(this.keyTag) +
            buf.writeUint8(this.algorithm) +
            buf.writeUint8(this.digestType) +
            buf.write(this.digest);
    }

    /**
     * Returns a dig-like output of the DS record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc4034#section-5.3 | DS RR Presentation Format}
     * @returns
     */
    toString(): string {
        const key = binaryToString(this.digest, 'hex').toUpperCase();
        return `${this.header}\t${this.keyTag} ${this.algorithm} ${this.digestType} ${key}`;
    }
}
