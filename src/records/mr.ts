import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";

/**
 *
 * Not formally obsoleted. Unlikely to be ever adopted (RFC 2505).
 *
 * MR RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   NEWNAME                     /
 * /                                               /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class MR extends RR {
    /**
     * A <domain-name> which specifies a mailbox which is the proper rename of the specified mailbox.
     */
    newname!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.newname = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return this.newname.pack(buf);
    }

    toString(): string {
        return `${this.header}\t${this.newname}`;
    }
}
