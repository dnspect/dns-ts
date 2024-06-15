import { Writer } from "./buffer";
import { EncodingScheme, stringToBinary } from "./encoding";
import { Slice } from "./packet";
import { Uint8 } from "./types";

/**
 * QuoteMode define the ways how to do quoting for the CharacterString.
 */
export enum QuoteMode {
    /**
     * When there is any character of [" ", "(", ")", ";", "@"], quote the string.
     */
    Dynamic,
    /**
     * Always quote the string. E.g. presenting TXT contents.
     */
    Always,
    /**
     * Never quote the string. Used when presenting domain names.
     */
    Never,
}

/**
 * CharacterString (aka <character-string> in the RFCs) is a single length octet followed by that
 * number of characters. CharacterString is treated as binary information, and can be up to 256
 * characters in length (including the length octet).
 */
export class CharacterString {
    private str: string;

    constructor(str: string) {
        this.str = str;
    }

    /**
     * Returns the raw character string.
     *
     * @returns The raw character string
     */
    toString(): string {
        return this.raw();
    }

    /**
     * Returns the raw character string.
     *
     * Note that, in order to get the textual representation, call `present()` instead.
     *
     * @returns The raw character string
     */
    raw(): string {
        return this.str;
    }

    /**
     * Returns the presentation format (ASCII representation) of the character
     * string to be used in zonefile and/or dig-like output.
     *
     * ```txt
     * <character-string> is expressed in one or two ways: as a contiguous set
     * of characters without interior spaces, or as a string beginning with a "
     * and ending with a ".  Inside a " delimited string any character can
     * occur, except for a " itself, which must be quoted using \ (back slash).
     * ```
     *
     * @see https://datatracker.ietf.org/doc/html/rfc1035#section-5.1
     *
     * @param alwaysQuote Always quote the string no matter whether or not there is interior spaces.
     *
     * @returns The textual representation.
     */
    present(quote: QuoteMode = QuoteMode.Dynamic): string {
        const out = new Array<string>(this.str.length + 2);
        let requireQuote = quote === QuoteMode.Always;
        // A set of char that indicate requirement for quoting the final string.
        const qList = quote === QuoteMode.Never ? [] : [" ", "(", ")", ";", "@"];
        // A set of char that should be \X escaped.
        const xList = quote === QuoteMode.Never ? ['"', "\\", "(", ")", ";", "@"] : ['"', "\\"];

        for (const ch of this.str) {
            if (qList.includes(ch)) {
                requireQuote = true;
                out.push(ch);
                continue;
            }

            if (xList.includes(ch)) {
                // \X escaping char that has special meaning in DNS textual representation.
                out.push("\\");
                out.push(ch);
                continue;
            }

            if (ch <= " " || ch > "~") {
                // \DDD escaping char that is not visible.
                out.push("\\");
                const code = ch.charCodeAt(0);
                if (code < 10) {
                    out.push("00");
                } else if (code < 100) {
                    out.push("0");
                }
                out.push(code.toString());
                continue;
            }

            out.push(ch);
        }

        // Quote the string when it has interior spaces.
        if (requireQuote) {
            return `"${out.join("")}"`;
        }

        return out.join("");
    }

    /**
     * Packs the character string into buffer.
     *
     * @param buf The destination buffer.
     * @returns Number of bytes written.
     */
    pack(buf: Writer): number {
        return buf.writeUint8(this.str.length) + buf.writeString(this.str, "ascii");
    }

    /**
     * Unpacks a character string from a slice of bytes.
     *
     * @param s A slice of bytes
     * @returns A character string
     */
    static unpack(s: Slice): CharacterString {
        const len = s.readUint8();
        const str = s.readString("ascii", len);
        return new CharacterString(str);
    }

    toNumber(max: number): number | null {
        if (!/^\d+$/.test(this.str)) {
            return null;
        }

        const n = parseInt(this.str);
        if (n > max) {
            return null;
        }
        return n;
    }

    toUint8(): Uint8 | null {
        return this.toNumber(0xff);
    }

    toUint16(): Uint8 | null {
        return this.toNumber(0xffff);
    }

    toUint32(): Uint8 | null {
        return this.toNumber(0xffffffff);
    }

    toBinary(scheme: EncodingScheme): Uint8Array {
        return stringToBinary(this.str, scheme);
    }
}
