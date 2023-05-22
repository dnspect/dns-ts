import { Uint16, Uint32, Uint48, Uint8 } from "./types";
import { ParseError } from "./error";
import { FQDN } from "./fqdn";
import { EncodingScheme, binaryToString } from "./encoding";
import { Writer, Reader, OctetBuffer } from "./buffer";


/**
 * Max domain label octets
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-2.3.4
 */
const MAX_DOMAIN_LABEL_WIRE_OCTETS = 63;

/**
 * Max domain name octets
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-2.3.4
 */
const MAX_DOMAIN_NAME_WIRE_OCTETS = 255;

/**
 * The label pointer indicator
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.4
 */
const LABEL_POINTER = 0b11000000;

/**
 * This is the maximum number of compression pointers that should occur in a semantically valid
 * message. Each label in a domain name must be at least one octet and is separated by a period.
 * The root label won't be represented by a compression pointer to a compression pointer, hence
 * the -2 to exclude the smallest valid root label.
 *
 * It is possible to construct a valid message that has more compression pointers than this, and
 * still doesn't loop, by pointing to a previous pointer. This is not something a well written
 * implementation should ever do, so we leave them to trip the maximum compression pointer check.
 *
 * Adopted from {@link https://github.com/miekg/dns/blob/master/msg.go#L26-L36 | miekg/dns }.
 */
const MAX_COMPRESSION_POINTERS = (MAX_DOMAIN_NAME_WIRE_OCTETS + 1) / 2 - 2;

/**
 * A sequence of hexadecimal digits.
 */
export class HexString {
    private hex: string;

    constructor(hex: string) {
        this.hex = hex;
    }

    /**
     * Converts the hex string to byte array.
     *
     * @returns
     */
    toBytes(): Uint8Array {
        if (this.hex.length % 2 !== 0) {
            throw new Error(`expect even number of hex digits to convert to bytes`);
        }

        const bytes = new Uint8Array(this.hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            const highCode = this.hex.charCodeAt(i * 2);
            const lowCode = this.hex.charCodeAt(i * 2 + 1);
            bytes[i] = highCode << 4 + lowCode;
        }
        return bytes;
    }

    /**
     *
     * @returns
     */
    toString(): string {
        return this.hex;
    }
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

    toString(): string {
        return this.str;
    }

    /**
     *
     * @param buf
     * @returns
     */
    pack(buf: Writer): number {
        return buf.writeUint8(this.str.length) + buf.writeString(this.str, "ascii");
    }

    static unpack(s: Slice): CharacterString {
        const len = s.readUint8();
        const str = s.readString("ascii", len);
        return new CharacterString(str);
    }
}


/**
 * A slice of fixed-length sequence of bytes.
 *
 * It provides functions to read data from the slice and tracks how many bytes have been read. The
 * read cursor is positioned at zero initially and is always pointing to the byte to be read next.
 */
export class Slice {
    protected buf: Reader;
    private offset: number;
    private cur: number;
    private len: number;
    private lookupLabels?: (offset: Uint16, pointers: number) => [string[], Uint16];

    /**
     * Creates a new slice from passed data.
     *
     * @param data
     * @returns
     */
    static from(data: ArrayLike<number> | ArrayBufferLike): Slice {
        return new Slice(OctetBuffer.from(data));
    }

    /**
     *
     * @param buf
     * @param bytesOffset
     * @param length
     * @param lookupLabels A method to lookup domain labels in the message buffer.
     */
    protected constructor(buf: Reader, bytesOffset = 0, length?: number, lookupLabels?: (offset: Uint16, pointers: number) => [string[], Uint16]) {
        this.buf = buf;
        this.offset = bytesOffset;
        this.len = length === undefined ? buf.byteLength() : length;
        this.cur = 0;
        this.lookupLabels = lookupLabels;
    }

    /**
     * Checks boundary before read.
     *
     * @param len
     * @throws {@link ParseError} This exception is thrown if the given pos is out of range.
     */
    private check(len: number): void {
        if (this.cur + len > this.len) {
            throw new ParseError(`insufficient bytes remaining for read: needs ${len}, have ${this.len - this.cur}`);
        }
    }

    /**
     * Returns the position of the read cursor.
     *
     * @returns
     */
    current(): number {
        return this.cur;
    }

    /**
     * Returns the length of the buffer.
     *
     * @returns
     */
    length(): number {
        return this.len;
    }

    /**
     * Returns the number of unread bytes in the buffer.
     *
     * @returns
     */
    remaining(): number {
        return this.len - this.cur;
    }

    /**
     * Advances read cursor to the designated position.
     *
     * @param pos
     * @returns
     *
     * @throws {@link ParseError} This exception is thrown if the given pos is out of range.
     */
    seek(pos: number): Slice {
        if (pos < 0) {
            throw new ParseError(`invalid pos: ${pos}`);
        }

        if (pos > this.len) {
            throw new ParseError(`invalid pos: ${pos}, exceeds ${this.len}`);
        }

        this.cur = pos;
        return this;
    }

    /**
     * Reads a byte and advances the read cursor.
     *
     * @returns
     */
    readUint8(): Uint8 {
        this.check(1);
        const n = this.buf.readUint8(this.offset + this.cur);
        this.cur += 1;
        return n;
    }

    /**
     * Reads 2 bytes represented in an Uint16 number and advances the read cursor.
     *
     * @returns
     */
    readUint16(): Uint16 {
        this.check(2);

        const n = this.buf.readUint16BE(this.offset + this.cur);
        this.cur += 2;
        return n;
    }

    /**
     * Reads a 4 bytes represented in an Uint32 number and advances the read cursor.
     *
     * @returns
     */
    readUint32(): Uint32 {
        this.check(4);

        const n = this.buf.readUint32BE(this.offset + this.cur);
        this.cur += 4;
        return n;
    }

    /**
     * Reads a 6 bytes represented in an Uint48 number and advances the read cursor.
     *
     * @returns
     */
    readUint48(): Uint48 {
        return (this.readUint32() << 16) + this.readUint16();
    }

    /**
     * Reads given length of bytes, decodes the data to a string according to the specified character
     * encoding, and advances the read cursor.
     *
     * @param encoding The length of the string
     * @param len The character encoding
     * @returns A string.
     */
    readString(encoding: EncodingScheme, len?: Uint8): string {
        if (len === undefined) {
            len = this.remaining();
        } else {
            if (len <= 0) {
                return "";
            }
            this.check(len);
        }

        const end = this.cur + len;
        const data = this.buf.read(this.offset + this.cur, this.offset + end);
        this.seek(end);
        return binaryToString(data, encoding);
    }

    /**
     * Reads a utf-8 string of given length and advances the read cursor.
     *
     * @param len The length of the string
     * @returns An utf-8 string
     */
    readUTF8String(len?: Uint8): string {
        return this.readString("utf-8", len);
    }

    /**
     * Reads a slice of bytes of given length and advances the read cursor.
     *
     * @param len The length of bytes to read
     * @returns
     */
    readSlice(len: number): Slice {
        this.check(len);

        const s = new Slice(this.buf, this.offset + this.cur, len, this.lookupLabels);
        this.cur += len;
        return s;
    }

    /**
     * Reads a slice of bytes of given length to build an Uint8Array and advances the read cursor.
     *
     * @param len The length of bytes to read. If not set, read the rest of the buffer.
     * @returns
     */
    readUint8Array(len?: number): Uint8Array {
        if (len === undefined) {
            len = this.remaining();
        } else {
            if (len <= 0) {
                return new Uint8Array(0);
            }
            this.check(len);
        }

        // Note: neither const a = buf.slice(this.buf, this.offset + this.cur, len)
        // nor const a = new Uint8Array(this.buf, this.offset + this.cur, len)
        // work somehow, may be improved later.
        const a = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            a[i] = this.buf.readUint8(this.offset + this.cur);
            this.cur += 1;
        }
        return a;
    }

    /**
     * Reads a full-qualified domain name and advances the read cursor.
     *
     * @param limit The total number of bytes to be read.
     * @returns
     */
    readDomainName(): FQDN {
        const [labels, n] = this.findLabels(this.cur, 0);
        if (n > this.remaining()) {
            throw new ParseError(`overflow unpacking domain name: needs ${n}, have ${this.remaining()}`);
        }

        // Advance the cursor
        this.seek(this.cur + n);
        return new FQDN(labels);
    }

    /**
     * Finds labels start from the absolute position in the buffer.
     *
     * @param n The total number of bytes to be read.
     * @returns
     *
     * @throws ParseError
     */
    protected findLabels(startPos: Uint16, pointers: number): [string[], Uint16] {
        const labels = new Array<string>();
        let labelLen = this.buf.readUint8(this.offset + startPos);
        let cur = startPos + 1;

        while (labelLen !== 0) {
            // Pointer encountered
            // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
            // | 1  1|                OFFSET                   |
            // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
            if (labelLen >= LABEL_POINTER) {
                // eslint-disable-next-line no-param-reassign
                pointers++;
                if (pointers > MAX_COMPRESSION_POINTERS) {
                    throw new ParseError(`too much domain name compression pointers: ${pointers}`);
                }

                // remove the first two ones to get a high byte
                const high = labelLen - LABEL_POINTER;
                // the new position to read the name from
                const newPos = (high << 8) + this.buf.readUint8(this.offset + cur);
                cur += 1;

                if (this.lookupLabels === undefined) {
                    throw new ParseError(`domain name compression is not supported by in this slice of data`);
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [suffix, _pointers] = this.lookupLabels(newPos, pointers);
                labels.push(...suffix);

                return [labels, cur - startPos];
            }

            const labelData = this.buf.read(this.offset + cur, this.offset + cur + labelLen);
            const label = binaryToString(labelData, 'ascii');
            labels.push(label);

            if (labelLen > MAX_DOMAIN_LABEL_WIRE_OCTETS) {
                throw new ParseError(`label exceeded ${MAX_DOMAIN_LABEL_WIRE_OCTETS} octets: "${label}"`);
            }

            cur += labelLen;
            if ((cur - startPos) >= MAX_DOMAIN_NAME_WIRE_OCTETS) {
                throw new ParseError(`domain name exceeded ${MAX_DOMAIN_NAME_WIRE_OCTETS} octets`);
            }

            // ready for reading next label or the null label (0) at the end
            labelLen = this.buf.readUint8(this.offset + cur);
            cur += 1;
        }

        // Add the null label as an empty string
        labels.push("");

        return [labels, (cur - startPos)];
    }
}

/**
 * Packet wraps the DNS message binary data and provides functions to help unpack the message into
 * the Message object.
 */
export class Packet extends Slice {
    /**
     * @param buf A DNS message buffer
     */
    constructor(buf: Reader) {
        super(buf, 0, buf.byteLength(), (startPos, pointer) => {
            // The domain name pointer is an absolute position in the whole message buffer, so
            // always lookup the pointing labels in whole buffer.
            return this.findLabels(startPos, pointer);
        });
    }
}
