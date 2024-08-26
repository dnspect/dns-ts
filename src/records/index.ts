import { A } from "./a";
import { AAAA } from "./aaaa";
import { CNAME } from "./cname";
import { DNAME } from "./dname";
import { DS, DNSKEY, NSEC, RRSIG, NSEC3, NSEC3PARAM } from "./dnssec";
import { Header, RR } from "../rr";
import { HINFO } from "./hinfo";
import { LOC } from "./loc";
import { MB } from "./mb";
import { MG } from "./mg";
import { MINFO } from "./minfo";
import { MR } from "./mr";
import { MX } from "./mx";
import { NS } from "./ns";
import { OPT } from "./opt";
import { Slice } from "../packet";
import { ParseError } from "../error";
import { PTR } from "./ptr";
import { RRType } from "../types";
import { SOA } from "./soa";
import { SRV } from "./srv";
import { SSHFP } from "./sshfp";
import { TSIG } from "./tsig";
import { TXT } from "./txt";
import { ZONEMD } from "./zonemd";
import { NSAP, NSAPPTR } from "./nsap";
import { Lexer, scanHeader, scanRdata } from "../scan";
import { CharReader } from "../buffer";

export { A, isA } from "./a";
export { AAAA, isAAAA } from "./aaaa";
export { CNAME, isCNAME } from "./cname";
export { DNAME, isDNAME } from "./dname";
export { HINFO } from "./hinfo";
export { LOC } from "./loc";
export { MB } from "./mb";
export { MG } from "./mg";
export { MINFO } from "./minfo";
export { MR } from "./mr";
export { MX } from "./mx";
export { NS, isNS } from "./ns";
export { OPT, OptHeader, isOPT } from "./opt";
export { PTR } from "./ptr";
export { SOA, Serial } from "./soa";
export { SRV } from "./srv";
export { SSHFP } from "./sshfp";
export { TSIG } from "./tsig";
export { TXT } from "./txt";
export { ZONEMD } from "./zonemd";
export { NSAP, NSAPPTR } from "./nsap";

/**
 * Initialize a resource record with header data.
 *
 * Note that the RDATA portion is left to the caller to fulfill.
 *
 * @param h Header RR header.
 * @returns A initialized resource record.
 *
 * @throws ParseError
 */
function initRecord(h: Header): RR {
    let record: RR;

    switch (h.type) {
        case RRType.A: {
            record = new A(h);
            break;
        }
        case RRType.AAAA: {
            record = new AAAA(h);
            break;
        }
        case RRType.CNAME: {
            record = new CNAME(h);
            break;
        }
        case RRType.DNAME: {
            record = new DNAME(h);
            break;
        }
        case RRType.DNSKEY: {
            record = new DNSKEY(h);
            break;
        }
        case RRType.DS: {
            record = new DS(h);
            break;
        }
        case RRType.HINFO: {
            record = new HINFO(h);
            break;
        }
        case RRType.LOC: {
            record = new LOC(h);
            break;
        }
        case RRType.MB: {
            record = new MB(h);
            break;
        }
        case RRType.MG: {
            record = new MG(h);
            break;
        }
        case RRType.MINFO: {
            record = new MINFO(h);
            break;
        }
        case RRType.MR: {
            record = new MR(h);
            break;
        }
        case RRType.MX: {
            record = new MX(h);
            break;
        }
        case RRType.NS: {
            record = new NS(h);
            break;
        }
        case RRType.NSEC: {
            record = new NSEC(h);
            break;
        }
        case RRType.NSEC3: {
            record = new NSEC3(h);
            break;
        }
        case RRType.NSEC3PARAM: {
            record = new NSEC3PARAM(h);
            break;
        }
        case RRType.OPT: {
            record = new OPT(h);
            break;
        }
        case RRType.PTR: {
            record = new PTR(h);
            break;
        }
        case RRType.RRSIG: {
            record = new RRSIG(h);
            break;
        }
        case RRType.SOA: {
            record = new SOA(h);
            break;
        }
        case RRType.SRV: {
            record = new SRV(h);
            break;
        }
        case RRType.SSHFP: {
            record = new SSHFP(h);
            break;
        }
        case RRType.TSIG: {
            record = new TSIG(h);
            break;
        }
        case RRType.TXT: {
            record = new TXT(h);
            break;
        }
        case RRType.ZONEMD: {
            record = new ZONEMD(h);
            break;
        }
        case RRType.NSAP: {
            record = new NSAP(h);
            break;
        }
        case RRType.NSAPPTR: {
            record = new NSAPPTR(h);
            break;
        }
        default:
            throw new ParseError(`unsupported resource record type: TYPE${h.type}`);
    }

    return record;
}

/**
 * Unpacks resource record from a sequence of bytes.
 *
 * @param s A slice of bytes.
 * @returns Resource record
 *
 * @throws ParseError
 */
export function unpackRecord(s: Slice): RR {
    const h = Header.unpack(s);
    const record = initRecord(h);
    record.unpackRdata(s.readSlice(h.rdlength));
    return record;
}

/**
 * Scans a resource record using a lexer.
 *
 * @param l A lexer and an optional started header (from zonefile).
 *
 * @returns Resource record
 *
 * @throws ParseError
 */
export function scanRecord(lexer: Lexer, startedHeader: Header | null): RR {
    const header =
        startedHeader === null
            ? scanHeader(lexer)
            : scanHeader(lexer, startedHeader.name, startedHeader.class, startedHeader.ttl);

    const rr = initRecord(header);

    const rdata = scanRdata(lexer);
    if (rdata.length === 0) {
        throw new ParseError(`missing RDATA`);
    }

    rr.parseRdata(rdata);
    return rr;
}

/**
 * Parses resource record from a textual representation.
 *
 * @param input RFC 1035 compliant ASCII string describe the resource record.
 *
 * @returns Resource record
 *
 * @throws ParseError
 */
export function parseRecord(input: string): RR {
    const reader = CharReader.from(input);
    const lexer = new Lexer(reader);
    return scanRecord(lexer, null);
}
