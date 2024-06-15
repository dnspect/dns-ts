import { Writer } from "../buffer";
import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";

/**
 *
 *
 * PTR RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   PTRDNAME                    /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class PTR extends RR {
    /**
     * A <domain-name> which points to some location in the domain name space.
     */
    domain!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.domain = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.domain, true);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.domain = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return `${this.domain}`;
    }
}
