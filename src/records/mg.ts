import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
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
        this.mgmname = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.mgmname, false);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.mgmname = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return `${this.mgmname}`;
    }
}
