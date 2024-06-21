import { Writer } from "../../buffer";
import { ParseError } from "../../error";
import { Slice } from "../../packet";
import { RRType, rrtypeFrom } from "../../types";

/**
 * The Type Bit Maps field identifies the RRset types that exist at the
 * NSEC RR's owner name.
 *
 * The RR type space is split into 256 window blocks, each representing
 * the low-order 8 bits of the 16-bit RR type space.  Each block that
 * has at least one active RR type is encoded using a single octet
 * window number (from 0 to 255), a single octet bitmap length (from 1
 * to 32) indicating the number of octets used for the window block's
 * bitmap, and up to 32 octets (256 bits) of bitmap.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4034#section-4.1.2
 */
export class TypeBitMaps {
    private types: RRType[];

    constructor(types: RRType[]) {
        this.types = types;
    }

    toString(): string {
        return this.types.map((v) => RRType[v]).join(" ");
    }

    /**
     * Packs type bitmaps in wireformat.
     *
     * @param buf
     * @returns
     */
    pack(buf: Writer): number {
        const sorted = this.types.sort((a, b) => a - b);

        let n = 0;
        let lastWindow = -1;
        let types: RRType[] | undefined = undefined;

        for (const t of sorted) {
            const window = t >> 8;

            // New window
            if (window > lastWindow) {
                if (types) {
                    const bitmaps = buildBitMaps(types);
                    n += buf.writeUint8(bitmaps.length);
                    n += buf.write(Uint8Array.from(bitmaps));
                }

                n += buf.writeUint8(window);
                lastWindow = window;
                types = [];
            }

            types?.push(t);
            lastWindow = window;
        }

        if (types) {
            const bitmaps = buildBitMaps(types);
            n += buf.writeUint8(bitmaps.length);
            n += buf.write(Uint8Array.from(bitmaps));
        }

        return n;
    }

    /**
     * Unpacks type bitmaps from a wireformat binary.
     *
     * @param buf
     * @returns
     *
     * @throws ParseError
     */
    static unpack(buf: Slice): TypeBitMaps {
        const types = new Array<RRType>();

        let lastWindow = -1;
        while (buf.remaining() >= 2) {
            const window = buf.readUint8();
            const len = buf.readUint8();

            if (window <= lastWindow) {
                // RFC 4034: Blocks are present in the NSEC RR RDATA in increasing numerical order.
                throw new ParseError("out of order NESC(3) block in type bitmap");
            }

            if (len === 0) {
                // RFC 4034: Blocks with no types present MUST NOT be included.
                //throw new ParseError("empty NESC(3) block in type bitmap");
            }

            if (len > 32) {
                // Blocks with no types present MUST NOT be included.
                throw new ParseError(`NESC(3) block too long in type bitmap: ${len}`);
            }

            if (len > buf.remaining()) {
                throw new ParseError(`overflowing NSEC(3) block in type bitmap: ${len}`);
            }

            const high = window << 8;
            buf.readUint8Array(len).forEach((v, i) => {
                [0b10000000, 0b1000000, 0b100000, 0b10000, 0b1000, 0b100, 0b10, 0b1].forEach((mask, j) => {
                    if ((v & mask) === mask) {
                        types.push(high + i * 8 + j);
                    }
                });
            });

            lastWindow = window;
        }

        return new TypeBitMaps(types);
    }

    /**
     * Parses textual representation of the type bitmaps.
     *
     * @param input
     * @returns
     * @throws ParseError
     */
    static parse(input: string): TypeBitMaps {
        input = input.trim();
        if (input === "") {
            return new TypeBitMaps([]);
        }

        const arr = input.split(/\s+/).filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });

        const types = new Array<RRType>();
        for (const str of arr) {
            const rrt = rrtypeFrom(str);
            if (rrt === null) {
                throw new ParseError(`invalid RR type: ${str}`);
            }
            types.push(rrt);
        }

        return new TypeBitMaps(types);
    }
}

/**
 * Builds bitmaps for the types belong to the same window.
 *
 * @param types
 * @returns
 */
function buildBitMaps(types: RRType[]): Uint8Array {
    if (types.length === 0) {
        return new Uint8Array(0);
    }

    // Note, last type indicates the max number of needed bytes.
    const bytes = new Uint8Array((types[types.length - 1] >> 3) + 1);

    for (const t of types) {
        const value = t & 0xff;
        const idx = value >> 3;
        bytes[idx] |= 1 << (7 - value % 8);
    }

    return bytes;
}
