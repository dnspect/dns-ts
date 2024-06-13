import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { ParseError } from "../error";

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
        this.mgmname = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.mgmname, false);
    }

    parseRdata(rdata: string): void {
        this.mgmname = FQDN.parse(rdata);
    }

    rdataString(): string {
        return `${this.mgmname}`;
    }
}
