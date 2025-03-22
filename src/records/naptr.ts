import { CharacterString, QuoteMode } from "../char";
import { FQDN } from "../fqdn";
import { ParseError } from "../error";
import { RR } from "../rr";
import { Slice } from "../packet";
import { Uint16 } from "../types";
import { Writer } from "../buffer";

/**
 * This RR was originally produced by the URN Working Group [3] as a way
 * to encode rule-sets in DNS so that the delegated sections of a URI
 * could be decomposed in such a way that they could be changed and re-
 * delegated over time. The result was a Resource Record that included
 * a regular expression that would be used by a client program to
 * rewrite a string into a domain name. Regular expressions were chosen
 * for their compactness to expressivity ratio allowing for a great deal
 * of information to be encoded in a rather small DNS packet.
 *
 * The function of rewriting a string according to the rules in a record
 * has usefulness in several different applications. This document
 * defines the basic assumptions to which all of those applications must
 * adhere to. It does not define the reasons the rewrite is used, what
 * the expected outcomes are, or what they are used for. Those are
 * specified by applications that define how they use the NAPTR record
 * and algorithms within their contexts.
 *
 * Flags and other fields are also specified in the RR to control the
 * rewrite procedure in various ways or to provide information on how to
 * communicate with the host at the domain name that was the result of
 * the rewrite.
 *
 * The format of the NAPTR RR
 *
 * Here is the format of the NAPTR RR, whose DNS type code is 35:
 *       _Service._Proto.Name TTL Class NAPTR Order Preference Flags Service Regexp Replacement
 */
export class NAPTR extends RR {
    /**
     * A 16-bit unsigned integer specifying the order in which the NAPTR records MUST be processed
     * to ensure the correct ordering of rules. Low numbers are processed before high numbers, and
     * once a NAPTR is found whose rule "matches" the target, the client MUST NOT consider any NAPTRs
     * with a higher value for order (except as noted below for the Flags field).
     */
    order!: Uint16;
    /**
     * A 16-bit unsigned integer that specifies the order in which NAPTR records with equal "order"
     * values SHOULD be processed, low numbers being processed before high numbers.
     */
    preference!: Uint16;
    /**
     * A <character-string> which contains various flags.
     *
     * Flags to control aspects of the rewriting and interpretation of the fields in the record.
     * Flags are single characters from the set [A-Z0-9]. The case of the alphabetic characters is
     * not significant.
     */
    flags!: CharacterString;
    /**
     * A <character-string> which contains protocol and service identifiers.
     *
     * Specifies the service(s) available down this rewrite path. It may also specify the particular
     * protocol that is used to talk with a service. A protocol MUST be specified if the flags field
     * states that the NAPTR is terminal. If a protocol is specified, but the flags field does not
     * state that the NAPTR is terminal, the next
     */
    service!: CharacterString;
    /**
     * A <character-string> which contains a regular expression.
     */
    regexp!: CharacterString;
    /**
     * A <domain-name> which specifies the new value in the case where the regular expression is a
     * simple replacement operation.
     */
    replacement!: FQDN;

    unpackRdata(rdata: Slice): void {
        this.order = rdata.readUint16();
        this.preference = rdata.readUint16();
        this.flags = CharacterString.unpack(rdata);
        this.service = CharacterString.unpack(rdata);
        this.regexp = CharacterString.unpack(rdata);
        this.replacement = rdata.readName();
    }

    packRdata(buf: Writer): number {
        return (
            buf.writeUint16(this.order) +
            buf.writeUint16(this.preference) +
            this.flags.pack(buf) +
            this.service.pack(buf) +
            this.regexp.pack(buf) +
            buf.writeName(this.replacement, true)
        );
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`missing RDATA`);
            case 1:
                throw new ParseError(`missing <preference> in RDATA`);
            case 2:
                throw new ParseError(`missing <flags> in RDATA`);
            case 3:
                throw new ParseError(`missing <service> in RDATA`);
            case 4:
                throw new ParseError(`missing <regexp> in RDATA`);
            case 5:
                throw new ParseError(`missing <replacement> in RDATA`);
        }

        this.order =
            rdata[0].toUint16() ??
            (() => {
                throw new ParseError("invalid <order> in RDATA");
            })();

        this.preference =
            rdata[1].toUint16() ??
            (() => {
                throw new ParseError("invalid <preference> in RDATA");
            })();

        this.flags = rdata[2];
        this.service = rdata[3];
        this.regexp = rdata[4];
        this.replacement = FQDN.parse(rdata[5].raw());
    }

    presentRdata(): string {
        return `${this.order} ${this.preference} ${this.flags.present(QuoteMode.Always)} ${this.service.present(QuoteMode.Always)} ${this.regexp.present(QuoteMode.Always)} ${this.replacement.present()}`;
    }
}
