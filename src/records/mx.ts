import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint16 } from "../types";
import { Writer } from "../buffer";

/**
 * A DNS 'mail exchange' (MX) record directs email to a mail server.
 *
 * The MX record indicates how email messages should be routed in accordance with the SMTP.
 * Like CNAME records, an MX record must always point to another domain.
 *
 * MX RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                  PREFERENCE                   |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                   EXCHANGE                    /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class MX extends RR {
    /**
     * A 16 bit integer which specifies the preference given to this RR among others at the same
     * owner. Lower values are preferred.
     */
    preference!: Uint16;
    /**
     * A <domain-name> which specifies the canonical or primary name for the owner. The owner name
     * is an alias.
     */
    exchange!: FQDN;

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.preference = rdata.readUint16();
        this.exchange = rdata.readDomainName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return buf.writeUint16(this.preference) + this.exchange.pack(buf);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.preference} ${this.exchange}`;
    }
}
