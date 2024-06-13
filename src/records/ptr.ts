import { Writer } from "../buffer";
import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";

/**
 *
 *
 * PTR RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   PTRDNAME                    /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class PTR extends RR {
    /**
     * A <domain-name> which points to some location in the domain name space.
     */
    domain!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.domain = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.domain, true);
    }

    parseRdata(rdata: string): void {
        this.domain = FQDN.parse(rdata);
    }

    rdataString(): string {
        return `${this.domain}`;
    }
}
