import { Writer } from "../buffer";

/**
 * EDNS options. RR may contain zero or more options in the RDATA.
 *
 * Each option is encoded as:
 *
 *  ```
 *                +0 (MSB)                            +1 (LSB)
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  0: |                          OPTION-CODE                          |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  2: |                         OPTION-LENGTH                         |
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  4: |                                                               |
 *     /                          OPTION-DATA                          /
 *     /                                                               /
 *     +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *  ```
 */
export abstract class Option {
    /**
     * The option code.
     */
    readonly optCode!: OptCode;

    /**
     *
     * @param code
     */
    constructor(code: OptCode) {
        this.optCode = code;
    }

    /**
     * Converts option data to a sequence of bytes and write to the buffer.
     *
     * @param buf
     * @returns
     */
    pack(buf: Writer): number {
        let n = buf.writeUint16(this.optCode);

        // Add a 2-bytes opt length placeholder
        n += buf.writeUint16(0x0);

        const pos = buf.byteLength();
        const optLength = this.packOptionData(buf);

        // Set the actual opt length
        buf.writeUint16At(optLength, pos - 2);

        return n + optLength;
    }

    /**
     * Packs the option data and write the binary to the buffer.
     *
     * @param buf
     */
    abstract packOptionData(buf: Writer): number;

    /**
     * Outputs dig-like textual representation.
     */
    abstract toString(): string;
}

/**
 *
 */

export enum OptCode {
    /**
     * Name server identifier. RFC 5001
     */
    NSID = 3,
    /**
     * Client Subnet. RFC 7871
     */
    ClientSubnet = 8,
    /**
     * DNS Cookies. RFC 7873
     */
    Cookie = 10,
    /**
     * Extended DNS Error. RFC 8914
     */
    ExtendedError = 15,
}
