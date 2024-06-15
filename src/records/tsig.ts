import { Writer } from "../buffer";
import { binaryToString } from "../encoding";
import { ParseError } from "../error";
import { FQDN } from "../fqdn";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint16, Uint48 } from "../types";

/**
 * To provide secret key authentication, we use an RR type whose mnemonic is TSIG and whose type
 * code is 250.
 *
 * TSIG is a meta-RR and MUST NOT be cached. TSIG RRs are used for authentication between DNS
 * entities that have established a shared secret key. TSIG RRs are dynamically computed to cover
 * a particular DNS transaction and are not DNS RRs in the usual sense.
 *
 * As the TSIG RRs are related to one DNS request/response, there is no value in storing or
 * retransmitting them; thus, the TSIG RR is discarded once it has been used to authenticate a DNS
 * message.
 *
 * TSIG record format:
 *  - NAME: The name of the key used, in domain name syntax.
 *  - TYPE: This MUST be TSIG (250: Transaction SIGnature).
 *  - This MUST be ANY.
 *  - TTL: This MUST be 0.
 *
 * RDATA format:
 *
 * ```
 *                       1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  /                         Algorithm Name                        /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                                                               |
 *  |          Time Signed          +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                               |            Fudge              |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |          MAC Size             |                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+             MAC               /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |          Original ID          |            Error              |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |          Other Len            |                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+           Other Data          /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  ```
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#autoid-13 | RFC 4034}
 */
export class TSIG extends RR {
    /**
     * An octet sequence identifying the TSIG algorithm in the domain name syntax.
     *
     * The name is stored in the DNS name wire format as described in [RFC1034]. As per [RFC3597],
     * this name MUST NOT be compressed.
     */
    algorithm!: FQDN;
    /**
     * An unsigned 48-bit integer containing the time the message was signed as seconds since 00:00
     * on 1970-01-01 UTC, ignoring leap seconds.
     */
    timeSigned!: Uint48;
    fudge!: Uint16;
    mac!: Uint8Array;
    originalID!: Uint16;
    error!: Uint16;
    otherData!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.algorithm = rdata.readName();
        this.timeSigned = rdata.readUint48();
        this.fudge = rdata.readUint16();
        this.mac = rdata.readUint8Array(rdata.readUint16());
        this.originalID = rdata.readUint16();
        this.error = rdata.readUint16();
        this.otherData = rdata.readUint8Array(rdata.readUint16());
    }

    packRdata(buf: Writer): number {
        let n = buf.writeName(this.algorithm, false);
        n += buf.writeUint32(this.timeSigned >> 16);
        n += buf.writeUint16(this.timeSigned & 0xffff);
        n += buf.writeUint16(this.fudge);
        n += buf.writeUint16(this.mac.length);
        n += buf.write(this.mac);
        n += buf.writeUint16(this.originalID);
        n += buf.writeUint16(this.error);
        n += buf.writeUint16(this.otherData.length);
        n += buf.write(this.otherData);
        return n;
    }

    parseRdata(_rdata: CharacterString[]): void {
        throw new ParseError(`unimplemented!`);
    }

    /**
     * TSIG has no official presentation format.
     *
     * @returns
     */
    presentRdata(): string {
        const mac = binaryToString(this.mac, "base64");
        const otherData = binaryToString(this.otherData, "base64");
        return `${this.algorithm} ${displayTimeSigned(this.timeSigned)} ${this.fudge} ${mac} ${this.originalID} ${
            this.error
        } ${otherData}`;
    }
}

/**
 * Returns dig-like output for a datetime represented by the unix timestamp.
 *
 * @param ts
 * @returns
 */
function displayTimeSigned(ts: Uint48): string {
    const dt = new Date(ts);
    return `${dt.getUTCFullYear()}${(dt.getUTCMonth() + 1).toString().padStart(2, "0")}${dt
        .getUTCDate()
        .toString()
        .padStart(2, "0")}${dt.getUTCHours().toString().padStart(2, "0")}${dt
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}${dt.getUTCSeconds().toString().padStart(2, "0")}`;
}
