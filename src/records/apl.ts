import { Address4, Address6, Prefix } from "@dnspect/ip-address-ts";
import { AddressRR, RR } from "../rr";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { Writer } from "../buffer";
import { ParseError } from "../error";

/**
 * The APL record has the DNS type of "APL" and a numeric value of 42 [IANA]. The APL RR is defined
 * in the IN class only. APL RRs cause no additional section processing.
 *
 * The RDATA section consists of zero or more items (<apitem>) of the form
 * ```
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  |                          ADDRESSFAMILY                        |
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  |             PREFIX            | N |         AFDLENGTH         |
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  /                            AFDPART                            /
 *  |                                                               |
 *  +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 * ```
 */
export class APL extends RR {
    /**
     * List of address prefix items.
     */
    items!: APItem[];

    unpackRdata(rdata: Slice): void {
        this.items = new Array<APItem>();
        while (rdata.remaining() > 0) {
            this.items.push(APItem.unpack(rdata));
        }
    }

    packRdata(buf: Writer): number {
        return this.items.reduce((n, v) => n += v.pack(buf), 0);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.items = rdata.map(v => APItem.parse(v))
    }

    /**
     * The textual representation of an APL RR in a DNS zone file is as follows:
     * 
     * <owner>   IN   <TTL>   APL   {[!]afi:address/prefix}*
     * 
     * The data consists of zero or more strings of the address family indicator <afi>, immediately
     * followed by a colon ":", an address, immediately followed by the "/" character, immediately
     * followed by a decimal numeric value for the prefix length. Any such string may be preceded by
     * a "!" character. The strings are separated by whitespace. The <afi> is the decimal numeric
     * value of that particular address family.
     */
    presentRdata(): string {
        return this.items.join(" ");
    }
}

/**
 * The RDATA section consists of zero or more items (<apitem>) of the form
 * ```
 * +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 * |                          ADDRESSFAMILY                        |
 * +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 * |             PREFIX            | N |         AFDLENGTH         |
 * +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 * /                            AFDPART                            /
 * |                                                               |
 * +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 * ```
 *
 *  ADDRESSFAMILY     16 bit unsigned value as assigned by IANA
 *                    (see IANA Considerations)
 *  PREFIX            8 bit unsigned binary coded prefix length.
 *                    Upper and lower bounds and interpretation of
 *                    this value are address family specific.
 *  N                 negation flag, indicates the presence of the
 *                    "!" character in the textual format.  It has
 *                    the value "1" if the "!" was given, "0" else.
 *  AFDLENGTH         length in octets of the following address
 *                    family dependent part (7 bit unsigned).
 *  AFDPART           address family dependent part.
 */
export class APItem {
    // negation flag, indicates the presence of the "!" character in the textual format. It has the
    // value "1" if the "!" was given, "0" else.
    n!: boolean
    prefix!: Prefix

    /**
     * 
     * @param n 
     * @param prefix 
     */
    constructor(n: boolean, prefix: Prefix) {
        this.n = n;
        this.prefix = prefix;
    }

    static unpack(data: Slice): APItem {
        // 16 bit unsigned value as assigned by IANA  (see IANA Considerations)
        const af = data.readUint16();

        // 8 bit unsigned binary coded prefix length. Upper and lower bounds and interpretation of this
        // value are address family specific.
        const prefix = data.readUint8();

        let b = data.readUint8();
        const n = b >> 7 == 1;

        const dateLength = b & 0x0111_1111;

        switch (af) {
            case 1: {
                if (prefix > 32) {
                    throw new ParseError(`invalid prefix length for IPv4: ${prefix}`);
                }

                if (dateLength > 4) {
                    throw new ParseError(`invalid data length for IPv4: ${dateLength}`);
                }

                // address family dependent part.     
                let dataPart = data.readUint8Array(dateLength);
                if (dataPart.byteLength !== 4) {
                    const x = new Uint8Array(4);
                    x.set(dataPart);
                    dataPart = x;
                }
                const address = Address4.fromBytes(dataPart);
                return new APItem(n, new Prefix(address, prefix));
            }
            case 2: {
                if (prefix > 128) {
                    throw new ParseError(`invalid prefix length for IPv6: ${prefix}`);
                }

                if (dateLength > 16) {
                    throw new ParseError(`invalid data length for IPv6: ${dateLength}`);
                }

                // address family dependent part.     
                let dataPart = data.readUint8Array(dateLength);
                if (dataPart.byteLength !== 16) {
                    const x = new Uint8Array(16);
                    x.set(dataPart);
                    dataPart = x;
                }
                const address = Address6.fromBytes(dataPart);
                return new APItem(n, new Prefix(address, prefix));
            }
            default: {
                throw new ParseError(`invalid address family: ${af}`);
            }
        }
    }

    pack(buf: Writer): number {
        const ip = this.prefix.ip();
        const af = ip.isIPv4() ? 0x1 : 0x2;
        let dataPart = ip.bytes();

        // Ref. https://datatracker.ietf.org/doc/html/rfc3123#section-4
        //
        // .. for DNSSEC [RFC2535] a single wire encoding must be used by
        // all. Therefore the sender MUST NOT include trailing zero octets in
        // the AFDPART regardless of the value of PREFIX. This includes cases
        // in which AFDLENGTH times 8 results in a value less than PREFIX. The
        // AFDPART is padded with zero bits to match a full octet boundary.
        if (dataPart[-1] === 0) {
            dataPart = dataPart.slice(0, dataPart.lastIndexOf(0));
        }

        return buf.writeUint16(af) +
            buf.writeUint8(this.prefix.length()) +
            buf.writeUint8((this.n ? 0x1000_0000 : 0x0000_0000) | dataPart.byteLength) +
            buf.write(dataPart);
    }

    /**
     * Parses an address family textual.
     * 
     * @param item 
     * @returns 
     * @throws ParseError
     */
    static parse(text: CharacterString): APItem {
        const found = text.raw().match(/^(\!?)([1-2]):([^\/]+\/[0-9]{0,3})$/i);
        if (found === null) {
            throw new ParseError(`invalid apitem text: "${text}"`);
        }

        const n = found[1] == "!";

        switch (found[2]) {
            case '1': {
                const prefix = Prefix.parse(found[3]);
                if (!prefix.ip().isIPv4()) {
                    throw new ParseError(`Address prefix "${found[3]}" is not an IPv4 prefix`);
                }

                return new APItem(n, prefix);
            }
            case '2': {
                const prefix = Prefix.parse(found[3]);
                if (!prefix.ip().isIPv6()) {
                    throw new ParseError(`Address prefix "${found[3]}" is not an IPv6 prefix`);
                }

                return new APItem(n, prefix);
            }
            default: {
                throw new ParseError(`invalid address family: "${found[2]}"`);
            }
        }
    }

    /**
     * The textual representation of an APItem in a DNS zone file is as follows:
     * 
     *   [!]afi:address/prefix
     * 
     * The data consists of the address family indicator <afi>, immediately followed by a colon ":",
     * an address, immediately followed by the "/" character, immediately followed by a decimal
     * numeric value for the prefix length. Any such string may be preceded by a "!" character. The
     * <afi> is the decimal numeric value of that particular address family.
     */
    toString(): string {
        const af = this.prefix.ip().isIPv4() ? '1' : '2';
        return `${this.n ? '!' : ''}${af}:${this.prefix.toString()}`;
    }
}
