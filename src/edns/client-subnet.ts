import { Address, Address4, Address6, Prefix } from "@dnspect/ip-address-ts";
import { OptCode, Option } from "./option";
import { BufferReader, Writer } from "../buffer";
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
    address!: Address;
    sourcePrefixLength!: Uint8;
    scopePrefixLength!: Uint8;

    constructor(address: Address, sourcePrefixLength: Uint8, scopePrefixLength: Uint8) {
        super(OptCode.ClientSubnet);

        this.address = address;
        this.sourcePrefixLength = sourcePrefixLength;
        this.scopePrefixLength = scopePrefixLength;
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
     * @param prefix An IP prefixh.
     * @returns ClientSubnet
     */
    static fromPrefix(prefix: Prefix): ClientSubnet {
        return new ClientSubnet(prefix.ip(), prefix.length(), 0);
    }

    /**
     * Creates a ClientSubnet using the passed data.
     *
     * @param optionData ClientSubnet data
     * @returns ClientSubnet
     */
    static fromData(optionData: ArrayLike<number> | ArrayBufferLike): ClientSubnet {
        const reader = new BufferReader(optionData);

        const family = reader.readUint16BE(0);
        const sourcePrefixLength = reader.readUint8(2);
        const scopePrefixLength = reader.readUint8(3);
        let address = null;

        switch (family) {
            case 1:
                address = Address4.fromBytes(reader.slice(4));
                break;
            case 2:
                address = Address6.fromBytes(reader.slice(16));
                break;
            default:
                throw new ParseError(`invalid address family: ${family}`);
        }

        if (address.bits() < sourcePrefixLength) {
            throw new ParseError(
                `invalid source prefix length ${sourcePrefixLength} for address family ${family}`
            );
        }

        if (address.bits() < scopePrefixLength) {
            throw new ParseError(
                `invalid scope prefix length ${scopePrefixLength} for address family ${family}`
            );
        }

        return new ClientSubnet(address, sourcePrefixLength, scopePrefixLength);
    }

    /**
     * Parses ClientSubnet from a textual representation.
     *
     * @param input A regular comment string.
     *
     * @example
     * ```
     * ; CLIENT-SUBNET: 1.2.3.4/32/0 // dig
     * ;; CLIENT-SUBNET: 1.2.3.4/32/0 // kdig
     * ```
     *
     * Note that the prefix "; CLIENT-SUBNET:\s+" may has been stripped from caller.
     */
    static parse(input: string): ClientSubnet {
        const found = input.match(/(CLIENT-SUBNET:\s+)?([^/]+\/[0-9]+)\/([0-9]+)/i);
        if (found === null) {
            throw new ParseError(`unrecognized CLIENT-SUBNET text: "${input}"`);
        }

        const prefix = Prefix.parse(found[2]);
        const scope = parseInt(found[3]);
        return new ClientSubnet(prefix.ip(), prefix.length(), scope);
    }
}
