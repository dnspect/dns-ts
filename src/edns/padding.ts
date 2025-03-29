import { OptCode, Option } from "./option";
import { Writer } from "../buffer";
import { Uint16 } from "../types";
import { ParseError } from "../error";

/**
 * Padding option is used to allow DNS clients and servers to artificially increase the size of a
 * DNS message by a variable number of bytes, hampering size-based correlation of the encrypted
 * message.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc7830 | RFC 7830}.
 */
export class Padding extends Option {
    size!: Uint16;

    /**
     * Creates a Padding of requested size.
     *
     * @param size
     */
    constructor(size: Uint16) {
        super(OptCode.Padding);
        this.size = size;
    }

    packOptionData(buf: Writer): number {
        return buf.write(new Uint8Array(this.size));
    }

    /**
     * @returns
     */
    present(): string {
        return `; PADDING: ${this.size}`;
    }

    /**
     * Parses Padding from a textual representation.
     *
     * @param input A regular comment string.
     *
     * @example
     * ```
     * ; PADDING: 370 // dig
     * ;; PADDING: 370 B // kdig
     * ```
     * Note that the prefix "; PADDING:\s+" may has been stripped from caller.
     */
    static parse(input: string): Padding {
        const found = input.match(/(PADDING:\s+)?(\d+)/i);
        if (found === null) {
            throw new ParseError(`unrecognized PADDING text: "${input}"`);
        }

        return new Padding(parseInt(found[2]));
    }
}
