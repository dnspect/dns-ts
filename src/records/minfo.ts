import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { ParseError } from "../error";

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

    unpackRdata(rdata: Slice): void {
        this.rmailbx = rdata.readName();
        this.emailbx = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.rmailbx, true) + buf.writeName(this.emailbx, true);
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError("missing RDATA");
            case 1:
                throw new ParseError("missing <EMAILBX> in RDATA");
        }

        this.rmailbx = FQDN.parse(rdata[0].raw());
        this.emailbx = FQDN.parse(rdata[1].raw());
    }

    presentRdata(): string {
        return `${this.rmailbx.present()} ${this.emailbx.present()}`;
    }
}
