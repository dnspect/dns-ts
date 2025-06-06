import { OptCode, Option } from "./option";
import { ParseError } from "../error";
import { binaryToString, stringToBinary } from "../encoding";
import { Writer } from "../buffer";

/**
 * DNS Cookies, a lightweight DNS transaction security mechanism specified as an OPT option.
 *
 * The DNS Cookie mechanism provides limited protection to DNS servers and clients against a variety
 * of increasingly common abuses by off-path attackers.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc7873 | RFC 7873}.
 *
 * COOKIE option, unknown server cookie:
 * ```
 *                       1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |        OPTION-CODE = 10      |       OPTION-LENGTH = 8        |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                                                               |
 *  +-+-    Client Cookie (fixed size, 8 bytes)              -+-+-+-+
 *  |                                                               |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * ```
 *
 * COOKIE Option, known server cookie:
 * ```
 *                          1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |        OPTION-CODE = 10      |   OPTION-LENGTH >= 16, <= 40   |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                                                               |
 *  +-+-    Client Cookie (fixed size, 8 bytes)              -+-+-+-+
 *  |                                                               |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                                                               |
 *  /       Server Cookie  (variable size, 8 to 32 bytes)           /
 *  /                                                               /
 *  +-+-+-+-...
 * ```
 */
export class Cookie extends Option {
    cookie!: Uint8Array;

    constructor(data: Uint8Array) {
        super(OptCode.Cookie);

        // Valid cookie lengths are 8 and 16 to 40 inclusive.
        if (data.byteLength !== 8 && (data.byteLength < 16 || data.byteLength > 40)) {
            throw new ParseError(`malformed cookie option: invalid length ${data.byteLength}`);
        }

        this.cookie = data;
    }

    /**
     * @override
     */
    packOptionData(buf: Writer): number {
        return buf.write(this.cookie);
    }

    /**
     * Refer to {@link https://datatracker.ietf.org/doc/html/rfc5001#section-2.4 | Presentation Format}.
     * @returns
     */
    present(): string {
        const hex = binaryToString(this.cookie, "hex");
        return `; Cookie: ${hex}`;
    }

    /**
     * Creates a Cookie using the passed data.
     *
     * @param data Cookie data
     * @returns Cookie
     */
    static fromData(data: ArrayLike<number> | ArrayBufferLike): Cookie {
        if (data instanceof Uint8Array) {
            return new Cookie(data);
        }
        return new Cookie(new Uint8Array(data));
    }

    /**
     * Parses Cookie from a textual representation.
     *
     * @param input A regular comment string
     *
     * @example
     * ```
     * ; Cookie: 5f798fcd227baee1    // dig
     * ;; Cookie: 6770646E732D736561 // kdig
     * ```
     *
     * Note that the prefix "; Cookie:\s+" may has been stripped from caller.
     */
    static parse(input: string): Cookie {
        const found = input.match(/([0-9a-f]+)/i);
        if (found === null) {
            throw new ParseError(`unrecognized cookie text: "${input}"`);
        }

        const data = stringToBinary(found[1], "hex");
        return new Cookie(data);
    }
}
