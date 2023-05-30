import { Writer } from "./buffer";
import { FQDN } from "./fqdn";
import { Slice } from "./packet";
import { QClass, qclassAbbr, QType, RRType } from "./types";

/**
 *
 * ```
 *                                 1  1  1  1  1  1
 *   0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                                               |
 *  /                     QNAME                     /
 *  /                                               /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                     QTYPE                     |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                     QCLASS                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  ```
 *
 * See also {@link https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2}
 */
export class Question {
    /**
     * Query name
     */
    readonly qname: FQDN;
    /**
     * Query type
     *
     * A two octet code which specifies the type of the query. The values for this field include all codes valid for a
     * TYPE field, together with some more general codes which can match more than one type of RR.
     */
    readonly qtype: QType;
    /**
     * Query class
     *
     * A two octet code that specifies the class of the query. For example, the QCLASS field is IN for the Internet.
     */
    readonly qclass: QClass;

    constructor(qname: FQDN, qtype: QType, qclass: QClass) {
        this.qname = qname;
        this.qtype = qtype;
        this.qclass = qclass;
    }

    /**
     * Makes a deep copy this question object.
     *
     * @returns
     */
    clone(): Question {
        return new Question(this.qname.clone(), this.qtype, this.qclass);
    }

    /**
     * Generates textual representation in dig-like format.
     *
     * @returns
     */
    toString(): string {
        return `;${this.qname.toString()}\t\t${qclassAbbr(this.qclass)}\t${RRType[this.qtype].toUpperCase()}`;
    }

    /**
     * Returns JSON object of the question that will generate textual in application/dns-json format.
     *
     * @returns
     */
    toJsonObject(): object {
        return {
            "name": this.qname.toString(),
            "type": this.qclass,
        };
    }

    pack(buf: Writer): number {
        let n = this.qname.pack(buf);
        n += buf.writeUint16(this.qtype);
        n += buf.writeUint16(this.qclass);
        return n;
    }

    static unpack(s: Slice): Question {
        return new Question(s.readDomainName(), s.readUint16(), s.readUint16());
    }
}
