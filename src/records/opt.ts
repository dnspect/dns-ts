import { Header, RR } from "../rr";
import { Slice } from "../packet";
import * as edns from "../edns";
import { RRType, Uint16, Uint32, Uint8 } from "../types";
import { ROOT_ZONE } from "../fqdn";
import { Writer } from "../buffer";
import { ParseError } from "../error";

/**
 * OPT pseudo-RR (sometimes called a meta-RR). Refer to {@link https://datatracker.ietf.org/doc/html/rfc6891#section-6 | RFC 6891}.
 *
 * The RR format is defined as:
 *
 *  ```
 *  +------------+--------------+------------------------------+
 *  | Field Name | Field Type   | Description                  |
 *  +------------+--------------+------------------------------+
 *  | NAME       | domain name  | MUST be 0 (root domain)      |
 *  | TYPE       | u_int16_t    | OPT (41)                     |
 *  | CLASS      | u_int16_t    | requestor's UDP payload size |
 *  | TTL        | u_int32_t    | extended RCODE and flags     |
 *  | RDLEN      | u_int16_t    | length of all RDATA          |
 *  | RDATA      | octet stream | {attribute,value} pairs      |
 *  +------------+--------------+------------------------------+
 *  ```
 *
 * TTL (32 bits) field is repurposed to:
 *
 *  ```
 *           +0 (MSB)                            +1 (LSB)
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  |         EXTENDED-RCODE        |            VERSION            |
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  | DO|                           Z                               |
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  ```
 */
export class OPT extends RR {
    private opth: OptHeader | undefined;

    /**
     * EDNS options included in the record.
     */
    options!: edns.Option[];

    unpackRdata(rdata: Slice): void {
        this.options = edns.unpack(rdata);
    }

    packRdata(buf: Writer): number {
        let n = 0;
        for (const option of this.options) {
            n += option.pack(buf);
        }
        return n;
    }

    /**
     * Returns the specialized header field of this OPT record.
     *
     * @returns
     */
    optHeader(): OptHeader {
        if (this.opth === undefined) {
            this.opth = new OptHeader(this.header.ttl, this.header.class);
        }
        return this.opth;
    }

    parseRdata(_rdata: string): void {
        throw new ParseError(`unimplemented!`);
    }

    rdataString(): string {
        const flags = [];
        if (this.optHeader().dnssecOk()) {
            flags.push(" do");
        }

        const sections = new Array<string>();
        sections.push(`; EDNS: version: ${this.optHeader().version()}, flags:${flags.join("")}; udp: ${this.optHeader().udpPayloadSize()}`);

        for (const option of this.options) {
            sections.push(option.toString());
        }

        return sections.join("\n");
    }
}

/**
 * Represents the OPT header which repurpose the regular class and ttl fields.
 */
export class OptHeader {
    private cls: Uint16;
    private ttl: Uint32;

    constructor(ttl: Uint32 = 0, cls: Uint16 = 0) {
        this.ttl = ttl;
        this.cls = cls;
    }

    /**
     * Returns the requestor's UDP payload size.
     *
     * @returns
     */
    udpPayloadSize(): Uint16 {
        return this.cls;
    }

    /**
     * Sets the UDP payload size field of the OPT record.
     *
     * @param size
     */
    setUdpPayloadSize(size: Uint16): void {
        this.cls = size;
    }

    /**
     * Returns the extended rcode data (8 bits).
     *
     * @returns
     */
    extendedRcode(): Uint8 {
        return this.ttl >> 24;
    }

    /**
     * Sets the extended rcode of the message.
     *
     * @param code
     */
    setExtendedRcode(code: Uint8): void {
        this.ttl = (code << 24) + (this.ttl & 0x00FFFFFF);
    }

    /**
     * Returns the number indicating the implementation level of the setter.
     *
     * @returns
     */
    version(): Uint8 {
        return (this.ttl >> 16) & 0x00FF;
    }

    /**
     * Sets the EDNS version of the OPT header.
     *
     * @param version
     */
    setVersion(version: Uint8): void {
        this.ttl = (version << 16) + (this.ttl & 0xFF00FFFF);
    }

    /**
     * Returns a value indicating resolver support of DNSSEC.
     *
     * The bit is defined by {@link https://datatracker.ietf.org/doc/html/rfc3225 | RFC 3225}.
     *
     * @returns
     */
    dnssecOk(): boolean {
        return (this.ttl & 0x00008000) === 0x00008000;
    }

    /**
     * Sets the DNSSEC OK (DO) bit to the given value.
     *
     * @param dnssecOk
     */
    setDnssecOk(dnssecOk: boolean): void {
        if (dnssecOk) {
            this.ttl |= 0x00008000;
        } else {
            this.ttl &= 0xFFFF7FFF;
        }
    }

    /**
     * Unused bits. Set to zero by senders and ignored by receivers, unless modified in a subsequent
     * specification.
     *
     * @returns
     */
    z(): Uint16 {
        return (this.ttl & 0x00007FFF);
    }

    /**
     * Converts to a regular RR header.
     *
     * @returns
     */
    toHeader(): Header {
        return new Header(ROOT_ZONE, RRType.OPT, this.cls, this.ttl);
    }
}

/**
 * Type guard for `OPT`.
 *
 * @param rr
 * @returns
 */
export const isOPT = (rr: RR): rr is OPT => rr.header.type === RRType.OPT;
