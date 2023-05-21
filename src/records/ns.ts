import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";
import { RRType } from "../types";
import { Writer } from "../buffer";

/**
 * NS stands for ‘nameserver,’ and the nameserver record indicates which DNS server is authoritative
 * for that domain (i.e. which server contains the actual DNS records).
 *
 * NS records tell the Internet where to go to find out a domain's IP address. A domain often has
 * multiple NS records which can indicate primary and secondary nameservers for that domain. Without
 * properly configured NS records, users will be unable to load a website or application.
 *
 * NS RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                   NSDNAME                     /
 * /                                               /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class NS extends RR {
    /**
     * A <domain-name> which specifies a host which should be authoritative for the specified class
     * and domain.
     */
    nameserver!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.nameserver = rdata.readDomainName();
    }

    packRdata(buf: Writer): number {
        return this.nameserver.pack(buf);
    }

    toString(): string {
        return `${this.header}\t${this.nameserver}`;
    }
}

/**
 * Type guard for `NS`.
 *
 * @param rr
 * @returns
 */
export const isNS = (rr: RR): rr is NS => rr.header.type === RRType.NS;
