import { Address, Address4, Address6, Prefix } from "@dnspect/ip-address-ts";
import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { Writer } from "../buffer";
import { Uint8 } from "../types";
import { ParseError } from "../error";

/**
 * ClientSubnet option is in active use to carry information about the network that originated a DNS
 * query and the network for which the subsequent response can be cached.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc7871 | RFC 7871}.
 *
 *                +0 (MSB)                            +1 (LSB)
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  0: |                          OPTION-CODE                          |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  2: |                         OPTION-LENGTH                         |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  4: |                            FAMILY                             |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  6: |     SOURCE PREFIX-LENGTH      |     SCOPE PREFIX-LENGTH       |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  8: |                           ADDRESS...                          /
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 */
export class ClientSubnet extends Option {
    sourcePrefixLength!: Uint8;
    scopePrefixLength!: Uint8;
    address!: Address;

    constructor(data: Slice | Prefix) {
        super(OptCode.ClientSubnet);

        if (data instanceof Slice) {
            const family = data.readUint16();
            this.sourcePrefixLength = data.readUint8();
            this.scopePrefixLength = data.readUint8();

            switch (family) {
                case 1:
                    this.address = Address4.fromBytes(data.readUint8Array(4));
                    break;
                case 2:
                    this.address = Address6.fromBytes(data.readUint8Array(16));
                    break;
                default:
                    throw new ParseError(`invalid address family: ${family}`);
            }

            if (this.address.bits() < this.sourcePrefixLength) {
                throw new ParseError(
                    `invalid source prefix length ${this.sourcePrefixLength} for address family ${family}`
                );
            }

            if (this.address.bits() < this.scopePrefixLength) {
                throw new ParseError(
                    `invalid scope prefix length ${this.scopePrefixLength} for address family ${family}`
                );
            }
        } else {
            this.address = data.ip();
            this.sourcePrefixLength = data.length();
            this.scopePrefixLength = 0;
        }
    }

    packOptionData(buf: Writer): number {
        let n = buf.writeUint16(this.address.isIPv4() ? 1 : 2);
        n += buf.writeUint8(this.sourcePrefixLength);
        n += buf.writeUint8(this.scopePrefixLength);
        n += buf.write(this.address.bytes());
        return n;
    }

    /**
     * Refer to {@link https://datatracker.ietf.org/doc/html/rfc5001#section-2.4 | Presentation Format}.
     * @returns
     */
    present(): string {
        return `; CLIENT-SUBNET: ${this.address.toString()}/${this.sourcePrefixLength}/${this.scopePrefixLength}`;
    }

    /**
     * Creates a ClientSubnet from an IP prefix.
     *
     * @param id
     * @param encoding
     * @returns
     */
    static fromPrefix(prefix: Prefix): ClientSubnet {
        return new ClientSubnet(prefix);
    }

    /**
     * Creates a ClientSubnet using the passed data.
     *
     * @param data ClientSubnet data
     * @returns
     */
    static from(data: ArrayLike<number> | ArrayBufferLike): ClientSubnet {
        return new ClientSubnet(Slice.from(data));
    }

    /**
     * Parses ClientSubnet from a textual representation.
     *
     * @param input A regular comment string that has stripped out "CLIENT-SUBNET: "
     *
     * @example
     * ```
     * ; CLIENT-SUBNET: 1.2.3.4/32/0 // dig
     * ;; CLIENT-SUBNET: 1.2.3.4/32/0 // kdig
     * ```
     *
     * Note that the prefix "; CLIENT-SUBNET:\s+" should has been stripped from caller.
     */
    static parse(input: string): ClientSubnet {
        const found = input.match(/^([^/]+\/[0-9]+)\/([0-9]+)/i);
        if (found === null) {
            throw new ParseError(`unrecognized CLIENT-SUBNET text: "${input}"`);
        }

        const prefix = Prefix.parse(found[1]);
        const scope = parseInt(found[2]);
        const cs = new ClientSubnet(prefix);
        cs.scopePrefixLength = scope;
        return cs;
    }
}
