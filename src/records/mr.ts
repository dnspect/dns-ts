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

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.newname = rdata.readName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return buf.writeName(this.newname, false);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.newname}`;
    }
}
