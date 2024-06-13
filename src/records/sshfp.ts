import { Writer } from "../buffer";
import { binaryToString } from "../encoding";
import { ParseError } from "../error";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Uint8 } from "../types";

/**
 * The SSHFP resource record (RR) is used to store a fingerprint of an SSH public host key that is
 * associated with a Domain Name System (DNS) name.
 *
 * SSHFP RDATA format:
 *
 * ```
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |   algorithm   |    fp type    |                               /
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+                               /
 * /                                                               /
 * /                          fingerprint                          /
 * /                                                               /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+-+-+-+-+-+-+-+-+
 * ```
 */
export class SSHFP extends RR {
    /**
     * This algorithm number octet describes the algorithm of the public key.
     *
     * The following values are assigned:
     * ```
     *    Value    Algorithm name
     *    -----    --------------
     *    0        reserved
     *    1        RSA
     *    2        DSS
     * ```
     */
    algorithm!: Uint8;

    /**
     * The fingerprint type octet describes the message-digest algorithm used to calculate the
     * fingerprint of the public key.
     *
     * The following values are assigned:
     * ```
     *    Value    Fingerprint type
     *    -----    ----------------
     *    0        reserved
     *    1        SHA-1
     * ```
     */
    fpType!: Uint8;
    /**
     * The message-digest algorithm is presumed to produce an opaque octet string output, which is
     * placed as-is in the RDATA fingerprint field.
     */
    fingerprint!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.algorithm = rdata.readUint8();
        this.fpType = rdata.readUint8();
        this.fingerprint = rdata.readUint8Array(this.header.rdlength - 2);
    }

    packRdata(buf: Writer): number {
        return buf.writeUint8(this.algorithm) + buf.writeUint8(this.fpType) + buf.write(this.fingerprint);
    }

    parseRdata(_rdata: string): void {
        throw new ParseError(`unimplemented!`);
    }

    /**
     * Presentation Format of the SSHFP RR
     *
     * The RDATA of the presentation format of the SSHFP resource record consists of two numbers
     * (algorithm and fingerprint type) followed by the fingerprint itself, presented in hex, e.g.:
     *
     *  ```
     *  host.example.  SSHFP 2 1 123456789abcdef67890123456789abcdef67890
     *  ```
     *
     * The use of mnemonics instead of numbers is not allowed.
     *
     * @returns
     */
    rdataString(): string {
        const hex = binaryToString(this.fingerprint, 'hex');
        return `${this.algorithm} ${this.fpType} ${hex}`;
    }
}
