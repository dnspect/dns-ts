export type Uint8 = number;
export type Uint16 = number;
export type Uint32 = number;
export type Uint48 = number; // less then Number.MAX_SAFE_INTEGER

/**
 * The max value of a Uint16 number.
 */
export const Uint16Max = 0xffff;

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
    QUERY = 0,
    IQUERY = 1,
    STATUS = 2,
    // There is no 3 yet.
    NOTIFY = 4,
    UPDATE = 5,
}

/**
 * Converts a string to Opcode.
 *
 * @param name The op name.
 * @returns
 */
export function opcodeFrom(op: string): Opcode | null {
    switch (op.toUpperCase()) {
        case "QUERY":
            return Opcode.QUERY;
        case "IQUERY":
            return Opcode.IQUERY;
        case "STATUS":
            return Opcode.STATUS;
        case "NOTIFY":
            return Opcode.NOTIFY;
        case "UPDATE":
            return Opcode.UPDATE;
        default:
            return null;
    }
}

/**
 * A two octet code that specifies the class of the resource record.
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-3.2.4
 */
export enum Class {
    IN = 1, // The Internet
    CS = 2, // The CSNET class (Obsolete - used only for examples in some obsolete RFCs)
    CH = 3, // The CHAOS class
    HS = 4, // Hesiod [Dyer 87]
}

/**
 * Converts a string to Class.
 *
 * @param name The resource record class name.
 * @returns
 */
export function classFrom(name: string): Class | null {
    switch (name.toUpperCase()) {
        case "IN":
        case "INET":
            return Class.IN;
        case "CS":
        case "CSNET":
            return Class.CS;
        case "CH":
        case "CHAOS":
            return Class.CH;
        case "HS":
        case "HESIOD":
            return Class.HS;
        default:
            return null;
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
export enum QClassExtend {
    ANY = 255, // The ANY class
}

/**
 * Converts a string to QClass.
 *
 * @param name The query class name.
 * @returns
 */
export function qclassFrom(name: string): QClass | null {
    name = name.toUpperCase();

    if (name === "ANY") {
        return QClassExtend.ANY;
    }

    return classFrom(name);
}

/**
 * Returns the abbreviation of the query class name.
 *
 * @param c
 * @returns
 */
export function qclassAbbr(c: QClass): string {
    if (c in Class) {
        return Class[c as Class];
    }

    switch (c) {
        case QClassExtend.ANY:
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
    NOERROR = 0, // No Error                          [DNS]
    FORMERR = 1, // Format Error                      [DNS]
    SERVFAIL = 2, // Server Failure                   [DNS]
    NXDOMAIN = 3, // Name Error                       [DNS]
    NOTIMP = 4, // Not Implemented                    [DNS]
    REFUSED = 5, // Query Refused                     [DNS]
    YXDOMAIN = 6, // Name Exists when it should not   [DNS Update]
    YXRRSET = 7, // RR Set Exists when it should not  [DNS Update]
    NXRRSET = 8, // RR Set that should exist does not [DNS Update]
    NOTAUTH = 9, // Server Not Authoritative for zone [DNS Update]
    NOTZONE = 10, // Name not contained in zone       [DNS Update/TSIG]
    BADSIG = 16, // TSIG Signature Failure            [TSIG]
    BADVERS = 16, // Bad OPT Version                  [EDNS0]
    BADKEY = 17, // Key not recognized                [TSIG]
    BADTIME = 18, // Signature out of time window     [TSIG]
    BADMODE = 19, // Bad TKEY Mode                    [TKEY]
    BADNAME = 20, // Duplicate key name               [TKEY]
    BADALG = 21, // Algorithm not supported           [TKEY]
    BADTRUNC = 22, // Bad Truncation                  [TSIG]
    BADCOOKIE = 23, // Bad/missing Server Cookie      [DNS Cookies]
}

/**
 * Resource record type.
 */
export enum RRType {
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
    RESERVED = 65535,
}

/** All record record types */
export type RRTypes = keyof typeof RRType;

/**
 * Converts a string to RRType.
 *
 * @param name The resource record type name.
 * @returns
 */
export function rrtypeFrom(name: string): RRType | null {
    name = name.toUpperCase();

    switch (name) {
        case 'A': return RRType.A;
        case 'NS': return RRType.NS;
        case 'MD': return RRType.MD;
        case 'MF': return RRType.MF;
        case 'CNAME': return RRType.CNAME;
        case 'SOA': return RRType.SOA;
        case 'MB': return RRType.MB;
        case 'MG': return RRType.MG;
        case 'MR': return RRType.MR;
        case 'NULL': return RRType.NULL;
        case 'PTR': return RRType.PTR;
        case 'HINFO': return RRType.HINFO;
        case 'MINFO': return RRType.MINFO;
        case 'MX': return RRType.MX;
        case 'TXT': return RRType.TXT;
        case 'RP': return RRType.RP;
        case 'AFSDB': return RRType.AFSDB;
        case 'X25': return RRType.X25;
        case 'ISDN': return RRType.ISDN;
        case 'RT': return RRType.RT;
        case 'NSAPPTR': return RRType.NSAPPTR;
        case 'SIG': return RRType.SIG;
        case 'KEY': return RRType.KEY;
        case 'PX': return RRType.PX;
        case 'GPOS': return RRType.GPOS;
        case 'AAAA': return RRType.AAAA;
        case 'LOC': return RRType.LOC;
        case 'NXT': return RRType.NXT;
        case 'EID': return RRType.EID;
        case 'NIMLOC': return RRType.NIMLOC;
        case 'SRV': return RRType.SRV;
        case 'ATMA': return RRType.ATMA;
        case 'NAPTR': return RRType.NAPTR;
        case 'KX': return RRType.KX;
        case 'CERT': return RRType.CERT;
        case 'DNAME': return RRType.DNAME;
        case 'OPT': return RRType.OPT; // EDNS
        case 'APL': return RRType.APL;
        case 'DS': return RRType.DS;
        case 'SSHFP': return RRType.SSHFP;
        case 'RRSIG': return RRType.RRSIG;
        case 'NSEC': return RRType.NSEC;
        case 'DNSKEY': return RRType.DNSKEY;
        case 'DHCID': return RRType.DHCID;
        case 'NSEC3': return RRType.NSEC3;
        case 'NSEC3PARAM': return RRType.NSEC3PARAM;
        case 'TLSA': return RRType.TLSA;
        case 'SMIMEA': return RRType.SMIMEA;
        case 'HIP': return RRType.HIP;
        case 'NINFO': return RRType.NINFO;
        case 'RKEY': return RRType.RKEY;
        case 'TALINK': return RRType.TALINK;
        case 'CDS': return RRType.CDS;
        case 'CDNSKEY': return RRType.CDNSKEY;
        case 'OPENPGPKEY': return RRType.OPENPGPKEY;
        case 'CSYNC': return RRType.CSYNC;
        case 'ZONEMD': return RRType.ZONEMD;
        case 'SVCB': return RRType.SVCB;
        case 'HTTPS': return RRType.HTTPS;
        case 'SPF': return RRType.SPF;
        case 'UINFO': return RRType.UINFO;
        case 'UID': return RRType.UID;
        case 'GID': return RRType.GID;
        case 'UNSPEC': return RRType.UNSPEC;
        case 'NID': return RRType.NID;
        case 'L32': return RRType.L32;
        case 'L64': return RRType.L64;
        case 'LP': return RRType.LP;
        case 'EUI48': return RRType.EUI48;
        case 'EUI64': return RRType.EUI64;
        case 'URI': return RRType.URI;
        case 'CAA': return RRType.CAA;
        case 'AVC': return RRType.AVC;
        case 'TKEY': return RRType.TKEY;
        case 'TSIG': return RRType.TSIG;
        case 'TA': return RRType.TA;
        case 'DLV': return RRType.DLV;
        case 'RESERVED': return RRType.RESERVED;
        default: return null;
    }
}

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
export enum QTypeExtend {
    IXFR = 251,
    AXFR = 252,
    MAILB = 253,
    MAILA = 254,
    ANY = 255,
}

/**
 * Converts a string to QType.
 *
 * @param name The query type name.
 * @returns
 */
export function qtypeFrom(name: string): QType | null {
    name = name.toUpperCase();
    switch (name) {
        case "IXFR":
            return QTypeExtend.IXFR;
        case "AXFR":
            return QTypeExtend.AXFR;
        case "MAILB":
            return QTypeExtend.MAILB;
        case "MAILA":
            return QTypeExtend.MAILA;
        case "ANY":
            return QTypeExtend.ANY;
    }

    return rrtypeFrom(name);
}
