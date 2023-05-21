import { Writer } from "../../buffer";
import { binaryToString } from "../../encoding";
import { FQDN } from "../../fqdn";
import { Slice } from "../../packet";
import { RR } from "../../rr";
import { RRType, Uint16, Uint32, Uint8 } from "../../types";
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
        this.algorithm = rdata.readOctet();
        this.labels = rdata.readOctet();
        this.originalTTL = rdata.readUint32();
        this.expiration = rdata.readUint32();
        this.inception = rdata.readUint32();
        this.keyTag = rdata.readUint16();
        this.signerName = rdata.readDomainName();
        this.signature = rdata.readUint8Array(this.header.rdlength - (bytesLeft - rdata.remaining()));
    }

    packRdata(buf: Writer): number {
        return buf.writeUint16(this.typeCovered) +
            buf.writeUint8(this.algorithm) +
            buf.writeUint8(this.labels) +
            buf.writeUint32(this.originalTTL) +
            buf.writeUint32(this.expiration) +
            buf.writeUint32(this.inception) +
            buf.writeUint16(this.keyTag) +
            this.signerName.pack(buf) +
            buf.write(this.signature);
    }

    /**
     * Returns a dig-like output of the RRSIG record.
     *
     * {@link https://datatracker.ietf.org/doc/html/rfc4034#autoid-24 | RRSIG RR Presentation Format}
     * @returns
     */
    toString(): string {
        const signature = binaryToString(this.signature, 'base64');
        return `${this.header}\t${RRType[this.typeCovered]} ${this.algorithm} ${this.labels} ${this.originalTTL} ${displayUnixTS(this.expiration)} ${displayUnixTS(this.inception)} ${this.keyTag} ${this.signerName} ${signature}`;
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
    return `${dt.getUTCFullYear()}${(dt.getUTCMonth() + 1).toString().padStart(2, "0")}${dt.getUTCDate().toString().padStart(2, "0")}${dt.getUTCHours().toString().padStart(2, "0")}${dt.getUTCMinutes().toString().padStart(2, "0")}${dt.getUTCSeconds().toString().padStart(2, "0")}`;
}
