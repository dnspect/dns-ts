import { Uint8 } from "./types";

/**
 * Base32 encoding variants.
 */
export enum Base32Spec {
    /**
     * The standard base32 alphabet defined in RFC 4648.
     */
    Standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    /**
     * The "Extended Hex Alphabet" defined in RFC 4648. It is typically used in DNS.
     */
    ExtendedHex = "0123456789ABCDEFGHIJKLMNOPQRSTUV",
}

/**
 *
 */
const StandardPadding = "=";
const NoPadding = "";

/**
 * The Base 32 encoding is designed to represent arbitrary sequences of octets in a form that needs
 * to be case insensitive but that need not be human readable.
 *
 * A 33-character subset of US-ASCII is used, enabling 5 bits to be represented per printable
 * character.  (The extra 33rd character, "=", is used to signify a special processing function.)
 *
 * Refer to {@link https://datatracker.ietf.org/doc/html/rfc4648#section-6 | RFC 4648 } for details.
 *
 * The Base 32 alphabet table:
 * ```
 * Value Encoding  Value Encoding  Value Encoding  Value Encoding
 *     0 A             9 J            18 S            27 3
 *     1 B            10 K            19 T            28 4
 *     2 C            11 L            20 U            29 5
 *     3 D            12 M            21 V            30 6
 *     4 E            13 N            22 W            31 7
 *     5 F            14 O            23 X
 *     6 G            15 P            24 Y         (pad) =
 *     7 H            16 Q            25 Z
 *     8 I            17 R            26 2
 * ```
 *
 * Following "Extended Hex" Base 32 alphabet is used by the {@link https://datatracker.ietf.org/doc/html/rfc4648#section-7 | base32hex} variant.
 * ```
 * Value Encoding  Value Encoding  Value Encoding  Value Encoding
 *     0 0             9 9            18 I            27 R
 *     1 1            10 A            19 J            28 S
 *     2 2            11 B            20 K            29 T
 *     3 3            12 C            21 L            30 U
 *     4 4            13 D            22 M            31 V
 *     5 5            14 E            23 N
 *     6 6            15 F            24 O         (pad) =
 *     7 7            16 G            25 P
 *     8 8            17 H            26 Q
 * ```
 */
export class Decoder {
    private alphabet: Base32Spec;
    private padding: string = StandardPadding;
    private output = "";

    /**
     * Number of bits carried from previous byte when they didn't fit in 5-bit group.
     */
    private leftoverBits: Uint8 = 0;
    /**
     * The value of the leftover bits.
     */
    private leftoverValue: Uint8 = 0;

    constructor(spec: Base32Spec = Base32Spec.Standard) {
        if (spec.length !== 32) {
            throw new Error(`encoding spec is not 32-characters long: ${spec.length}`);
        }
        this.alphabet = spec;
    }

    /**
     * Specify a new padding character.
     *
     * @param padding
     * @returns
     */
    withPadding(padding: string): Decoder {
        if (padding.length !== 1) {
            throw new Error(`padding should be a single character`);
        }

        if (this.alphabet.indexOf(padding.toLowerCase()) >= 0 || this.alphabet.indexOf(padding.toUpperCase()) >= 0) {
            throw new Error(`padding contained in alphabet`);
        }

        this.padding = padding;
        return this;
    }

    private decodeByte(current: Uint8): void {
        let value = 0;
        let bitsLeft = 3;
        if (this.leftoverBits > 0) {
            // Number of low bits of current byte is left in this round
            bitsLeft = 3 + this.leftoverBits;
            value = (this.leftoverValue << (5 - this.leftoverBits)) + (current >> bitsLeft);
        } else {
            bitsLeft = 3;
            // Take high 5 bits from the 8 bits octet.
            value = current >> 3;
        }

        this.output += this.alphabet[value];
        this.leftoverBits = bitsLeft;
        this.leftoverValue = current & (0xFF >> (8 - bitsLeft));

        // Has another 5-bit group
        if (this.leftoverBits > 5) {
            this.leftoverBits -= 5;
            this.output += this.alphabet[this.leftoverValue >> this.leftoverBits];
            this.leftoverValue = (this.leftoverValue & (0xFF >>> (8 - this.leftoverBits)));
        }
    }

    public finish(): string {
        if (this.leftoverBits > 0) {
            this.output += this.alphabet[this.leftoverValue << (5 - this.leftoverBits)];
        }

        const n = this.output.length % 8;
        if (n > 0 && this.padding !== NoPadding) {
            this.output += this.padding.repeat(8 - n);
        }

        const result = this.output;

        // Reset state
        this.output = "";
        this.leftoverBits = 0;
        this.leftoverValue = 0;

        return result;
    }

    /**
     * Decodes the binary data and returns produced string.
     *
     * @param data
     * @returns
     */
    decode(data: Uint8Array): string {
        this.update(data);
        return this.finish();
    }

    /**
     * Encodes a slice of bytes.
     *
     * @param data
     * @returns
     */
    update(data: Uint8Array): void {
        for (let i = 0; i < data.length; i++) {
            this.decodeByte(data[i]);
        }
    }
}

export class Encoder {
    private lookupTable: { [charCode: Uint8]: Uint8 | undefined } = {};
    private padding: string = StandardPadding;

    constructor(spec: Base32Spec = Base32Spec.Standard) {
        if (spec.length !== 32) {
            throw new Error(`decoding spec is not 32-characters long: ${spec.length}`);
        }

        for (let i = 0; i < spec.length; i++) {
            let code = spec.charCodeAt(i);
            // normalize to upper case
            if (code >= 0x61 && code <= 0x7A) {
                code -= 0x20;
            }
            this.lookupTable[code] = i;
        }
    }

    /**
     * Specify a new padding character.
     *
     * @param padding
     * @returns
     */
    withPadding(padding: string): Encoder {
        if (padding.length !== 1) {
            throw new Error(`padding should be a single character`);
        }

        let code = padding.charCodeAt(0);
        // normalize to upper case
        if (code >= 0x61 && code <= 0x7A) {
            code -= 0x20;
        }

        if (this.lookupTable[code] !== undefined) {
            throw new Error(`padding contained in alphabet`);
        }

        this.padding = padding;
        return this;
    }

    encodeToBinary(src: string): Uint8Array {
        if (src.length === 0) {
            return new Uint8Array(0);
        }

        let bytesLen!: number;
        if (this.padding === NoPadding) {
            bytesLen = Math.floor(src.length * 5 / 8);
        } else {
            const paddingStart = src.indexOf(this.padding);
            if (paddingStart > 0) {
                bytesLen = Math.floor(paddingStart * 5 / 8);
            } else {
                bytesLen = Math.floor(src.length * 5 / 8);
            }
        }

        const out = new Uint8Array(bytesLen);
        this.encode(src, out);
        return out;
    }

    /**
     * Encodes the input, write the binary data to the buffer, and return the number of bytes
     * written.
     *
     * @param src
     * @param dst
     *
     * @return Return number of bytes written.
     */
    encode(src: string, dst: Uint8Array): number {
        if (src.length === 0) {
            return 0;
        }

        let charLen = src.length;
        if (this.padding !== NoPadding) {
            if ((src.length % 8) !== 0) {
                throw new Error(`malformed base32 string: wrong padding: a`);
            }

            const paddingStart = src.indexOf(this.padding);

            // Per RFC, the only possible number of padding chars are 0, 1, 3, 4 and 6.
            if (paddingStart >= 0) {
                if (![0, 1, 3, 4, 6].includes(src.length - paddingStart)) {
                    throw new Error(`malformed base32 string: wrong padding: ${src.length - paddingStart}`);
                }
                for (const ch of src.substring(paddingStart)) {
                    if (ch !== this.padding) {
                        throw new Error(`malformed base32 string: wrong padding: c`);
                    }
                }
                charLen = paddingStart;
            }
        }

        let bits = 0;
        let value = 0;
        let index = 0;

        for (let i = 0; i < charLen; i++) {
            let code = src.charCodeAt(i);
            // normalize to upper case
            if (code >= 0x61 && code <= 0x7A) {
                code -= 0x20;
            }

            const bitGroup = this.lookupTable[code];
            if (bitGroup === undefined) {
                throw new Error(`invalid character found: '${src[i]}' at position ${i}`);
            }

            value = (value << 5) + bitGroup;
            bits += 5;

            // Form one byte
            if (bits >= 8) {
                bits -= 8;
                dst[index++] = value >>> bits;
                value = value & (0xFF >> (8 - bits));
            }
        }

        // The last char should never indicate there is another byte, or there should be another
        // char encoded.
        if (value > 0 && bits > 0) {
            throw new Error(`invalid character found: '${src[charLen - 1]}' at position ${charLen - 1}`);
        }

        return index;
    }
}

const stdEncoder = new Encoder();
const stdDecoder = new Decoder();

/**
 * Encodes the binary data to standard base32 string.
 *
 * @param data The complete binary data.
 * @returns
 */
export function decode(data: Uint8Array): string {
    return stdDecoder.decode(data);
}

/**
 * Encodes the standard base32 string to binary data.
 *
 * @param input The standard base32 encoded string.
 * @returns
 *
 * @throws Error Throws decoding errors if the input is invalid.
 */
export function encode(input: string): Uint8Array {
    return stdEncoder.encodeToBinary(input);
}

const hexEncoder = new Encoder(Base32Spec.ExtendedHex);
const hexDecoder = new Decoder(Base32Spec.ExtendedHex);

/**
 * Decodes the binary data to ExtendedHex base32 string.
 *
 * @param data The complete binary data.
 * @returns
 */
export function decodeExtendedHex(data: Uint8Array): string {
    return hexDecoder.decode(data);
}

/**
 * Decodes the ExtendedHex base32 string to binary data.
 *
 * @param input The ExtendedHex base32 encoded string.
 * @returns
 *
 * @throws Error Throws decoding errors if the input is invalid.
 */
export function encodeExtendedHex(input: string): Uint8Array {
    return hexEncoder.encodeToBinary(input);
}
