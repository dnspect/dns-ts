import { A, AAAA, CNAME, OPT, OptHeader, TXT } from "./records";
import { Address4, Address6 } from "@dnspect/ip-address-ts";
import { CharactorString } from "./packet";
import { Class, Opcode, QType, RRType, Rcode, Uint32 } from "./types";
import { FQDN } from "./fqdn";
import { Message, Header } from "./message";
import { Question } from "./question";
import { RR, Header as RRHeader } from "./rr";
import * as edns from "./edns";

type Owner = FQDN | string;
type AppendRR = (record: RR) => void;

/**
 * Builder for building a DNS message.
 */
export class MessageBuilder {
    private msg: Message;

    constructor() {
        this.msg = new Message(new Header(0x0, 0x0, 0x0, 0x0, 0x0, 0x0));
    }

    /**
     * Gets a builder to build header.
     *
     * @returns
     */
    header(): HeaderBuilder {
        return new HeaderBuilder(this.msg.header);
    }

    /**
     * Gets a builder to build question section.
     *
     * @returns
     */
    question(): QuestionBuilder {
        return new QuestionBuilder((q: Question) => {
            this.msg.header.qdCount++;
            this.msg.question.push(q);
        });
    }

    /**
     * Gets a builder to build answer section.
     *
     * @returns
     */
    answer(): AnswerBuilder {
        return new AnswerBuilder((record: RR) => {
            this.msg.header.anCount++;
            this.msg.answer.push(record);
        });
    }

    /**
     * Gets a builder to build authority section.
     *
     * @returns
     */
    authority(): SectionBuilder {
        return new SectionBuilder((record: RR) => {
            this.msg.header.nsCount++;
            this.msg.authority.push(record);
        });
    }

    /**
     * Gets a builder to build additional section.
     *
     * @returns
     */
    additional(): AdditionalBuilder {
        return new AdditionalBuilder((record: RR) => {
            this.msg.header.arCount++;
            this.msg.additional.push(record);
        });
    }

    /**
     * Starts creating an answer for the query message.
     *
     * @param query
     */
    startAnswer(query: Message, rcode: Rcode): SectionBuilder {
        this.msg.header.id = query.header.id;
        this.msg.header.flags.qr = true;
        this.msg.header.flags.opcode = query.header.opcode();
        this.msg.header.flags.rd = query.header.flags.rd;
        this.msg.header.flags.rcode = rcode;

        const qb = this.question();
        for (const q of query.question) {
            qb.push(q.clone());
        }

        return this.answer();
    }

    /**
     * Builds a DNS message.
     *
     * @returns
     */
    build(): Message {
        return this.msg;
    }
}

/**
 * Builder for building header of a DNS message.
 */
class HeaderBuilder {
    private header: Header;

    constructor(header: Header) {
        this.header = header;
    }

    /**
     * Generates a random message identifier using built-in Math.random().
     *
     * The value range is [1, 65535].
     */
    randomId(): void {
        this.header.id = Math.floor(Math.random() * 0xFFFE + 1);
    }

    /**
     * Sets the QR bit.
     *
     * @param isResponse
     */
    setQR(isResponse: boolean): void {
        this.header.flags.qr = isResponse;
    }

    /**
     * Sets the Opcode.
     *
     * @param opcode
     */
    setOpcode(opcode: Opcode): void {
        this.header.flags.opcode = opcode;
    }

    /**
     * Sets the AA bit.
     *
     * @param aa
     */
    setAA(aa: boolean): void {
        this.header.flags.aa = aa;
    }

    /**
     * Sets the TC bit.
     *
     * @param tc
     */
    setTC(tc: boolean): void {
        this.header.flags.tc = tc;
    }

    /**
     * Sets the RD bit.
     *
     * @param rd
     */
    setRD(rd: boolean): void {
        this.header.flags.rd = rd;
    }

    /**
     * Sets the RA bit.
     *
     * @param ra
     */
    setRA(ra: boolean): void {
        this.header.flags.ra = ra;
    }

    /**
     * Sets the AD bit.
     *
     * @param ad
     */
    setAD(ad: boolean): void {
        this.header.flags.ad = ad;
    }

    /**
     * Sets the CD bit.
     *
     * @param cd
     */
    setCD(cd: boolean): void {
        this.header.flags.cd = cd;
    }

    /**
     * Sets the Rcode.
     *
     * Note that this method only take the low 4-bits. The upper 8 bits if not all-zero, should be
     * set in OPT record as the EDNS(0) extended rcode.
     *
     * @param rcode
     */
    setRcode(rcode: Rcode): void {
        this.header.flags.rcode = rcode & 0b1111;
    }
}

/**
 * Builder for building question section of a DNS message.
 */
class QuestionBuilder {
    /**
     * The message builder we work on.
     */
    private append: (q: Question) => void;

    constructor(append: (q: Question) => void) {
        this.append = append;
    }

    /**
     * Appends a question to the question section.
     *
     * @param question
     */
    push(q: Question): void {
        this.append(q);
    }

    /**
     * Appends a INET query question.
     *
     * @param queryName The query name
     * @param queryType The query type
     */
    push_in(queryName: Owner, queryType: QType): void {
        const qname = (queryName instanceof FQDN) ? queryName : FQDN.parse(queryName);
        this.append(new Question(qname, queryType, Class.INET));
    }

    /**
     * Appends a CHAOS query question.
     *
     * @param queryName The query name
     * @param queryType The query type
     */
    push_ch(queryName: Owner, queryType: QType): void {
        const qname = (queryName instanceof FQDN) ? queryName : FQDN.parse(queryName);
        this.append(new Question(qname, queryType, Class.CHAOS));
    }
}

/**
 * Builder for building individual sections of a DNS message.
 */
class SectionBuilder {
    private append: AppendRR;

    constructor(append: AppendRR) {
        this.append = append;
    }

    /**
     * Appends a resource record to the section.
     *
     * @param record
     */
    push(record: RR): void {
        this.append(record);
    }
}
/**
 * Builder for building the answer section of a DNS message.
 */
class AnswerBuilder extends SectionBuilder {
    /**
     * Appends an A record.
     *
     * @param owner
     * @param ttl
     * @param address
     */
    push_a(owner: Owner, ttl: Uint32, address: Address4) {
        const a = new A(new RRHeader(owner, RRType.A, Class.INET, ttl));
        a.address = address;
        this.push(a);
    }

    /**
     * Appends an AAAA record.
     *
     * @param owner
     * @param ttl
     * @param address
     */
    push_aaaa(owner: Owner, ttl: Uint32, address: Address6) {
        const aaaa = new AAAA(new RRHeader(owner, RRType.AAAA, Class.INET, ttl));
        aaaa.address = address;
        this.push(aaaa);
    }

    /**
     * Appends a CNAME record.
     *
     * @param owner
     * @param ttl
     * @param target
     */
    push_cname(owner: Owner, ttl: Uint32, target: FQDN) {
        const cname = new CNAME(new RRHeader(owner, RRType.CNAME, Class.INET, ttl));
        cname.target = target;
        this.push(cname);
    }

    /**
     * Appends a TXT record.
     *
     * @param owner
     * @param ttl
     * @param content
     * @param cls The class of resource record
     */
    push_txt(owner: Owner, ttl: Uint32, content: string[], cls: Class = Class.INET) {
        const txt = new TXT(new RRHeader(owner, RRType.TXT, cls, ttl));
        txt.content = content.map((str) => new CharactorString(str));
        this.push(txt);
    }
}

/**
 * Builder for building the additional section of a DNS message.
 */
class AdditionalBuilder extends SectionBuilder {
    /**
     * Appends an A record.
     *
     * @param owner
     * @param ttl
     * @param address
     */
    push_a(owner: Owner, ttl: Uint32, address: Address4) {
        const a = new A(new RRHeader(owner, RRType.A, Class.INET, ttl));
        a.address = address;
        this.push(a);
    }

    /**
     * Appends an AAAA record.
     *
     * @param owner
     * @param ttl
     * @param address
     */
    push_aaaa(owner: Owner, ttl: Uint32, address: Address6) {
        const aaaa = new AAAA(new RRHeader(owner, RRType.AAAA, Class.INET, ttl));
        aaaa.address = address;
        this.push(aaaa);
    }

    /**
     * Appends and builds an OPT record.
     *
     * The actual building of the record is handled by a closure that receives an `OptBuilder`
     * which can both change the header of the record and add options.
     *
     * @param build
     */
    opt(build: (ob: OptBuilder) => void): void {
        const ob = new OptBuilder();
        build(ob);
        this.push(ob.build());
    }
}

/**
 * Builder for building an OPT record.
 */
class OptBuilder extends OptHeader {
    private options: edns.Option[];

    constructor() {
        super();
        this.options = new Array<edns.Option>();
    }

    /**
     * Appends an option to the OPT record.
     *
     * @param option
     */
    push(option: edns.Option): void {
        this.options.push(option);
    }

    /**
     * Builds the OPT resource record with provided data.
     *
     * @returns
     */
    build(): OPT {
        const rr = new OPT(this.toHeader());
        rr.options = this.options;
        return rr;
    }
}
