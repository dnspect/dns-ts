import { OptCode, Option } from "./option";
import { Slice } from "../packet";
import { Uint16 } from "../types";
import { Writer } from "../buffer";

/**
 * Start of the private range for EDE codes.
 */
export const PRIVATE_RANGE_BEGIN: Uint16 = 49152;

/**
 * A complementary data can be put in EDNS opt, providing additional information about the cause of
 * DNS errors.
 *
 * Specified by {@link https://datatracker.ietf.org/doc/html/rfc8914 | RFC 8914}.
 */
export class ExtendedError extends Option {
    infoCode!: ExtendedErrorCode;
    extraText!: string;

    constructor(data: Slice) {
        super(OptCode.ExtendedError);
        this.infoCode = data.readUint16();
        this.extraText = data.readUTF8String();
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
    toString(): string {
        let output = `; EDE: ${this.infoCode}`;

        let errorName = ExtendedErrorCode[this.infoCode];
        if (errorName !== undefined) {
            errorName = errorName.replace(/([a-z])([A-Z])/g, "$1 $2");
            errorName = errorName.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
            output += ` (${errorName})`;
        }

        if (this.extraText.length > 0) {
            output += `: (${this.extraText})`;
        }
        return output;
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
