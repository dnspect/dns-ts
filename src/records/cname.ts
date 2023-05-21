import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { RRType } from "../types";
import { Writer } from "../buffer";

/**
 * CNAME RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                     CNAME                     /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class CNAME extends RR {
    /**
     * A <domain-name> which specifies the canonical or primary name for the owner. The owner name
     * is an alias.
     */
    target!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.target = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return this.target.pack(buf);
    }

    toString(): string {
        return `${this.header}\t${this.target}`;
    }
}

/**
 * Type guard for `CNAME`.
 *
 * @param rr
 * @returns
 */
export const isCNAME = (rr: RR): rr is CNAME => rr.header.type === RRType.CNAME;
