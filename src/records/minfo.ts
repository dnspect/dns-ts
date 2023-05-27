import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";

/**
 *
 * Not formally obsoleted. Unlikely to be ever adopted (RFC 2505).
 *
 * MINFO RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   RMAILBX                     /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   EMAILBX                     /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class MINFO extends RR {
    /**
     * A <domain-name> which specifies a mailbox which is responsible for the mailing list or mailbox.
     * If this domain name names the root, the owner of the MINFO RR is responsible for itself. Note
     * that many existing mailing lists use a mailbox X-request for the RMAILBX field of mailing list
     * X, e.g., Msgroup-request for Msgroup. This field provides a more general mechanism.
     */
    rmailbx!: FQDN;
    /**
     * A <domain-name> which specifies a mailbox which is to receive error messages related to the
     * mailing list or mailbox specified by the owner of the MINFO RR (similar to the ERRORS-TO:
     * field which has been proposed). If this domain name names the root, errors should be returned
     * to the sender of the message.
     */
    emailbx!: FQDN;

    /**
     * @override
     */
    unpackRdata(rdata: Slice): void {
        this.rmailbx = rdata.readDomainName();
        this.emailbx = rdata.readDomainName();
    }

    /**
     * @override
     */
    packRdata(buf: Writer): number {
        return this.rmailbx.pack(buf) + this.emailbx.pack(buf);
    }

    /**
     * @override
     */
    dataString(): string {
        return `${this.rmailbx} ${this.emailbx}`;
    }
}
