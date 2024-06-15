import { Writer } from "../../buffer";
import { ParseError } from "../../error";
import { FQDN } from "../../fqdn";
import { CharacterString } from "../../char";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { TypeBitMaps } from "./type-bitmaps";
import { rrtypeFrom } from "../../types";

/**
 * The NSEC resource record lists two separate things: the next owner name (in the canonical ordering
 * of the zone) that contains authoritative data or a delegation point NS RRset, and the set of RR
 * types present at the NSEC RR's owner name [RFC3845]. The complete set of NSEC RRs in a zone
 * indicates which authoritative RRsets exist in a zone and also form a chain of authoritative owner
 * names in the zone. This information is used to provide authenticated denial of existence for DNS
 * data, as described in {@link https://datatracker.ietf.org/doc/html/rfc4035 | RFC 4035}.
 *
 * RDATA wire format:
 *
 * ```
 *                    1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * /                      Next Domain Name                         /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * /                       Type Bit Maps                           /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#section-5 | RFC 4034}
 */
export class NSEC extends RR {
    /**
     * The Next Domain field contains the next owner name (in the canonical ordering of the zone)
     * that has authoritative data or contains a delegation point NS RRset.
     *
     * A sender MUST NOT use DNS name compression on the Next Domain Name field when transmitting
     * an NSEC RR.
     *
     * Owner names of RRsets for which the given zone is not authoritative (such as glue records)
     * MUST NOT be listed in the Next Domain Name unless at least one authoritative RRset exists at
     * the same owner name.
     *
     * Refer to {@link https://datatracker.ietf.org/doc/html/rfc4034#section-4.1.1} for details.
     */
    nextName!: FQDN;
    /**
     * The Type Bit Maps field identifies the RRset types that exist at the NSEC RR's owner name.
     *
     * Refer to {@link https://datatracker.ietf.org/doc/html/rfc4034#section-4.1.2} for details.
     */
    typeBitMaps!: TypeBitMaps;

    unpackRdata(rdata: Slice): void {
        this.nextName = rdata.readName();
        this.typeBitMaps = TypeBitMaps.unpack(rdata.readSlice(rdata.remaining()));
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.nextName, false) + this.typeBitMaps.pack(buf);
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`missing <Next Domain Name>`);
        }

        this.nextName = FQDN.parse(rdata[0].raw());

        const types = [];
        for (let i = 1; i < rdata.length; i++) {
            const rrt = rrtypeFrom(rdata[i].raw());
            if (rrt === null) {
                throw new ParseError(`invalid type "${rdata[i]}" in Type Bit Maps`);
            }
            types.push(rrt);
        }
        this.typeBitMaps = new TypeBitMaps(types);
    }

    /**
     * Returns a dig-like output of the NSEC record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc4034#section-4.2 | NSEC RR Presentation Format}
     * @returns
     */
    presentRdata(): string {
        return `${this.nextName.present()} ${this.typeBitMaps}`;
    }
}
