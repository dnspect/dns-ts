import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { Uint16 } from "../types";
import { Writer } from "../buffer";
import { ParseError } from "../error";

/**
 * Start of the private range for EDE codes.
 */
export const EDE_PRIVATE_RANGE_BEGIN: Uint16 = 49152;

/**
 * A complementary data can be put in EDNS opt, providing additional information about the cause of
 * DNS errors.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc8914 | RFC 8914}.
 */
export class ExtendedError extends Option {
    infoCode!: ExtendedErrorCode;
    extraText!: string;

    constructor(data: Slice | ExtendedErrorCode, text?: string) {
        super(OptCode.ExtendedError);
        if (data instanceof Slice) {
            this.infoCode = data.readUint16();
            this.extraText = data.readUTF8String();
        } else {
            this.infoCode = data;
            this.extraText = text ?? "";
        }
    }

    /**
     * @override
     */
    packOptionData(buf: Writer): number {
        return buf.writeUint16(this.infoCode) + buf.writeString(this.extraText, "utf-8");
    }

    /**
     * @override
     */
    present(): string {
        let output = `; EDE: ${this.infoCode}`;

        let name = ExtendedErrorCode[this.infoCode];
        if (name !== undefined) {
            name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
            name = name.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
            output += ` (${name})`;
        } else {
            output += ` (Unknown Code)`;
        }

        if (this.extraText.length > 0) {
            output += `: (${this.extraText})`;
        }
        return output;
    }

    /**
     * Creates a new ExtendedError from the option data.
     *
     * @param data The option data.
     * @returns
     */
    static from(data: ArrayLike<number> | ArrayBufferLike): ExtendedError {
        return new ExtendedError(Slice.from(data));
    }

    /**
     * Creates a new ExtendedError from error code and optional text.
     *
     * @param infoCode
     * @param extraText
     * @returns
     */
    static fromCode(infoCode: ExtendedErrorCode, extraText?: string): ExtendedError {
        return new ExtendedError(infoCode, extraText);
    }

    /**
     * Parses ExtendedError from a textual representation.
     *
     * @param input A regular comment string that has stripped out "EDE: "
     *
     * @example
     * ```
     * ; EDE: 0 (other): (blabla. https://foo.bar/)  // dig
     * ;; EDE: 49152 (Unknown Code): 'blabla. https://foo.bar/' // kdig
     * ```
     *
     * Note that the prefix "; EDE:\s+" should has been stripped from caller.
     */
    static parse(input: string): ExtendedError {
        const found = input.match(/^(\d+)[^:]+(:\s*[('](.+)[)'])?/i);
        if (found === null) {
            throw new ParseError(`unrecognized EDE text: "${input}"`);
        }

        const code = parseInt(found[1]);
        const text = found.length >= 4 ? found[3].trim() : "";
        return new ExtendedError(code, text);
    }
}

/**
 * Extended DNS error codes.
 *
 * Current registered values can be found in the
 * {@link https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#extended-dns-error-codes | IANA registry }.
 */
export enum ExtendedErrorCode {
    OtherError = 0,
    UnsupportedDNSKEYAlgorithm = 1,
    UnsupportedDSDigestType = 2,
    StaleAnswer = 3,
    ForgedAnswer = 4,
    DNSSECIndeterminate = 5,
    DNSSECBogus = 6,
    SignatureExpired = 7,
    SignatureNotYetValid = 8,
    DNSKEYMissing = 9,
    RRSIGsMissing = 10,
    NoZoneKeyBitSet = 11,
    NSECMissing = 12,
    CachedError = 13,
    NotReady = 14,
    Blocked = 15,
    Censored = 16,
    Filtered = 17,
    Prohibited = 18,
    StaleNxdomainAnswer = 19,
    NotAuthoritative = 20,
    NotSupported = 21,
    NoReachableAuthority = 22,
    NetworkError = 23,
    InvalidData = 24,
}
