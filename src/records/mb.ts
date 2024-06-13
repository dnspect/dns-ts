import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { ParseError } from "../error";

/**
 *
 * Not formally obsoleted. Unlikely to be ever adopted (RFC 2505).
 *
 * MB RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   MADNAME                     /
 * /                                               /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class MB extends RR {
    /**
     * A <domain-name> which specifies a host which has the specified mailbox.
     */
    madname!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.madname = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.madname, false);
    }

    parseRdata(rdata: string): void {
        this.madname = FQDN.parse(rdata);
    }

    rdataString(): string {
        return `${this.madname}`;
    }
}
