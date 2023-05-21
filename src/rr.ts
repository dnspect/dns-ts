/* tslint:disable:max-classes-per-file */

import { Address } from "@dnspect/ip-address-ts";
import { FQDN } from "./fqdn";
import { Slice } from "./packet";
import { Class, RRType, Uint16, Uint32, classAbbr } from "./types";
import { Writer } from "./buffer";

/**
 * RRHeader represents the fields before the record data.
 *
 * The answer, authority, and additional sections all share the same format: a variable number of resource records,
 * where the number of records is specified in the corresponding count field in the header. Each resource record has
 * the following format:
 * ```
 *                                  1  1  1  1  1  1
 *    0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                                               |
 *  /                                               /
 *  /                      NAME                     /
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                      TYPE                     |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                     CLASS                     |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                      TTL                      |
 *  |                                               |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                   RDLENGTH                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--|
 *  /                     RDATA                     /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
 */
export class Header {
    /**
     * A domain name to which this resource record pertains.
     */
    readonly name: FQDN;

    /**
     * Two octets containing one of the RR type codes. This field specifies the meaning of the data in the RDATA field.
     */
    readonly type: RRType;

    /**
     * Two octets which specify the class of the data in the RDATA field.
     */
    readonly class: Class;

    /**
     * A 32 bit unsigned integer that specifies the time interval (in seconds) that the resource record may be cached
     * before it should be discarded. Zero values are interpreted to mean that the RR can only be used for the transaction
     * in progress, and should not be cached.
     */
    readonly ttl: Uint32;

    /**
     * An unsigned 16 bit integer that specifies the length in octets of the RDATA field.
     */
    rdlength: Uint16;

    constructor(name: FQDN | string, type: RRType, cls: Class, ttl: Uint32) {
        this.name = (name instanceof FQDN) ? name : FQDN.parse(name);
        this.type = type;
        this.class = cls;
        this.ttl = ttl;
        this.rdlength = 0;
    }

    toString(): string {
        const s = `${this.name}\t\t${this.ttl}\t${classAbbr(this.class)}\t${RRType[this.type]}`;
        if (this.type === RRType.OPT) {
            return `;${s}`;
        }
        return s;
    }

    pack(buf: Writer): number {
        let n = this.name.pack(buf);
        n += buf.writeUint16(this.type);
        n += buf.writeUint16(this.class);
        n += buf.writeUint32(this.ttl);
        // Note, the rdlength may not be set at this point, so this would write 16-zeros. It should
        // be updated when rdata is written (the time when we know how many bytes are written).
        n += buf.writeUint16(this.rdlength);
        return n;
    }

    static unpack(s: Slice): Header {
        const h = new Header(
            s.readDomainName(),
            s.readUint16(),
            s.readUint16(),
            s.readUint32()
        );
        h.rdlength = s.readUint16();
        return h;
    }
}

/**
 * Abstract resource record
 *
 * See also {@link https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3}
 */
export abstract class RR {
    /**
     * The resource record header.
     */
    readonly header: Header;

    constructor(header: Header) {
        this.header = header;
    }

    /**
     * Unpacks RDATA from a sequence of bytes to field(s).
     *
     * @param rdata
     */
    abstract unpackRdata(rdata: Slice): void;

    /**
     * Converts resource record to a sequence of bytes and write to the buffer.
     *
     * @param buf
     * @returns
     */
    pack(buf: Writer): number {
        const n = this.header.pack(buf);
        const pos = buf.byteLength();
        const rdlength = this.packRdata(buf);

        // Update the rdlength in header
        this.header.rdlength = rdlength;
        // Update the rdlength in buffer
        buf.writeUint16At(rdlength, pos - 2);

        return n + rdlength;
    }

    /**
     * Converts RDATA to a sequence of bytes and write to the buffer.
     *
     * @param buf
     */
    abstract packRdata(buf: Writer): number;

    /**
     *
     */
    abstract toString(): string;
}

/**
 * Returns the IP address represented by the address record.
 */
export interface AddressRR {
    address: Address;
}
