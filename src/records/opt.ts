import { Header, RR } from "../rr";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import * as edns from "../edns";
import { rcodeFrom, RRType, Uint16, Uint32, Uint8 } from "../types";
import { ROOT_ZONE } from "../fqdn";
import { Writer } from "../buffer";
import { ParseError, SemanticError } from "../error";

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

    // ; <<>> DiG 9.18.24-0ubuntu0.22.04.1-Ubuntu <<>> @8.8.8.8 TXT a  b\t\n\k@#( )";:<>%{}|^`?/.com +nsid +subnet=1.2.3.4
    // ; (1 server found)
    // ;; global options: +cmd
    // ;; Got answer:
    // ;; ->>HEADER<<- opcode: QUERY, status: REFUSED, id: 57210
    // ;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1
    //
    // ;; OPT PSEUDOSECTION:
    // ; EDNS: version: 0, flags:; udp: 512
    // ; EDE: 49152: (Provided ECS includes 32 bits, but no more than 24 are allowed. https://developers.google.com/speed/public-dns/docs/ecs)
    // ; CLIENT-SUBNET: 1.2.3.4/32/0
    // ; NSID: 67 70 64 6e 73 2d 73 65 61 ("gpdns-sea")
    // ;; QUESTION SECTION:
    // ;a\009btnk\@#\(\032\)\"\;:<>%{}|^`?/.com. IN TXT
    //
    // ;; Query time: 9 msec
    // ;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
    // ;; WHEN: Sat Jun 15 02:00:13 PDT 2024
    // ;; MSG SIZE  rcvd: 207

    parseRdata(rdata: CharacterString[]): void {
        for (const line of rdata) {
            const found = line.raw().match(/^([a-z0-9-]+)[:\s]+(.+)/i);
            if (found === null) {
                // Ignore unrecognized lines.
                continue;
            }

            switch (found[1].toUpperCase()) {
                case "EDNS":
                case "VERSION": {
                    // Ignore the header that has been parsed when initializing this OPT record.
                    break;
                }
                case "EDE": {
                    const ede = edns.ExtendedError.parse(found[2]);
                    this.options.push(ede);
                    break;
                }
                case "CLIENT-SUBNET": {
                    const cs = edns.ClientSubnet.parse(found[2]);
                    this.options.push(cs);
                    break;
                }
                case "NSID": {
                    const nsid = edns.NSID.parse(found[2]);
                    this.options.push(nsid);
                    break;
                }
                case "COOKIE": {
                    const nsid = edns.Cookie.parse(found[2]);
                    this.options.push(nsid);
                    break;
                }
                case "PADDING": {
                    const nsid = edns.Padding.parse(found[2]);
                    this.options.push(nsid);
                    break;
                }
            }
        }
    }

    presentRdata(): string {
        return this.options.map((o) => o.present()).join("\n");
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
        this.ttl = (code << 24) + (this.ttl & 0x00ffffff);
    }

    /**
     * Returns the number indicating the implementation level of the setter.
     *
     * @returns
     */
    version(): Uint8 {
        return (this.ttl >> 16) & 0x00ff;
    }

    /**
     * Sets the EDNS version of the OPT header.
     *
     * @param version
     */
    setVersion(version: Uint8): void {
        this.ttl = (version << 16) + (this.ttl & 0xff00ffff);
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
            this.ttl &= 0xffff7fff;
        }
    }

    /**
     * Unused bits. Set to zero by senders and ignored by receivers, unless modified in a subsequent
     * specification.
     *
     * @returns
     */
    z(): Uint16 {
        return this.ttl & 0x00007fff;
    }

    /**
     * Converts to a regular RR header.
     *
     * @returns
     */
    toHeader(): Header {
        return new Header(ROOT_ZONE, RRType.OPT, this.cls, this.ttl);
    }

    present(): string {
        const flags = [];
        if (this.dnssecOk()) {
            flags.push(" do");
        }
        return `; EDNS: version: ${this.version()}, flags:${flags.join("")}; udp: ${this.udpPayloadSize()}`;
    }

    /**
     * Parses EDNS header from a textual representation generated by dig or kdig.
     *
     * @param input
     *
     * @example
     * ```
     * ; EDNS: version: 0, flags:; udp: 512  // dig
     * ;; Version: 0; flags: ; UDP size: 1232 B; ext-rcode: NOERROR // kdig
     * ```
     */
    static parse(input: string): OptHeader {
        const foundVersion = input.match(/version[^\d]+(\d+)/i);
        if (foundVersion === null) {
            throw new ParseError("unsupported EDNS header text");
        }

        const version = parseInt(foundVersion[1]);
        if (version > 0xff) {
            throw new SemanticError(`invalid version: ${version}`);
        }

        const h = new OptHeader();
        h.setVersion(version);

        const foundFlags = input.match(/flags[^\w]+([^;]+);/i);
        if (foundFlags !== null) {
            const flags = foundFlags[1].trim().toLowerCase().split(" ");
            h.setDnssecOk(flags.includes("do"));
        }

        const foundUdp = input.match(/udp[^\d]+([\d]+)/i);
        if (foundUdp !== null) {
            const udpPayloadSize = parseInt(foundUdp[1]);
            if (udpPayloadSize > 0xffff) {
                throw new SemanticError(`invalid udp payload size: ${udpPayloadSize}`);
            }
            h.setUdpPayloadSize(udpPayloadSize);
        }

        const foundRcode = input.match(/ext-rcode[^\w]+(\w+)/i);
        if (foundRcode !== null) {
            const rcode = rcodeFrom(foundRcode[1]);
            if (rcode !== null) {
                h.setExtendedRcode(rcode);
            }
        }

        return h;
    }
}

/**
 * Type guard for `OPT`.
 *
 * @param rr
 * @returns
 */
export const isOPT = (rr: RR): rr is OPT => rr.header.type === RRType.OPT;
