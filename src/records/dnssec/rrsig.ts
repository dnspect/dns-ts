import { Writer } from "../../buffer";
import { binaryToString, stringToBinary } from "../../encoding";
import { ParseError } from "../../error";
import { FQDN } from "../../fqdn";
import { CharacterString } from "../../char";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { RRType, rrtypeFrom, Uint16, Uint32, Uint8 } from "../../types";
import { SecurityAlgorithm } from "./algorithm";

/**
 * The signature for an RRset with a particular name, class, and type.
 *
 * RDATA wire format:
 *
 *  ```
 *                       1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |        Type Covered           |  Algorithm    |     Labels    |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                         Original TTL                          |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                      Signature Expiration                     |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                      Signature Inception                      |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |            Key Tag            |                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+         Signer's Name         /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  /                                                               /
 *  /                            Signature                          /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  ```
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4034#autoid-13 | RFC 4034}
 */
export class RRSIG extends RR {
    typeCovered!: RRType;
    algorithm!: SecurityAlgorithm;
    labels!: Uint8;
    originalTTL!: Uint32;
    expiration!: Uint32;
    inception!: Uint32;
    keyTag!: Uint16;
    signerName!: FQDN;
    signature!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        const bytesLeft = rdata.remaining();

        this.typeCovered = rdata.readUint16();
        this.algorithm = rdata.readUint8();
        this.labels = rdata.readUint8();
        this.originalTTL = rdata.readUint32();
        this.expiration = rdata.readUint32();
        this.inception = rdata.readUint32();
        this.keyTag = rdata.readUint16();
        this.signerName = rdata.readName();
        this.signature = rdata.readUint8Array(this.header.rdlength - (bytesLeft - rdata.remaining()));
    }

    packRdata(buf: Writer): number {
        return (
            buf.writeUint16(this.typeCovered) +
            buf.writeUint8(this.algorithm) +
            buf.writeUint8(this.labels) +
            buf.writeUint32(this.originalTTL) +
            buf.writeUint32(this.expiration) +
            buf.writeUint32(this.inception) +
            buf.writeUint16(this.keyTag) +
            buf.writeName(this.signerName, true) +
            buf.write(this.signature)
        );
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`missing RDATA`);
            case 1:
                throw new ParseError(`missing <Algorithm> in RDATA`);
            case 2:
                throw new ParseError(`missing <Labels> in RDATA`);
            case 3:
                throw new ParseError(`missing <Original TTL> in RDATA`);
            case 4:
                throw new ParseError(`missing <Signature Expiration> in RDATA`);
            case 5:
                throw new ParseError(`missing <Signature Inception> in RDATA`);
            case 6:
                throw new ParseError(`missing <Key Tag> in RDATA`);
            case 7:
                throw new ParseError(`missing <Signer's Name> in RDATA`);
            case 8:
                throw new ParseError(`missing <Signature> in RDATA`);
        }

        this.typeCovered =
            rrtypeFrom(rdata[0].raw()) ??
            (() => {
                throw new ParseError(`invalid <Type Covered> in RDATA: ${rdata[0]}`);
            })();

        this.algorithm =
            rdata[1].toUint8() ??
            (() => {
                throw new ParseError(`invalid <Algorithm> in RDATA: ${rdata[1]}`);
            })();

        this.labels =
            rdata[2].toUint8() ??
            (() => {
                throw new ParseError(`invalid <Labels> in RDATA: ${rdata[2]}`);
            })();

        this.originalTTL =
            rdata[3].toUint32() ??
            (() => {
                throw new ParseError(`invalid <Original TTL> in RDATA: ${rdata[2]}`);
            })();
        this.expiration = parseDateTime(rdata[4].raw(), "Signature Expiration");
        this.inception = parseDateTime(rdata[5].raw(), "Signature Inception");
        this.keyTag =
            rdata[6].toUint16() ??
            (() => {
                throw new ParseError(`invalid <Key Tag> in RDATA: ${rdata[6]}`);
            })();

        this.signerName = FQDN.parse(rdata[7].raw());
        this.signature = stringToBinary(
            rdata
                .slice(8)
                .map((s) => s.raw())
                .join(""),
            "base64"
        );
    }

    /**
     * Returns a dig-like output of the RRSIG record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc4034#autoid-24 | RRSIG RR Presentation Format}
     * @returns
     */
    presentRdata(): string {
        const signature = binaryToString(this.signature, "base64");
        return `${RRType[this.typeCovered]} ${this.algorithm} ${this.labels} ${this.originalTTL} ${displayUnixTS(
            this.expiration
        )} ${displayUnixTS(this.inception)} ${this.keyTag} ${this.signerName} ${signature}`;
    }
}

/**
 * Returns dig-like output for a datetime represented by the unix timestamp.
 *
 * @param ts
 * @returns
 */
function displayUnixTS(ts: Uint32): string {
    const dt = new Date(ts * 1000);
    return `${dt.getUTCFullYear()}${(dt.getUTCMonth() + 1).toString().padStart(2, "0")}${dt
        .getUTCDate()
        .toString()
        .padStart(2, "0")}${dt.getUTCHours().toString().padStart(2, "0")}${dt
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}${dt.getUTCSeconds().toString().padStart(2, "0")}`;
}

function parseDateTime(value: string, fieldName: string): Uint32 {
    const found = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (found === null) {
        throw new ParseError(`invalid <${fieldName}> in RDATA: ${value}`);
    }

    const year = parseInt(found[1]);
    const month = parseInt(found[2]);
    const days = parseInt(found[3]);
    const hours = parseInt(found[4]);
    const minutes = parseInt(found[5]);
    const seconds = parseInt(found[6]);

    return Date.UTC(year, month - 1, days, hours, minutes, seconds) / 1000;
}

/**
 * The signature for an RRset with a particular name, class, and type.
 *
 * RDATA wire format:
 *
 *  ```
 *                       1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |        Type Covered           |  Algorithm    |     Labels    |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                         Original TTL                          |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                      Signature Expiration                     |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                      Signature Inception                      |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |            Key Tag            |                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+         Signer's Name         /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  /                                                               /
 *  /                            Signature                          /
 *  /                                                               /
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc2535#section-4.1 | RFC 2535}
 */
export class SIG extends RRSIG { }
