import { A } from "./a";
import { AAAA } from "./aaaa";
import { CNAME } from "./cname";
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

export { A } from "./a";
export { AAAA } from "./aaaa";
export { CNAME } from "./cname";
export { DS, DNSKEY, NSEC, RRSIG, NSEC3, NSEC3PARAM } from "./dnssec";
export { HINFO } from "./hinfo";
export { LOC } from "./loc";
export { MB } from "./mb";
export { MG } from "./mg";
export { MINFO } from "./minfo";
export { MR } from "./mr";
export { MX } from "./mx";
export { NS } from "./ns";
export { OPT, OptHeader } from "./opt";
export { PTR } from "./ptr";
export { SOA } from "./soa";
export { SRV } from "./srv";
export { SSHFP } from "./sshfp";
export { TSIG } from "./tsig";
export { TXT } from "./txt";

export function unpackRecord(s: Slice): RR {
    const h = Header.unpack(s);
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
        default:
            throw new ParseError(`unsupported resource record type: TYPE${h.type}`);
    }

    record.unpackRdata(s.readSlice(h.rdlength));

    return record;
}
