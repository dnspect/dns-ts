import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
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
        this.newname = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.newname, false);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.newname = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return `${this.newname}`;
    }
}
