export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint48 = number; // less then Number.MAX_SAFE_INTEGER

/**
 * The max value of a Uint16 number.
 */
export const Uint16Max = 0xFFFF;

/**
 * A four bit field that specifies kind of query in this message.
 *
 * This value is set by the originator of a query and copied into the response. The values are:
 *
 * - 0               a standard query (QUERY)
 * - 1               an inverse query (IQUERY)
 * - 2               a server status request (STATUS)
 * - 3-15            reserved for future use
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
 */
export enum Opcode {
    Query = 0,
    IQuery = 1,
    Status = 2,
    // There is no 3 yet.
    Notify = 4,
    Update = 5,
}

/**
 * A two octet code that specifies the class of the resource record.
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-3.2.4
 */
export enum Class {
    INET = 1,   // The Internet
    CSNET = 2,  // The CSNET class (Obsolete - used only for examples in some obsolete RFCs)
    CHAOS = 3,  // The CHAOS class
    Hesiod = 4, // Hesiod [Dyer 87]
}

/**
 * Returns the abbreviation of the class name.
 *
 * @param c
 * @returns
 */
export function classAbbr(c: Class): string {
    switch (c) {
        case Class.INET:
            return "IN";
        case Class.CSNET:
            return "CS";
        case Class.CHAOS:
            return "CH";
        case Class.Hesiod:
            return "HS";
    }
}

/**
 * A two octet code that specifies the class of the query.
 *
 * QClass fields appear in the question section of a query. QCLASS values are a superset of CLASS values; every CLASS
 * is a valid QCLASS. In addition to CLASS values, the following QCLASSes are defined:
 *
 * - 255 any class
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-3.2.5
 */
export type QClass = Class | QClassExtend;
const enum QClassExtend {
    Any = 255, // The ANY class
}

/**
 * Returns the abbreviation of the query class name.
 *
 * @param c
 * @returns
 */
export function qclassAbbr(c: QClass): string {
    if (c in Class) {
        return classAbbr(c as Class);
    }

    switch (c) {
        case QClassExtend.Any:
            return "ANY";
        default:
            return "";
    }
}

/**
 * Response code - this 4 bit field is set as part of responses.
 *
 * The values have the following interpretation:
 *
 * - 0               No error condition
 * - 1               Format error - The name server was unable to interpret the query.
 * - 2               Server failure - The name server was unable to process this query due to a problem with
 *                   the name server.
 * - 3               Name Error - Meaningful only for responses from an authoritative name server, this code
 *                   signifies that the domain name referenced in the query does not exist.
 * - 4               Not Implemented - The name server does not support the requested kind of query.
 * - 5               Refused - The name server refuses to perform the specified operation for policy reasons.
 *                   For example, a name server may not wish to provide the information to the particula
 *                   requester, or a name server may not wish to perform a particular operation (e.g., zone
 *                   transfer) for particular data.
 * - 6-15            Reserved for future use.
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
 */
export enum Rcode {
    NoError = 0, // No Error                          [DNS]
    FormErr = 1, // Format Error                      [DNS]
    ServFail = 2, // Server Failure                   [DNS]
    NXDomain = 3, // Name Error                       [DNS]
    NotImp = 4, // Not Implemented                    [DNS]
    Refused = 5, // Query Refused                     [DNS]
    YXDomain = 6, // Name Exists when it should not   [DNS Update]
    YXRrset = 7, // RR Set Exists when it should not  [DNS Update]
    NXRrset = 8, // RR Set that should exist does not [DNS Update]
    NotAuth = 9, // Server Not Authoritative for zone [DNS Update]
    NotZone = 10, // Name not contained in zone       [DNS Update/TSIG]
    BadSig = 16, // TSIG Signature Failure            [TSIG]
    BadVers = 16, // Bad OPT Version                  [EDNS0]
    BadKey = 17, // Key not recognized                [TSIG]
    BadTime = 18, // Signature out of time window     [TSIG]
    BadMode = 19, // Bad TKEY Mode                    [TKEY]
    BadName = 20, // Duplicate key name               [TKEY]
    BadAlg = 21, // Algorithm not supported           [TKEY]
    BadTrunc = 22, // Bad Truncation                  [TSIG]
    BadCookie = 23, // Bad/missing Server Cookie      [DNS Cookies]
}

/**
 * Resrouce record type.
 */
export enum RRType {
    None = 0,
    A = 1,
    NS = 2,
    MD = 3,
    MF = 4,
    CNAME = 5,
    SOA = 6,
    MB = 7,
    MG = 8,
    MR = 9,
    NULL = 10,
    PTR = 12,
    HINFO = 13,
    MINFO = 14,
    MX = 15,
    TXT = 16,
    RP = 17,
    AFSDB = 18,
    X25 = 19,
    ISDN = 20,
    RT = 21,
    NSAPPTR = 23,
    SIG = 24,
    KEY = 25,
    PX = 26,
    GPOS = 27,
    AAAA = 28,
    LOC = 29,
    NXT = 30,
    EID = 31,
    NIMLOC = 32,
    SRV = 33,
    ATMA = 34,
    NAPTR = 35,
    KX = 36,
    CERT = 37,
    DNAME = 39,
    OPT = 41, // EDNS
    APL = 42,
    DS = 43,
    SSHFP = 44,
    RRSIG = 46,
    NSEC = 47,
    DNSKEY = 48,
    DHCID = 49,
    NSEC3 = 50,
    NSEC3PARAM = 51,
    TLSA = 52,
    SMIMEA = 53,
    HIP = 55,
    NINFO = 56,
    RKEY = 57,
    TALINK = 58,
    CDS = 59,
    CDNSKEY = 60,
    OPENPGPKEY = 61,
    CSYNC = 62,
    ZONEMD = 63,
    SVCB = 64,
    HTTPS = 65,
    SPF = 99,
    UINFO = 100,
    UID = 101,
    GID = 102,
    UNSPEC = 103,
    NID = 104,
    L32 = 105,
    L64 = 106,
    LP = 107,
    EUI48 = 108,
    EUI64 = 109,
    URI = 256,
    CAA = 257,
    AVC = 258,

    TKEY = 249,
    TSIG = 250,

    TA = 32768,
    DLV = 32769,
    Reserved = 65535,
}

/** All types */
export type RRTypes = keyof typeof RRType;

/**
 * QTYPE fields appear in the question part of a query. QTYPES are a superset of TYPEs, hence all
 * TYPEs are valid QTYPEs.
 *
 * In addition, the following QTYPEs are defined:
 *
 * - IXFR          251 A request for a incremental transfer of a zone
 * - AXFR          252 A request for a transfer of an entire zone
 * - MAILB         253 A request for mailbox-related records (MB, MG or MR)
 * - MAILA         254 A request for mail agent RRs (Obsolete - see MX)
 * - \*            255 A request for all records
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-3.2.3
 */
export type QType = RRType | QTypeExtend;
const enum QTypeExtend {
    IXFR = 251,
    AXFR = 252,
    MAILB = 253,
    MAILA = 254,
    ANY = 255,
}
