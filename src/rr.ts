/* tslint:disable:max-classes-per-file */

import { Address } from "@dnspect/ip-address-ts";
import { FQDN } from "./fqdn";
import { CharacterString } from "./char";
import {  Slice } from "./packet";
import { Class, RRType, Uint16, Uint32 } from "./types";
import { Writer } from "./buffer";

/**
 * Header represents the fields before the record data.
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
        this.name = name instanceof FQDN ? name : FQDN.parse(name);
        this.type = type;
        this.class = cls;
        this.ttl = ttl;
        this.rdlength = 0;
    }

    /**
     * Checks if the header is same with another one.
     *
     * Note that this check ignores TTL difference.
     *
     * @param other Other header.
     * @returns True if class, type, and name are same.
     */
    same(other: Header): boolean {
        return this.class === other.class && this.type === other.type && this.name.equal(other.name);
    }

    toString(): string {
        return `${this.name}\t\t${this.ttl}\t${Class[this.class]}\t${
            RRType[this.type]
        }`;
    }

    pack(buf: Writer): number {
        let n = buf.writeName(this.name, true);
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
            s.readName(),
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
     * @param rdata Slice
     *
     * @throws ParseError
     */
    abstract unpackRdata(rdata: Slice): void;

    /**
     * Converts resource record to a sequence of bytes and write to the buffer.
     *
     * @param buf The destination buffer.
     * @returns number of bytes written.
     *
     * @throws Error
     */
    pack(buf: Writer): number {
        const n = this.header.pack(buf);
        // The position before rdata is written.
        const pos = buf.byteOffset();
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
     *
     * @throws Error
     */
    abstract packRdata(buf: Writer): number;

    /**
     * Parses the RFC 1035 compliant textual format of RDATA.
     *
     * @param rdata A non-empty slice of character strings.
     *
     * @throws ParseError
     */
    abstract parseRdata(rdata: CharacterString[]): void;

    /**
     * Expresses the RDATA in it's RFC 1035 compliant textual representation.
     */
    abstract presentRdata(): string;

    /**
     * Returns RFC 1035 compliant textual representation of the resource record.
     */
    toString(): string {
        if (this.header.type === RRType.OPT) {
            return this.presentRdata();
        }
        return `${this.header}\t${this.presentRdata()}`;
    }

    /**
     * Returns JSON object of the RR that will generate textual in application/dns-json format.
     */
    toJsonObject(): object {
        return {
            name: this.header.name.toString(),
            type: this.header.type,
            TTL: this.header.ttl,
            data: this.presentRdata(),
        };
    }
}

/**
 * Returns the IP address represented by the address record.
 */
export interface AddressRR {
    address: Address;
}
