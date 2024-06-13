import { Address4 } from "@dnspect/ip-address-ts";
import { AddressRR, RR } from "../rr";
import { Slice } from "../packet";
import { RRType } from "../types";
import { Writer } from "../buffer";

/**
 * Hosts that have multiple Internet addresses will have multiple A records.
 *
 * A RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    ADDRESS                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class A extends RR implements AddressRR {
    /**
     * A 32 bit Internet address.
     */
    address!: Address4;

    unpackRdata(rdata: Slice): void {
        this.address = Address4.fromInteger(rdata.readUint32());
    }

    packRdata(buf: Writer): number {
        return buf.write(this.address.bytes());
    }

    parseRdata(rdata: string): void {
        this.address = Address4.parse(rdata);
    }

    rdataString(): string {
        return `${this.address}`;
    }
}

/**
 * Type guard for `A`.
 *
 * @param rr
 * @returns
 */
export const isA = (rr: RR): rr is A => rr.header.type === RRType.A;
