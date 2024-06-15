import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";

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

    parseRdata(rdata: CharacterString[]): void {
        this.madname = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return `${this.madname}`;
    }
}
