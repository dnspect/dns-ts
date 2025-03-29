import { stringToBinary, EncodingScheme, binaryToString } from "./encoding";
import { FQDN } from "./fqdn";
import { Uint16, Uint8, Uint32 } from "./types";
import { Compressor } from "./compression";

/**
 * Maximum size of a DNS packet is 64K (65535 bytes) because the payload length field is a 16-bit.
 */
export const MAX_MESSAGE_SIZE = 0xffff;

/**
 * ByteReader reads and returns the byte at offset in the underlying input source.
 */
export interface ByteReader {
    /**
     * Returns the length of the underlying input source in bytes.
     */
    byteLength(): number;

    /**
     * Reads an unsigned 8-bit integer from this source at the specified `offset`.
     *
     * @param offset Number of bytes to skip before starting to read. Must satisfy `0 <= offset <= buf.length - 1`.
     */
    readUint8(offset?: number): Uint8;
}

/**
 * Allows for reading bytes from a source.
 *
 * Implementors of this Reader interface are called "readers".
 */
export interface Reader extends ByteReader {
    /**
     * Returns the length of the underlying input source in bytes.
     */
    byteLength(): number;

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
     * Returns a section of the buffer.
     *
     * @param offset The beginning of the specified portion of the buffer. Defaults to the start of
     *        the source if not specified.
     * @param end The end of the specified portion of the buffer. This is exclusive of the element
     *        at the index 'end'. Default to the end of the source if not specified.
     * @returns An array of bytes read
     */
    slice(offset?: number, end?: number): Uint8Array;
}

export interface NameWriter {
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
     * Writes a domain name label in ascii encoding.
     *
     * @param label The ascii encoded label string.
     */
    writeLabel(label: string): number;
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
    byteOffset(): number;

    /**
     * Writes bytes from data to the underlying data stream or buffer. It returns the number of
     * bytes written from data and any error encountered that caused the write to stop early. Write
     * must throw an error if it returns n < data.length. Write must not modify the slice data, even
     * temporarily.
     *
     * @param data
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
     * Writes a domain name to underlying data stream or buffer. Message compression may be used to
     * reduce the size of messages if the name is eligible for compression and the writer implementation
     * support the compression scheme.
     *
     * @see https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.4
     *
     * @param name The domain name.
     * @param compress Is the name eligible for compression.
     */
    writeName(name: FQDN, compress: boolean): number;

    /**
     * Truncates the buffer back to a length of `len` bytes and make the buffer readonly.
     *
     * @param len
     */
    freeze(len: number): ThisType<this>;
}

export class CharReader implements ByteReader {
    private buf!: Uint8Array;

    private constructor(buf: Uint8Array) {
        this.buf = buf;
    }

    /**
     * Creates a new CharReader from an ASCII string.
     *
     * @param str The ASCII string.
     * @returns CharReader
     */
    static from(str: string): CharReader {
        const buf = stringToBinary(str, "ascii");
        return new CharReader(buf);
    }

    byteLength(): number {
        return this.buf.byteLength;
    }

    readUint8(offset?: number): Uint8 {
        const pos = offset ?? 0;
        if (pos < 0 || pos >= this.buf.length) {
            throw new RangeError(`try to access beyond buffer length: read 1 start from ${pos}`);
        }
        return this.buf[pos];
    }
}

export class BufferWriter implements Writer {
    buf!: Uint8Array;
    protected offset = 0;
    protected writable = false;

    /**
     * Initializes a writable RdataBuffer object with default 1232 bytes that are zero-filled.
     *
     * @param buf
     */
    protected constructor(buf: Uint8Array, writable: boolean) {
        this.buf = buf;
        this.writable = writable;
    }

    /**
     * Initializes a writable buffer of size bytes that are zero-filled.
     *
     * @param size The initial size of the buffer.
     */
    static alloc(size: number): BufferWriter {
        return new BufferWriter(new Uint8Array(size), true);
    }

    /**
     *
     * @param offset
     * @param extra
     *
     * @throws Error
     */
    private checkWrite(offset: number, extra: number): void {
        if (!this.writable) {
            throw new Error("buffer not writable");
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

    byteOffset(): number {
        return this.offset;
    }

    write(data: Uint8Array): number {
        this.checkWrite(this.offset, data.length);
        this.buf.set(data, this.offset);
        this.offset += data.length;
        return data.length;
    }

    writeUint8(n: Uint8): number {
        this.checkWrite(this.offset, 1);
        this.buf[this.offset] = n & 0xff;
        this.offset += 1;
        return 1;
    }

    writeUint16(n: Uint16): number {
        this.checkWrite(this.offset, 2);
        this.buf[this.offset] = (n >>> 8) & 0xff;
        this.buf[this.offset + 1] = n & 0xff;
        this.offset += 2;
        return 2;
    }

    writeUint16At(n: Uint16, pos: number): number {
        this.checkWrite(pos, 2);
        this.buf[pos] = (n >>> 8) & 0xff;
        this.buf[pos + 1] = n & 0xff;
        if (pos + 2 > this.offset) {
            this.offset = pos + 2;
        }
        return 2;
    }

    writeUint32(n: Uint32): number {
        this.checkWrite(this.offset, 4);
        this.buf[this.offset] = (n >>> 24) & 0xff;
        this.buf[this.offset + 1] = (n >>> 16) & 0xff;
        this.buf[this.offset + 2] = (n >>> 8) & 0xff;
        this.buf[this.offset + 3] = n & 0xff;
        this.offset += 4;
        return 4;
    }

    writeString(str: string, encoding: EncodingScheme): number {
        const data = stringToBinary(str, encoding);
        return this.write(data);
    }

    writeLabel(label: string): number {
        if (label.length === 0) {
            return this.writeUint8(0);
        }

        const data = stringToBinary(label, "ascii");
        return this.writeUint8(data.length) + this.write(data);
    }

    writeName(name: FQDN, _compress: boolean): number {
        let n = 0;
        for (const label of name) {
            n += this.writeLabel(label);
        }
        return n;
    }

    freeze(len: number): this {
        this.buf = this.buf.subarray(0, len);
        this.writable = false;
        return this;
    }
}


/**
 * A buffer helps read/write binary from DNS wireformat.
 */
export class BufferReader implements Reader {
    buf!: Uint8Array;
    protected offset = 0;

    constructor(buf: ArrayLike<number> | ArrayBufferLike) {
        if (buf instanceof Uint8Array) {
            this.buf = buf;
        }
        this.buf = new Uint8Array(buf);
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

    byteOffset(): number {
        return this.offset;
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
        return this.buf[pos] * 0x1000000 + ((this.buf[pos + 1] << 16) | (this.buf[pos + 2] << 8) | this.buf[pos + 3]);
    }

    slice(offset = 0, end = this.buf.length): Uint8Array {
        this.checkRead(offset, end - offset);
        return this.buf.slice(offset, end);
    }
}

/**
 * A buffer helps read/write DNS message in wireformat.
 *
 * It is able to grow exponentially when it is writable.
 */
export class PacketBuffer extends BufferWriter implements Reader, Writer, NameWriter {
    private compressor?: Compressor;

    /**
     * Initializes a writable buffer of size bytes that are zero-filled.
     *
     * @param size The initial size of the buffer.
     */
    static alloc(size: number): PacketBuffer {
        return new PacketBuffer(new Uint8Array(size), true);
    }

    /**
     * Creates a readonly PacketBuffer object using the passed data.
     *
     * @param buf
     * @returns
     */
    static from(buf: ArrayLike<number> | ArrayBufferLike): PacketBuffer {
        if (buf instanceof Uint8Array) {
            return new PacketBuffer(buf, false);
        }
        return new PacketBuffer(new Uint8Array(buf), false);
    }

    /**
     * Enable message compression.
     */
    withCompressor(): PacketBuffer {
        this.compressor = new Compressor(this);
        return this;
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

    byteOffset(): number {
        return this.offset;
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
        return this.buf[pos] * 0x1000000 + ((this.buf[pos + 1] << 16) | (this.buf[pos + 2] << 8) | this.buf[pos + 3]);
    }

    slice(offset = 0, end = this.buf.length): Uint8Array {
        this.checkRead(offset, end - offset);
        return this.buf.slice(offset, end);
    }

    /**
     * @override
     *
     * @param name
     * @param compress
     * @returns
     */
    writeName(name: FQDN, compress: boolean): number {
        if (compress && !!this.compressor) {
            return this.compressor.writeName(name, this.offset);
        }

        let n = 0;
        for (const label of name) {
            n += this.writeLabel(label);
        }
        return n;
    }

    dump(encoding: EncodingScheme): string {
        return binaryToString(this.buf, encoding);
    }
}
