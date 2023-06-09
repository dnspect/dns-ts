import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { binaryToString, stringToBinary } from "../encoding";
import { Writer } from "../buffer";

/**
 * NSID option is used to retrieve a nameserver identifier. When sending a request, identifier must
 * be set to the empty string. The identifier is an opaque string encoded as hex.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc5001 | RFC 5001}.
 */
export class NSID extends Option {
    identifier!: Uint8Array;

    constructor(data: Slice | Uint8Array) {
        super(OptCode.NSID);
        if (data instanceof Slice) {
            this.identifier = data.readUint8Array();
        } else {
            this.identifier = data;
        }
    }

    packOptionData(buf: Writer): number {
        return buf.write(this.identifier);
    }

    /**
     * Refer to {@link https://datatracker.ietf.org/doc/html/rfc5001#section-2.4 | Presentation Format}.
     * @returns
     */
    toString(): string {
        if (this.identifier.length === 0) {
            return "; NSID:";
        }

        const de = new TextDecoder("utf-8");
        const str = de.decode(this.identifier);
        const hexWS = binaryToString(this.identifier, 'hex-ws');
        return `; NSID: ${hexWS} ("${str}")`;
    }

    /**
     * Creates a NSID from an identifier in string.
     *
     * @param id
     * @param encoding
     * @returns
     */
    static fromString(id: string, encoding: "ascii" | "utf-8" = "utf-8"): NSID {
        const bin = stringToBinary(id, encoding);
        return new NSID(bin);
    }
}
