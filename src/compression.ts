import { NameWriter } from "./buffer";
import { FQDN } from "./fqdn";
import { Uint16 } from "./types";

/**
 * Starts with 11 (0b1100_0000_0000_0000), leaves only 14 bits for storing the
 * pointer.
 */
const MAX_COMPRESSION_OFFSET = 1 << 14;

/**
 * Compressor implements message compression specified in the
 * [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.4).
 */
export class Compressor {
    entries!: Map<string, Uint16>;
    writer!: NameWriter;

    constructor(writer: NameWriter) {
        this.writer = writer;
        this.entries = new Map<string, Uint16>();
    }

    /**
     * Cache a name key-ed by its labels.
     *
     * @param labels Full labels of a FQDN.
     * @param startPos The start position of the domain name in the buffer.
     */
    private addEntry(labels: string[], startPos: Uint16): void {
        this.entries.set(labels.join("."), startPos);
    }

    private findEntry(labels: string[]): Uint16 | undefined {
        const pointer = this.entries.get(labels.join("."));
        if (pointer === undefined) {
            return undefined;
        }

        // Unfortunately, there is no room to store this large pointer.
        if (pointer > MAX_COMPRESSION_OFFSET) {
            return undefined;
        }

        return pointer;
    }

    /**
     * Write the domain name utilizes message compression to eliminates the
     * repetition of domain names in the message.
     *
     * @param name The original domain name.
     * @param startPos The start position in the buffer.
     * @returns Number of bytes written
     */
    writeName(name: FQDN, startPos: Uint16): number {
        // No need to compress root as it only use 1 byte.
        if (name.isRoot()) {
            return this.writer.writeLabel("");
        }

        const labels = Array.from(name);
        let current = undefined;
        let n = 0;
        let pointer = this.findEntry(labels);

        // Because the fully-qualified domain name is not a root, there will be
        // two or more labels to work with.
        while (pointer === undefined) {
            // Cache non-root name
            this.addEntry(labels, startPos + n);

            current = labels.shift();

            // Sanity check, should not happen.
            if (current === undefined) {
                break;
            }
            n += this.writer.writeLabel(current);

            // Search for then non-root part of the original name.
            if (labels.length > 1) {
                pointer = this.findEntry(labels);
                continue;
            }

            // Reach the last label, the null label.
            const last = labels.shift();
            if (last !== undefined) {
                n += this.writer.writeLabel(last);
            }
            break;
        }

        // The compression scheme allows a domain name in a message to be
        // represented as either:
        // - a sequence of labels ending in a zero octet
        // - a pointer
        // - a sequence of labels ending with a pointer
        if (pointer !== undefined) {
            n += this.writer.writeUint16(0xc000 + pointer);
        }

        return n;
    }
}
