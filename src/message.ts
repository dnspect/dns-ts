import { Packet, Slice } from "./packet";
import { Question } from "./question";
import { RR } from "./rr";
import { Opcode, RRType, Rcode, Uint16 } from "./types";
import { unpackRecord } from "./records";
import { OPT } from "./records/opt";
import { Writer, PacketBuffer } from "./buffer";
import { ClientSubnet } from "./edns";

type Flags = {
    /**
     * Query or response
     *
     * This flag indicates whether the message is a query (false) or a response (true).
     */
    qr: boolean;
    /**
     * The kind of the query.
     */
    opcode: Opcode;
    /**
     * Authoritative answer
     *
     * This flag is valid in responses, and specifies that the responding name server is an authority for the domain
     * name in question section.
     */
    aa: boolean;
    /**
     * Truncation
     *
     * This flag specifies that this message was truncated due to length greater than that permitted on the transmission
     * channel.
     */
    tc: boolean;
    /**
     * Recursion desired
     *
     * This flag may be set in a query and is copied into the response. If RD is set, it directs the name server to
     * pursue the query recursively. Recursive query support is optional.
     */
    rd: boolean;
    /**
     * Recursion available
     *
     * This flag is set or cleared in a response, and denotes whether recursive query support is available in the name
     * server.
     */
    ra: boolean;
    /**
     * Reserved for future use. Must be zero in all queries and responses.
     */
    z: boolean;
    /**
     * Authenticated data
     *
     * This flag, if included in a DNS response, it means the DNS response is authentic because it was validated using
     * DNSSEC.
     */
    ad: boolean;
    /**
     * Checking disabled
     *
     * This flag indicates in a query that pending (non-authenticated) data is acceptable to the resolver sending the
     * query.
     */
    cd: boolean;
    /**
     * The response code
     */
    rcode: Rcode;
};

/**
 * The header section of the DNS message.
 *
 * A header section is always present in a DNS message, it includes fields that specify which of the remaining sections
 * are present, and also specify whether the message is a query or a response, a standard query or some other opcode, etc.
 *
 *                                 1  1  1  1  1  1
 *   0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                      ID                       |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |QR|   Opcode  |AA|TC|RD|RA| Z|AD|CD|   RCODE   |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    QDCOUNT                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    ANCOUNT                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    NSCOUNT                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  |                    ARCOUNT                    |
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *
 * See also https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
 */
export class Header {
    /**
     * A 16 bit identifier assigned by the program that generates any kind of query. This identifier is copied the
     * corresponding reply and can be used by the requester to match up replies to outstanding queries.
     */
    id: Uint16;
    /**
     * A two octet value that contains QR/Opcode/AA/TC/RD/RA/Z/RCODE flags.
     */
    flags: Flags;
    /**
     * An unsigned 16 bit integer specifying the number of entries in the question section.
     */
    qdCount: Uint16;
    /**
     * An unsigned 16 bit integer specifying the number of resource records in the answer section.
     */
    anCount: Uint16;
    /**
     * An unsigned 16 bit integer specifying the number of name server resource records in the authority records section.
     */
    nsCount: Uint16;
    /**
     * An unsigned 16 bit integer specifying the number of resource records in the additional records section.
     */
    arCount: Uint16;

    constructor(
        id: Uint16,
        flags: Uint16,
        qdCount: Uint16,
        anCount: Uint16,
        nsCount: Uint16,
        arCount: Uint16
    ) {
        this.id = id;
        this.flags = this.unpackFlags(flags);
        this.qdCount = qdCount;
        this.anCount = anCount;
        this.nsCount = nsCount;
        this.arCount = arCount;
    }

    private unpackFlags(flags: Uint16): Flags {
        return {
            qr: (flags & 0b1000000000000000) >> 15 === 1,
            opcode: (flags & 0b111100000000000) >> 11,
            aa: (flags & 0b10000000000) >> 10 === 1,
            tc: (flags & 0b1000000000) >> 9 === 1,
            rd: (flags & 0b100000000) >> 8 === 1,
            ra: (flags & 0b10000000) >> 7 === 1,
            z: (flags & 0b1000000) >> 6 === 1,
            ad: (flags & 0b100000) >> 5 === 1,
            cd: (flags & 0b10000) >> 4 === 1,
            rcode: flags & 0b1111,
        };
    }

    private packFlags(buf: Writer): number {
        const high = (this.flags.qr ? 0b10000000 : 0b0) |
            (this.flags.opcode << 3) |
            (this.flags.aa ? 0b100 : 0b0) |
            (this.flags.tc ? 0b10 : 0b0) |
            (this.flags.rd ? 0b1 : 0b0);
        const low = (this.flags.ra ? 0b10000000 : 0b0) |
            (this.flags.z ? 0b1000000 : 0b0) |
            (this.flags.ad ? 0b10000 : 0b0) |
            (this.flags.cd ? 0b1000 : 0b0) |
            this.flags.rcode;

        return buf.writeUint8(high) + buf.writeUint8(low);
    }

    isQuery(): boolean {
        return !this.flags.qr;
    }

    isResponse(): boolean {
        return this.flags.qr;
    }

    opcode(): Opcode {
        return this.flags.opcode;
    }

    authoritative(): boolean {
        return this.flags.aa;
    }

    truncated(): boolean {
        return this.flags.tc;
    }

    recursionDesired(): boolean {
        return this.flags.rd;
    }

    recursionAvailable(): boolean {
        return this.flags.ra;
    }

    zero(): boolean {
        return this.flags.z;
    }

    authenticatedData(): boolean {
        return this.flags.ad;
    }

    checkingDisabled(): boolean {
        return this.flags.cd;
    }

    rcode(): Rcode {
        return this.flags.rcode;
    }

    /**
     * Builds a dig-like output of the header.
     *
     * @returns
     */
    toString(): string {
        const flags = Array<string>();

        if (this.flags.qr) flags.push("qr");
        if (this.flags.aa) flags.push("aa");
        if (this.flags.tc) flags.push("tc");
        if (this.flags.rd) flags.push("rd");
        if (this.flags.ra) flags.push("ra");
        if (this.flags.ad) flags.push("ad");
        if (this.flags.cd) flags.push("cd");

        return `;; ->>HEADER<<- opcode: ${Opcode[this.flags.opcode].toUpperCase()}, status: ${Rcode[this.flags.rcode].toUpperCase()}, id: ${this.id}
;; flags: ${flags.join(" ")}; QUERY: ${this.qdCount}, ANSWER: ${this.anCount}, AUTHORITY: ${this.nsCount}, ADDITIONAL: ${this.arCount}`;
    }

    pack(buf: Writer): number {
        let n = buf.writeUint16(this.id);
        n += this.packFlags(buf);
        n += buf.writeUint16(this.qdCount);
        n += buf.writeUint16(this.anCount);
        n += buf.writeUint16(this.nsCount);
        n += buf.writeUint16(this.arCount);
        return n;
    }

    static unpack(headerData: Slice): Header {
        return new Header(
            headerData.readUint16(),
            headerData.readUint16(),
            headerData.readUint16(),
            headerData.readUint16(),
            headerData.readUint16(),
            headerData.readUint16()
        );
    }
}

/**
 * A type enumerate the three kinds of record sections in response.
 */
export const enum Section {
    Answer = "ANSWER",
    Authority = "AUTHORITY",
    Additional = "ADDITIONAL",
}

/**
 * Represents a record section.
 */
export class RecordSection {
    readonly section!: Section;
    readonly records!: RR[];

    constructor(section: Section) {
        this.section = section;
        this.records = [];
    }

    /**
     * Gets the first record.
     *
     * @returns
     */
    first(): RR | null {
        return this.records.length === 0 ? null : this.records[0];
    }

    /**
     * Gets the last record.
     *
     * @returns
     */
    last(): RR | null {
        const len = this.records.length;
        return len === 0 ? null : this.records[len - 1];
    }

    /**
     * Returns the number of records in the section.
     *
     * @returns
     */
    length(): number {
        return this.records.length;
    }

    /**
     * Appends a resource record to the list.
     *
     * @param rr
     */
    push(rr: RR): void {
        this.records.push(rr);
    }

    /**
     *
     * @param predicate
     * @returns
     */
    filter(predicate: (value: RR, index: number) => boolean): RR[] {
        return this.records.filter(predicate);
    }

    /**
     *
     * @param predicate
     * @returns
     */
    filterByType<T extends RR>(typeGuard: (rr: RR) => rr is T): T[] {
        return this.records.filter(typeGuard);
    }

    /**
     * Gets a iterator for given type of records in the section.
     *
     * @param predicate Type guard for the expected type of records.
     * @returns
     */
    iter<T extends RR>(predicate: (rr: RR) => rr is T): IterableIterator<T> {
        return new RecordIterator<T>(this.records, predicate);
    }

    /**
     * Generates a dig-like textual representation of the section.
     *
     * @param includeOPT Whether or not to include OPT record, if any,  in the output.
     * @returns
     */
    toString(includeOPT = false): string {
        const lines = [`\n;; ${this.section.toUpperCase()} SECTION:`];
        for (const rr of this.records) {
            if (!includeOPT && rr.header.type === RRType.OPT) {
                continue;
            }
            lines.push(rr.toString());
        }
        return lines.join("\n");
    }

    /**
     * Converts section data to a sequence of bytes and write to the buffer.
     *
     * @param buf
     * @returns
     */
    pack(buf: Writer): number {
        let n = 0;
        for (const rr of this.records) {
            n += rr.pack(buf);
        }
        return n;
    }

    /**
     * Unpacks record data of the section from the message packet.
     *
     * @param p The DNS message packet.
     * @param count The expected number of records in this section.
     * @returns
     */
    unpack(p: Packet, count: Uint16): void {
        for (let i = 0; i < count; i++) {
            this.records.push(unpackRecord(p));
        }
    }
}

/**
 * An iterator of resource records of given type.
 */
class RecordIterator<T extends RR> implements IterableIterator<T> {
    private records: RR[];
    private typeGuard: (rr: RR) => rr is T;
    private idx = 0;

    constructor(records: RR[], typeGuard: (rr: RR) => rr is T) {
        this.records = records;
        this.typeGuard = typeGuard;
    }

    [Symbol.iterator](): IterableIterator<T> {
        throw this;
    }

    next(): IteratorResult<T> {
        while (this.idx < this.records.length) {
            if (this.typeGuard(this.records[this.idx])) {
                break;
            }

            // Skip non-compatible RRs.
            this.idx++;
        }

        if (this.idx >= this.records.length) {
            return {
                done: true,
                value: null,
            };
        }

        return {
            done: this.idx + 1 === this.records.length,
            value: this.records[this.idx] as T,
        };
    }
}

/**
 * DNS message.
 *
 * All communications inside of the domain protocol are carried in a single format called a message. The top level
 * format of message is divided into 5 sections (some of which are empty in certain cases) shown below:
 * ```
 *  +---------------------+
 *  |        Header       |
 *  +---------------------+
 *  |       Question      | the question for the name server
 *  +---------------------+
 *  |        Answer       | RRs answering the question
 *  +---------------------+
 *  |      Authority      | RRs pointing toward an authority
 *  +---------------------+
 *  |      Additional     | RRs holding additional information
 *  +---------------------+
 * ```
 *
 * See also {@link https://datatracker.ietf.org/doc/html/rfc1035#section-4.1}
 */
export class Message {
    header: Header;
    question: Question[];
    answer: RecordSection;
    authority: RecordSection;
    additional: RecordSection;

    constructor(header: Header) {
        this.header = header;
        this.question = [];
        this.answer = new RecordSection(Section.Answer);
        this.authority = new RecordSection(Section.Authority);
        this.additional = new RecordSection(Section.Additional);
    }

    /**
     * Returns the 16-bit message identifier.
     *
     * @returns
     */
    id(): Uint16 {
        return this.header.id;
    }

    /**
     * Returns the OPT record from the message, if there is one.
     *
     * @returns
     */
    opt(): OPT | null {
        for (const rr of this.additional.records) {
            if (rr instanceof OPT) {
                return rr;
            }
        }
        return null;
    }

    firstQuestion(): Question | null {
        if (this.question.length === 0) {
            return null;
        }

        return this.question[0];
    }

    /**
     * Returns the last additional record from the message.
     *
     * @returns
     */
    lastAdditional(): RR | null {
        return this.additional.last();
    }

    /**
     * Builds a dig-like output of the message.
     *
     * @returns
     */
    toString(): string {
        const sections = Array<string>();

        sections.push(this.header.toString());

        const opt = this.opt();
        if (opt !== null) {
            sections.push("\n;; OPT PSEUDOSECTION:");
            sections.push(opt.toString());
            sections.push(";; QUESTION SECTION:");
        } else {
            sections.push("\n;; QUESTION SECTION:");
        }

        for (const q of this.question) {
            sections.push(q.toString());
        }

        if (!this.header.isQuery()) {
            if (this.header.anCount > 0) {
                sections.push(this.answer.toString());
            }

            if (this.header.nsCount > 0) {
                sections.push(this.authority.toString());
            }
        }

        if (this.header.arCount > (opt === null ? 0 : 1)) {
            sections.push(this.additional.toString());
        }

        return sections.join("\n");
    }

    /**
     * Returns a JSON object of the message that will generate textual in application/dns-json format.
     *
     * @returns The JSON object.
     */
    toJsonObject(): object {
        const header = this.header;

        let obj = {
            Status: header.rcode(),
            TC: header.truncated(),
            RD: header.recursionDesired(),
            RA: header.recursionAvailable(),
            AD: header.authenticatedData(),
            CD: header.checkingDisabled(),
            Question: this.question.map((q) => q.toJsonObject()),
            Answer: this.answer.records.map((rr) => rr.toJsonObject()),
        };

        if (header.authoritative()) {
            obj = { ...obj, ...{ AA: true } };
        }

        const opt = this.opt();
        if (opt !== null) {
            for (const item of opt.options) {
                if (item instanceof ClientSubnet) {
                    obj = { ...obj, ...{ edns_client_subnet: `${item.address}/${item.scopePrefixLength}` } };
                }
            }
        }

        return obj;
    }

    pack(buf: Writer): number {
        let n = this.header.pack(buf);
        for (const q of this.question) {
            n += q.pack(buf);
        }
        n += this.answer.pack(buf);
        n += this.authority.pack(buf);
        n += this.additional.pack(buf);
        return n;
    }

    /**
     * Unpack a DNS message from the buffer.
     *
     * @param buf
     * @returns
     *
     * @throws ParseError
     */
    static unpack(buf: ArrayLike<number> | ArrayBufferLike | PacketBuffer): Message {
        const pb = (buf instanceof PacketBuffer) ? buf : PacketBuffer.from(buf);
        const packet = new Packet(pb);
        const header = Header.unpack(packet.readSlice(12));
        const msg = new Message(header);

        for (let i = 0; i < header.qdCount; i++) {
            msg.question.push(Question.unpack(packet));
        }
        msg.answer.unpack(packet, header.anCount);
        msg.authority.unpack(packet, header.nsCount);
        msg.additional.unpack(packet, header.arCount);

        return msg;
    }
}
