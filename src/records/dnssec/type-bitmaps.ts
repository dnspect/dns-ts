import { Writer } from "../../buffer";
import { ParseError } from "../../error";
import { Slice } from "../../packet";
import { RRType } from "../../types";

export class TypeBitMaps {
    private types: RRType[];

    constructor(types: RRType[]) {
        this.types = types;
    }

    toString(): string {
        return this.types.map((v) => RRType[v]).join(" ");
    }

    /**
     * @todo
     *
     * Refer to {@link https://github.com/miekg/dns/blob/eb4745b6952748a0524842bf9c4e944f076e725a/msg_helpers.go#L534-L595}
     *
     * @param buf
     * @returns
     */
    pack(_buf: Writer): number {
        throw new Error("pack() is unimplemented for TypeBitMaps");
    }

    /**
     *
     * @param bin
     * @returns
     *
     * @throws ParseError
     */
    static unpack(bin: Slice): TypeBitMaps {
        const types = new Array<RRType>();

        let lastWindow = -1;
        while (bin.remaining() >= 2) {
            const window = bin.readOctet();
            const len = bin.readOctet();

            if (window <= lastWindow) {
                // Blocks are present in the NSEC RR RDATA in increasing numerical order.
                throw new ParseError("out of order NESC(3) block in type bitmap");
            }

            if (len === 0) {
                // Blocks with no types present MUST NOT be included.
                throw new ParseError("empty NESC(3) block in type bitmap");
            }

            if (len > 32) {
                // Blocks with no types present MUST NOT be included.
                throw new ParseError(`NESC(3) block too long in type bitmap: ${len}`);
            }

            if (len > bin.remaining()) {
                throw new ParseError(`overflowing NSEC(3) block in type bitmap: ${len}`);
            }

            const high = window << 8;
            bin.readUint8Array(len).forEach((v, i) => {
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
}
