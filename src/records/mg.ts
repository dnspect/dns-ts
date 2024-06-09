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

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.mgmname = rdata.readName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return buf.writeName(this.mgmname, false);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.mgmname}`;
    }
}
