import { Writer } from "../buffer";
import { CharacterString } from "../char";
import { binaryToString, stringToBinary } from "../encoding";
import { FQDN } from "../fqdn";
import { Slice } from "../packet";
import { RR } from "../rr";

/**
 * The NSAP RR is defined with mnemonic "NSAP" and TYPE code 22
 * (decimal) and is used to map from domain names to NSAPs. Name-to-NSAP
 * mapping in the DNS using the NSAP RR operates analogously to IP
 * address lookup.
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc1706#section-5
 */
export class NSAP extends RR {
    /**
     * The binary encoding of the NSAP as it would appear in the CLNP source or destination address field.
     */
    address!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.address = rdata.readUint8Array();
    }

    packRdata(buf: Writer): number {
        return buf.write(this.address);
    }

    parseRdata(rdata: CharacterString[]): void {
        // Remove leading "0x" and any "." inserted in the hex string.
        const address = rdata[0].raw().replaceAll(/(^0x|\.)/ig, "");
        this.address = stringToBinary(address, "hex");
    }

    /**
     * The RR data is the ASCII representation of the digits.  It is encoded
     * as two <character-strings>, i.e., count followed by characters.
     */
    presentRdata(): string {
        return `0x${binaryToString(this.address, "hex")}`;
    }
}


/**
 * The NSAP-PTR RR is defined with mnemonic NSAP-PTR and a type code 23
 * (decimal).
 *
 * Its function is analogous to the PTR record used for IP addresses
 */
export class NSAPPTR extends RR {
    /**
     * The domain name under the "NSAP.INT" domain.
     */
    domain!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.domain = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return buf.writeName(this.domain, false);
    }

    parseRdata(rdata: CharacterString[]): void {
        this.domain = FQDN.parse(rdata[0].raw());
    }

    presentRdata(): string {
        return this.domain.present();
    }
}
