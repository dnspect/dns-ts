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
        this.domain = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return this.domain.pack(buf);
    }

    toString(): string {
        return `${this.header}\t${this.domain}`;
    }
}
