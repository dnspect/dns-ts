import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { Writer } from "../buffer";
import { Uint16 } from "../types";

/**
 * Padding option is used to allow DNS clients and servers to artificially increase the size of a
 * DNS message by a variable number of bytes, hampering size-based correlation of the encrypted
 * message.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc7830 | RFC 7830}.
 */
export class Padding extends Option {
    padding!: Uint8Array;

    constructor(data: Slice | Uint8Array) {
        super(OptCode.Padding);
        if (data instanceof Slice) {
            this.padding = data.readUint8Array();
        } else {
            this.padding = data;
        }
    }

    packOptionData(buf: Writer): number {
        return buf.write(this.padding);
    }

    /**
     * @returns
     */
    toString(): string {
        return `; PADDING: ${this.padding.length}`;
    }

    /**
     * Creates a Padding of requested size.
     *
     * @param size
     * @returns
     */
    static fromSize(size: Uint16): Padding {
        return new Padding(new Uint8Array(size));
    }
}
