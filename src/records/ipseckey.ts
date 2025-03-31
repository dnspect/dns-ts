import { Address4, Address6 } from "@dnspect/ip-address-ts";
import { binaryToString, stringToBinary } from "../encoding";
import { ParseError } from "../error";
import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint8 } from "../types";
import { Writer } from "../buffer";
import { CharacterString } from "../char";

/**
 * The IPSECKEY resource record is used to store IPsec public keys in DNS, as described in RFC 4025.
 *
 * This enables IPsec Security Associations (SAs) to be established using DNS-based key discovery.
 *
 * RDATA wire format:
 * ```
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |  precedence   | gateway type  |  algorithm  |     gateway     |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-------------+                 +
 * ~                            gateway                            ~
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                                                               /
 * /                          public key                           /
 * /                                                               /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
 * ```
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc4025 | RFC 4025}
 */
export class IPSECKEY extends RR {
    /**
     * The precedence field specifies the priority among multiple IPSECKEY records.
     */
    precedence!: Uint8;

    /**
     * Algorithm used for the public key (e.g., RSA) determines the format of the public key field.
     *
     * A value of 0 indicates that no key is present.
     *
     * The following values are defined:
     * 1  A DSA key is present, in the format defined in RFC 2536.
     * 2  A RSA key is present, in the format defined in RFC 3110.
     */
    algorithm!: Uint8;

    /**
     * Gateway address or domain name, depending on gatewayType.
     *
     * Gateway type indicates how the gateway field is interpreted:
     * 0 = no gateway, 1 = IPv4 address, 2 = IPv6 address, 3 = domain name
     *
     * See also {@link https://datatracker.ietf.org/doc/html/rfc4025#section-2.5}
     */
    gateway!: null | Address4 | Address6 | FQDN;

    /**
     * Public key material (algorithm-specific).
     */
    publicKey!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.precedence = rdata.readUint8();
        const gatewayType = rdata.readUint8();
        this.algorithm = rdata.readUint8();

        // Parse gateway
        switch (gatewayType) {
            case 0:
                this.gateway = null;
                break;
            case 1:
                this.gateway = Address4.fromBytes(rdata.readUint8Array(4));
                break;
            case 2:
                this.gateway = Address6.fromBytes(rdata.readUint8Array(16));
                break;
            case 3:
                this.gateway = rdata.readName();
                break;
            default:
                throw new ParseError(`Unknown gateway type: ${gatewayType}`);
        }

        this.publicKey = rdata.readUint8Array();
    }

    packRdata(buf: Writer): number {
        let n = 0;
        n += buf.writeUint8(this.precedence);

        if (this.gateway instanceof Address4) {
            n += buf.writeUint8(1);
            n += buf.writeUint8(this.algorithm);
            n += buf.write(this.gateway.bytes());
        } else if (this.gateway instanceof Address6) {
            n += buf.writeUint8(2);
            n += buf.writeUint8(this.algorithm);
            n += buf.write(this.gateway.bytes());
        } else if (this.gateway instanceof FQDN) {
            n += buf.writeUint8(3);
            n += buf.writeUint8(this.algorithm);
            n += buf.writeName(this.gateway, false);
        } else {
            n += buf.writeUint8(0);
            n += buf.writeUint8(this.algorithm);
        }

        n += buf.write(this.publicKey);
        return n;
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`Missing RDATA fields in IPSECKEY`);
            case 1:
                throw new ParseError(`Missing <GATEWAY-TYPE> in RDATA`);
            case 2:
                throw new ParseError(`Missing <ALGORITHM> in RDATA`);
            case 3:
                throw new ParseError(`Missing <GATEWAY> in RDATA`);
            case 4:
                throw new ParseError(`Missing <PUBLIC-KEY> in RDATA`);
        }

        this.precedence = rdata[0].toUint8() ??
            (() => {
                throw new ParseError("invalid <PRECEDENCE> in RDATA");
            })();
        const gatewayType = rdata[1].toUint8() ??
            (() => {
                throw new ParseError("invalid <GATEWAY-TYPE> in RDATA");
            })();
        this.algorithm = rdata[2].toUint8() ??
            (() => {
                throw new ParseError("invalid <ALGORITHM> in RDATA");
            })();

        switch (gatewayType) {
            case 0:
                this.gateway = null;
                break;
            case 1:
                this.gateway = Address4.parse(rdata[3].raw());
                break;
            case 2:
                this.gateway = Address6.parse(rdata[3].raw());
                break;
            case 3:
                this.gateway = FQDN.parse(rdata[3].raw());
                break;
            default:
                throw new ParseError(`unsupported <GATEWAY-TYPE> in RDATA: ${gatewayType}`);
        }

        this.publicKey = stringToBinary(rdata[4].raw(), "base64");
    }

    /**
     * Presents IPSECKEY RDATA in a zonefile textual format.
     *
     * See also {@link https://datatracker.ietf.org/doc/html/rfc4025#section-3.1}
     */
    presentRdata(): string {
        let gatewayType = 0;
        if (this.gateway instanceof Address4) {
            gatewayType = 1;
        } else if (this.gateway instanceof Address6) {
            gatewayType = 2;
        } else if (this.gateway instanceof FQDN) {
            gatewayType = 3;
        }

        const key = binaryToString(this.publicKey, "base64");

        return `${this.precedence} ${gatewayType} ${this.algorithm} ${this.gateway || "."} ${key}`;
    }
}
