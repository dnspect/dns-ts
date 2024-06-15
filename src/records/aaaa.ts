import { Address6 } from "@dnspect/ip-address-ts";
import { AddressRR, RR } from "../rr";
import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RRType } from "../types";
import { Writer } from "../buffer";

/**
 * AAAA records match a domain name to an IPv6 address.
 *
 * DNS AAAA records are exactly like DNS A records, except that they store a domain's IPv6 address
 * instead of its IPv4 address.
 *
 * AAAA RDATA format:
 *   A 128 bit IPv6 address is encoded in the data portion of an AAAA resource record in network
 *   byte order (high-order byte first).
 */
export class AAAA extends RR implements AddressRR {
    address!: Address6;

    unpackRdata(rdata: Slice): void {
        this.address = Address6.fromBytes(rdata.readUint8Array(this.header.rdlength));
    }

    packRdata(buf: Writer): number {
        return buf.write(this.address.bytes());
    }

    parseRdata(rdata: CharacterString[]): void {
        this.address = Address6.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return this.address.toString();
    }
}

/**
 * Type guard for `AAAA`.
 *
 * @param rr
 * @returns
 */
export const isAAAA = (rr: RR): rr is AAAA => rr.header.type === RRType.AAAA;
