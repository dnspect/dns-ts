import { stringToBinary, EncodingScheme } from "./encoding";
import { Uint16, Uint8, Uint32 } from "./types";

/**
 * Maximum size of a TCP packet is 64K (65535 bytes), length of a DNS message is 2 bytes.
 * Thus, the message size itself should not exceed 65535-2, which is 0xfffd.
 */
export const MAX_MESSAGE_SIZE = 0xFFFD;

/**
 * Allows for reading bytes from a source.
 *
 * Implementors of this Reader interface are called "readers".
 */
export interface Reader {
    /**
     * Returns the length of the buffer in bytes.
     */
    byteLength(): number

    /**
     * Reads an unsigned 8-bit integer from this source at the specified `offset`.
     *
     * @param offset Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
     */
    readUint8(offset?: number): Uint8;

    /**
     * Reads an unsigned 16-bit integer from this source at the specified `offset` in network order.
     *
     * @param offset Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
     */
    readUint16BE(offset?: number): Uint16;

    /**
     * Reads an unsigned 32-bit integer from this source at the specified `offset` in network order.
     *
     * @param offset Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
     */
    readUint32BE(offset?: number): Uint32;

    /**
     * Returns a section of an buffer.
     *
     *
     * @param offset The beginning of the specified portion of the buffer. Defaults to the start of
     *        the source if not specified.
     * @param end The end of the specified portion of the buffer. This is exclusive of the element
     *        at the index 'end'. Default to the end of the source if not specified.
     * @returns An array of bytes read
     */
    read(offset?: number, end?: number): Uint8Array;
}

/**
 * Writer is the interface that wraps the basic Write methods.
 *
 * Implementors of the Writer interface are sometimes called "writers".
 */
export interface Writer {
    /**
     * Returns the length of the already assembled data in bytes.
     */
    byteLength(): number

    /**
     * Writes bytes from data to the underlying data stream or buffer. It returns the number of
     * bytes written from data and any error encountered that caused the write to stop early. Write
     * must throw an error if it returns n < data.length. Write must not modify the slice data, even
     * temporarily.
     *
     * @param slice
     */
    write(data: Uint8Array): number;

    /**
     * Writes one byte to the underlying data stream or buffer.
     *
     * @param n
     */
    writeUint8(n: Uint8): number;

    /**
     * Writes two-bytes or 16-bits to the underlying data stream or buffer in network byte order.
     *
     * @param n
     */
    writeUint16(n: Uint16): number;

    /**
     * Writes two-bytes or 16-bits to the underlying data stream or buffer at the designated position
     * in network byte order.
     *
     * @param n
     * @param pos The position in the buffer to write two-bytes at.
     */
    writeUint16At(n: Uint16, pos: number): number;

    /**
     * Writes four bytes or 32-bits to the underlying data stream or buffer in network byte order.
     *
     * @param n
     */
    writeUint32(n: Uint32): number;

    /**
     * Writes a string to underlying data stream or buffer using the specified encoding.
     *
     * @param str
     */
    writeString(str: string, encoding: EncodingScheme): number;

    /**
     * Truncates the buffer back to a length of `len` bytes and make the buffer readonly.
     *
     * @param len
     */
    freeze(len: number): ThisType<this>;
}

/**
 * A buffer helps read/write DNS message in wireformat.
 *
 * It is able to grow exponentially when it is writable.
 */
export class OctetBuffer implements Reader, Writer {
    buf!: Uint8Array;
    private offset = 0;
    private writable = false;

    /**
     * Initializes a writable OctetBuffer object with default 1232 bytes that are zero-filled.
     *
     * @param buf
     */
    private constructor(buf: Uint8Array, writable: boolean) {
        this.buf = buf;
        this.writable = writable;
    }

    /**
     * Initializes a writable buffer of size bytes that are zero-filled.
     *
     * @param size The initial size of the buffer.
     */
    static alloc(size: number): OctetBuffer {
        return new OctetBuffer(new Uint8Array(size), true);
    }

    /**
     * Creates a readonly OctetBuffer object using the passed data.
     *
     * @param buf
     * @returns
     */
    static from(buf: ArrayLike<number> | ArrayBufferLike): OctetBuffer {
        if (buf instanceof Uint8Array) {
            return new OctetBuffer(buf, false);
        }
        return new OctetBuffer(new Uint8Array(buf), false);
    }

    checkWrite(offset: number, extra: number): void {
        if (!this.writable) {
            throw new Error('buffer not writable');
        }

        if (offset < 0) {
            throw new RangeError(`invalid offset: ${offset}`);
        }

        const needSize = offset + extra;
        if (needSize > MAX_MESSAGE_SIZE) {
            throw new RangeError(`exceed the maximum size of a DNS message`);
        }

        if (needSize > this.buf.length) {
            const oldBuf = this.buf;
            let newSize = oldBuf.length * 2;
            if (newSize < needSize) {
                newSize = needSize;
            }
            if (newSize > MAX_MESSAGE_SIZE) {
                newSize = MAX_MESSAGE_SIZE;
            }

            this.buf = new Uint8Array(newSize);
            this.buf.set(oldBuf, 0);
        }
    }

    checkRead(offset: number, extra: number): void {
        if (offset < 0) {
            throw new RangeError(`invalid offset: ${offset}`);
        }

        if (offset + extra > this.buf.length) {
            throw new RangeError(`try to access beyond buffer length: read ${extra} start from ${offset}`);
        }
    }

    byteLength(): number {
        return this.buf.byteLength;
    }

    readUint8(offset?: number): Uint8 {
        const pos = offset ?? 0;
        this.checkRead(pos, 1);
        return this.buf[pos];
    }

    readUint16BE(offset?: number): Uint16 {
        const pos = offset ?? 0;
        this.checkRead(pos, 2);
        return (this.buf[pos] << 8) | this.buf[pos + 1];
    }

    readUint32BE(offset?: number): Uint32 {
        const pos = offset ?? 0;
        this.checkRead(pos, 4);
        return (this.buf[pos] * 0x1000000) + ((this.buf[pos + 1] << 16) | (this.buf[pos + 2] << 8) | this.buf[pos + 3]);
    }

    read(offset = 0, end = this.buf.length): Uint8Array {
        this.checkRead(offset, end - offset);
        return this.buf.slice(offset, end);
    }

    write(slice: Uint8Array): number {
        this.checkWrite(this.offset, slice.length);
        this.buf.set(slice, this.offset);
        this.offset += slice.length;
        return slice.length;
    }

    writeUint8(n: Uint8): number {
        this.checkWrite(this.offset, 1);
        this.buf[this.offset] = (n & 0xFF);
        this.offset += 1;
        return 1;
    }

    writeUint16(n: Uint16): number {
        this.checkWrite(this.offset, 2);
        this.buf[this.offset] = (n >>> 8);
        this.buf[this.offset + 1] = (n & 0xFF);
        this.offset += 2;
        return 2;
    }

    writeUint16At(n: Uint16, pos: number): number {
        this.checkWrite(pos, 2);
        this.buf[pos] = (n & 0xff);
        this.buf[pos + 1] = (n >>> 8);
        if (pos >= this.offset) {
            this.offset = pos + 2;
        }
        return 2;
    }

    writeUint32(n: Uint32): number {
        this.checkWrite(this.offset, 4);
        this.buf[this.offset] = (n >>> 24);
        this.buf[this.offset + 1] = (n >>> 16);
        this.buf[this.offset + 2] = (n >>> 8);
        this.buf[this.offset + 3] = (n & 0xff);
        this.offset += 4;
        return 4;
    }

    writeString(str: string, encoding: EncodingScheme): number {
        const data = stringToBinary(str, encoding);
        return this.write(data);
    }

    freeze(len: number): OctetBuffer {
        this.buf = this.buf.subarray(0, len);
        this.writable = false;
        return this;
    }
}
