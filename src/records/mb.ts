import { FQDN } from "../fqdn";
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

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.madname = rdata.readDomainName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return this.madname.pack(buf);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.madname}`;
    }
}
