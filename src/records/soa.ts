import { Writer } from "../buffer";
import { ParseError } from "../error";
import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint32 } from "../types";

/**
 * SOA records cause no additional section processing.
 *
 * All times are in units of seconds.
 *
 * Most of these fields are pertinent only for name server maintenance
 * operations. However, MINIMUM is used in all query operations that
 * retrieve RRs from a zone. Whenever a RR is sent in a response to a
 * query, the TTL field is set to the maximum of the TTL field from the RR
 * and the MINIMUM field in the appropriate SOA. Thus MINIMUM is a lower
 * bound on the TTL field for all RRs in a zone. Note that this use of
 * MINIMUM should occur when the RRs are copied into the response and not
 * when the zone is loaded from a master file or via a zone transfer. The
 * reason for this provison is to allow future dynamic update facilities to
 * change the SOA RR with known semantics.
 *
 * SOA RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                     MNAME                     /
 *  /                     MNAME                     /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                     RNAME                     /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    SERIAL                     |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    REFRESH                    |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                     RETRY                     |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    EXPIRE                     |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    MINIMUM                    |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class SOA extends RR {
    /**
     * The <domain-name> of the name server that was the original or primary source of data for this
     * zone.
     */
    mname!: FQDN;
    /**
     * A <domain-name> which specifies the mailbox of the person responsible for this zone.
     */
    rname!: FQDN;
    /**
     * The unsigned 32 bit version number of the original copy of the zone. Zone transfers preserve
     * this value. This value wraps and should be compared using sequence space arithmetic.
     */
    serial!: Uint32;
    /**
     * A 32 bit time interval before the zone should be refreshed.
     */
    refresh!: Uint32;
    /**
     * A 32 bit time interval that should elapse before a failed refresh should be retried.
     */
    retry!: Uint32;
    /**
     * A 32 bit time value that specifies the upper limit on the time interval that can elapse
     * before the zone is no longer authoritative.
     */
    expire!: Uint32;
    /**
     * The unsigned 32 bit minimum TTL field that should be exported with any RR from this zone.
     */
    minimum!: Uint32;

    unpackRdata(rdata: Slice): void {
        this.mname = rdata.readName();
        this.rname = rdata.readName();
        this.serial = rdata.readUint32();
        this.refresh = rdata.readUint32();
        this.retry = rdata.readUint32();
        this.expire = rdata.readUint32();
        this.minimum = rdata.readUint32();
    }

    packRdata(buf: Writer): number {
        return (
            buf.writeName(this.mname, true) +
            buf.writeName(this.rname, true) +
            buf.writeUint32(this.serial) +
            buf.writeUint32(this.refresh) +
            buf.writeUint32(this.retry) +
            buf.writeUint32(this.expire) +
            buf.writeUint32(this.minimum)
        );
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`missing RDATA`);
            case 1:
                throw new ParseError(`missing <RNAME> in RDATA`);
            case 2:
                throw new ParseError(`missing <SERIAL> in RDATA`);
            case 3:
                throw new ParseError(`missing <REFRESH> in RDATA`);
            case 4:
                throw new ParseError(`missing <RETRY> in RDATA`);
            case 5:
                throw new ParseError(`missing <EXPIRE> in RDATA`);
            case 6:
                throw new ParseError(`missing <MINIMUM> in RDATA`);
        }

        this.mname = FQDN.parse(rdata[0].raw());
        this.rname = FQDN.parse(rdata[1].raw());
        this.serial =
            rdata[2].toUint32() ??
            (() => {
                throw new ParseError(`invalid <SERIAL> in RDATA`);
            })();
        this.refresh =
            rdata[3].toUint32() ??
            (() => {
                throw new ParseError(`invalid <REFRESH> in RDATA`);
            })();
        this.retry =
            rdata[4].toUint32() ??
            (() => {
                throw new ParseError(`invalid <RETRY> in RDATA`);
            })();
        this.expire =
            rdata[5].toUint32() ??
            (() => {
                throw new ParseError(`invalid <EXPIRE> in RDATA`);
            })();
        this.minimum =
            rdata[6].toUint32() ??
            (() => {
                throw new ParseError(`invalid <MINIMUM> in RDATA`);
            })();
    }

    presentRdata(): string {
        return `${this.mname.present()} ${this.rname.present()} ${this.serial} ${this.refresh} ${this.retry} ${
            this.expire
        } ${this.minimum}`;
    }
}
