import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";

/**
 *
 * Not formally obsoleted. Unlikely to be ever adopted (RFC 2505).
 *
 * MG RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   MGMNAME                     /
 * /                                               /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class MG extends RR {
    /**
     * A <domain-name> which specifies a mailbox which is a member of the mail group specified by
     * the domain name.
     */
    mgmname!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.mgmname = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return this.mgmname.pack(buf);
    }

    toString(): string {
        return `${this.header}\t${this.mgmname}`;
    }
}
