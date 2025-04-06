import { Writer } from "../buffer";
import { binaryToString, stringToBinary } from "../encoding";
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
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc2845#section-2 | RFC 2845}
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
    /**
     * Seconds of error permitted in Time Signed.
     */
    fudge!: Uint16;
    /**
     * Octet stream defined by Algorithm Name.
     */
    mac!: Uint8Array;
    /**
     * Original message ID
     */
    originalID!: Uint16;
    /**
     * Expanded RCODE covering TSIG processing.
     */
    error!: Uint16;
    /**
     * Octet stream, empty unless Error == BADTIME
     */
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
        n += buf.writeUint16(this.mac.byteLength);
        n += buf.write(this.mac);
        n += buf.writeUint16(this.originalID);
        n += buf.writeUint16(this.error);
        n += buf.writeUint16(this.otherData.byteLength);
        n += buf.write(this.otherData);
        return n;
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`Missing RDATA fields in TSIG`);
            case 1:
                throw new ParseError(`Missing <TIME-SIGNED> in RDATA`);
            case 2:
                throw new ParseError(`Missing <FUDGE> in RDATA`);
            case 3:
                throw new ParseError(`Missing <MAC> in RDATA`);
            case 4:
                throw new ParseError(`Missing <ORIGINAL-ID> in RDATA`);
            case 5:
                throw new ParseError(`Missing <ERROR> in RDATA`);
        }

        this.algorithm = FQDN.parse(rdata[0].raw()) ??
            (() => {
                throw new ParseError("invalid <ALGORITHM> in RDATA");
            })();
        this.timeSigned = parseTimeSigned(rdata[1].raw()) ??
            (() => {
                throw new ParseError("invalid <TIME-SIGNED> in RDATA");
            })();
        this.fudge = rdata[2].toUint16() ??
            (() => {
                throw new ParseError("invalid <TIME-SIGNED> in RDATA");
            })();
        this.mac = stringToBinary(rdata[3].raw(), "base64") ??
            (() => {
                throw new ParseError("invalid <MAC> in RDATA");
            })();
        this.originalID = rdata[4].toUint16() ??
            (() => {
                throw new ParseError("invalid <ORIGINAL-ID> in RDATA");
            })();
        this.error = rdata[5].toUint16() ??
            (() => {
                throw new ParseError("invalid <ERROR> in RDATA");
            })();

        if (rdata.length === 7) {
            this.otherData = stringToBinary(rdata[6].raw(), "base64") ??
                (() => {
                    throw new ParseError("invalid <OTHER-DATA> in RDATA");
                })();
        } else {
            this.otherData = new Uint8Array();
        }
    }

    /**
     * TSIG has no official presentation format.
     *
     * @returns
     */
    presentRdata(): string {
        const mac = binaryToString(this.mac, "base64");
        let text = `${this.algorithm} ${displayTimeSigned(this.timeSigned)} ${this.fudge} ${mac} ${this.originalID} ${this.error}`;

        if (this.otherData.byteLength > 0) {
            const otherData = binaryToString(this.otherData, "base64");
            text += ` ${otherData}`;
        }

        return text;
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

/**
 * Returns UNIX timestamp in seconds.
 *
 * @param str
 * @throws ParseError
 */
function parseTimeSigned(str: string): Uint48 {
    const found = str.match(/^([0-9]{4})([01][0-9])([0123][0-9])([012][0-9])([0-6][0-9])([0-6][0-9])$/i);
    if (found === null) {
        throw new ParseError(`invalid <TIME-SIGNED>: ${str}`);
    }

    const dt = new Date(
        parseInt(found[1]),
        parseInt(found[2]) - 1,
        parseInt(found[3]),
        parseInt(found[4]),
        parseInt(found[5]),
        parseInt(found[6])
    );

    return dt.getTime() / 1000;
}
