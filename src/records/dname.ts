import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { RRType } from "../types";
import { Writer } from "../buffer";

/**
 * DNAME RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                     DNAME                     /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class DNAME extends RR {
    /**
     * A <domain-name> which specifies the canonical or primary name for the owner. The owner name
     * is an alias.
     */
    target!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.target = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.target, true);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.target = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return this.target.present();
    }
}

/**
 * Type guard for `DNAME`.
 *
 * @param rr RR
 * @returns
 */
export const isDNAME = (rr: RR): rr is DNAME => rr.header.type === RRType.DNAME;
