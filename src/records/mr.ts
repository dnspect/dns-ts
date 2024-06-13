import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { ParseError } from "../error";

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
        this.newname = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.newname, false);
    }

    parseRdata(rdata: string): void {
        this.newname = FQDN.parse(rdata);
    }

    rdataString(): string {
        return `${this.newname}`;
    }
}
