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

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.domain = rdata.readName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return buf.writeName(this.domain, true);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.domain}`;
    }
}
