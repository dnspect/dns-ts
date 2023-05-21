import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { decodeString, encodeString } from "../encoding";
import { Writer } from "../buffer";

/**
 * NSID option is used to retrieve a nameserver identifier. When sending a request, identifier must
 * be set to the empty string. The identifier is an opaque string encoded as hex.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc5001 | RFC 5001}.
 */
export class NSID extends Option {
    identifier!: Uint8Array;

    constructor(data: Slice) {
        super(OptCode.NSID);
        this.identifier = data.readUint8Array();
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
        const hexWS = decodeString(this.identifier, 'hex-ws');
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
        const bin = encodeString(id, encoding);
        return new NSID(Slice.from(bin));
    }
}
