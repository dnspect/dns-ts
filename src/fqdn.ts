import { ParseError } from "./error";
import { CharacterString, QuoteMode } from "./char";

/**
 * The length of any one label is limited to between 1 and 63 octets.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc2181#section-11 ?
 *
 */
const MAX_LABEL_SIZE = 63;

/**
 * The null label representing the root name.
 */
const NULL_LABEL = "";

/**
 * Fully-qualified domain name.
 *
 * A domain name (aka <domain-name in RFCs) is represented as a sequence of labels, where each label
 * consists of a length octet followed by that number of octets. The domain name terminates with the
 * zero length octet for the null label of the root.
 *
 * Note that this field may be an odd number of octets; no padding is used.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3696#section-2
 */
export class FQDN implements Iterable<string> {
    private readonly labels: string[];
    private cached?: string;

    /**
     *
     * @param labels
     *
     * @throws ParseError
     */
    constructor(labels: string[]) {
        if (labels.length === 0) {
            labels = [NULL_LABEL];
        } else if (labels[labels.length - 1] !== NULL_LABEL) {
            labels.push(NULL_LABEL);
        }

        for (let i = 0; i < labels.length - 1; i++) {
            // The length of any one label is limited to between 1 and 63 octets.
            if (labels[i].length === 0 || labels[i].length > MAX_LABEL_SIZE) {
                throw new ParseError(`label must be 63 characters or less`);
            }

            if (/[\\]+/.test(labels[i])) {
                throw new ParseError(`label must not contain backslash`);
            }

            // TLD should not be all-numeric.
            // See https://datatracker.ietf.org/doc/html/rfc3696#section-2
            if (i === labels.length - 2 && /^-?\d+$/.test(labels[i])) {
                throw new ParseError(`top-level domain label "${labels[i]}" should not be numeric`);
            }
        }

        this.labels = labels;
    }

    /**
     * New a label iterator.
     *
     * @returns
     */
    [Symbol.iterator](): Iterator<string> {
        return new LabelIterator(this.labels);
    }

    /**
     * Returns the number of labels (include the null label).
     *
     * @returns
     */
    labelLength(): number {
        return this.labels.length;
    }

    /**
     * Returns true if the domain is the root name ".".
     *
     * @returns
     */
    isRoot(): boolean {
        return this.labels.length <= 1;
    }

    /**
     * Returns the label at given position in the label list.
     *
     * The last label is always the null label representing the DNS root.
     *
     * @param pos
     * @returns
     *
     * @example
     * ```
     * const name = FQDN.parse("www.example.com");
     *
     * name.labelAt(0); // "www"
     * name.labelAt(1); // "example"
     * name.labelAt(2); // "com"
     * name.labelAt(3); // "" - the null label
     * name.labelAt(4); // null
     * ```
     */
    labelAt(pos: number): string | null {
        if (pos >= this.labels.length || pos < 0) {
            return null;
        }

        return this.labels[pos];
    }

    /**
     * Returns the label at given position in the label list in reverse order.
     *
     * The first label is always the null label representing the DNS root.
     *
     * @param pos
     * @returns
     *
     * @example
     * ```
     * const name = FQDN.parse("www.example.com");
     *
     * name.labelAtReverse(0); // "" - the null label
     * name.labelAtReverse(1); // "com" - TLD
     * name.labelAtReverse(2); // "example"
     * name.labelAtReverse(3); // "www"
     * name.labelAtReverse(4); // null
     * ```
     */
    labelAtReverse(pos: number): string | null {
        if (pos >= this.labels.length || pos < 0) {
            return null;
        }

        return this.labels[this.labels.length - 1 - pos];
    }

    /**
     * Gets the first label.
     *
     * @returns
     */
    first(): string {
        return this.labels[0];
    }

    /**
     * Gets the last but one (second last) label, if any.
     */
    penultimate(): string | null {
        if (this.labels.length < 2) {
            return null;
        }

        return this.labels[this.labels.length - 2];
    }

    /**
     * Determines whether the other name has the exact same labels with this name.
     *
     * @param other
     * @returns
     */
    equal(other: FQDN): boolean {
        if (this.labels.length !== other.labelLength()) {
            return false;
        }

        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i] !== other.labelAt(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determines whether `base` is a prefix of this name.
     *
     * @param base The prefix name.
     * @param excludeSelf Whether or not to return false when the two names are same.
     * @returns
     */
    startWith(base: FQDN, excludeSelf = false): boolean {
        const baseLen = base.labelLength();
        if (this.labels.length < baseLen || (excludeSelf && this.labels.length === baseLen)) {
            return false;
        }

        // Only root itself can start with root.
        if (baseLen === 1) {
            return this.labels.length === baseLen;
        }

        // Note this comparison should ignore the null label, i.e. baseLen - 1.
        for (let i = 0; i < baseLen - 1; i++) {
            if (this.labels[i] !== base.labelAt(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determines whether `base` is a suffix of this name.
     *
     * @param base The suffix name.
     * @param excludeSelf Whether or not to return false when the two names are same.
     * @returns
     */
    endsWith(base: FQDN, excludeSelf = false): boolean {
        const baseLen = base.labelLength();
        if (this.labels.length < baseLen || (excludeSelf && this.labels.length === baseLen)) {
            return false;
        }

        for (let i = 0; i < baseLen; i++) {
            if (this.labelAtReverse(i) !== base.labelAtReverse(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generates it's parent name.
     *
     * The root zone name does not have a parent, thus `null` is returned for it.
     *
     * @param labels
     * @returns
     *
     * @example
     * ```
     * const name = FQDN.parse("example.com");
     * const tld = name.parent()
     * tld.toString(); // com.
     * ```
     */
    parent(): FQDN | null {
        if (this.labels.length <= 1) {
            return null;
        }
        return new FQDN(this.labels.slice(1));
    }

    /**
     * Creates a child domain of current one.
     *
     * @param labels One or more labels to be prepended.
     * @returns A new FQDN represents the subdomain.
     *
     * @example
     * ```
     * const name = FQDN.parse("example.com");
     * const www = name.subdomain("www");
     * www.toString(); // www.example.com.
     * ```
     */
    subdomain(...labels: string[]): FQDN {
        return new FQDN(labels.concat(this.labels));
    }

    /**
     * Makes a (deep) copy this FQDN object.
     *
     * @returns
     */
    clone(): FQDN {
        return new FQDN(this.labels.slice());
    }

    /**
     * Returns the textual form of this fully-qualified domain name (no escaping).
     *
     * @returns
     */
    toString(): string {
        if (this.cached === undefined) {
            this.cached = this.labels.length <= 1 ? "." : this.labels.join(".");
        }
        return this.cached;
    }

    /**
     * Returns the RFC 1035 compliant textual form of this fully-qualified domain name.
     *
     * @returns
     */
    present(): string {
        if (this.labels.length <= 1) {
            return ".";
        }
        return this.labels.map((label) => new CharacterString(label).present(QuoteMode.Never)).join(".");
    }

    /**
     * Parses a textual domain name.
     *
     * @param name The name to be parsed.
     * @returns
     *
     * @throws ParseError
     */
    static parse(name: string): FQDN {
        if (name.length === 0 || name === ".") {
            return ROOT_ZONE;
        }

        const endsWithDot = name[name.length - 1] === ".";
        if (name.length > 255 - (endsWithDot ? 0 : 1)) {
            throw new ParseError(`domain name must be 255 characters or less`);
        }

        return new FQDN(name.split("."));
    }
}

/**
 *
 */
class LabelIterator implements Iterator<string, string> {
    private labels: string[];
    private idx = 0;
    private done = false;

    constructor(labels: string[]) {
        this.labels = labels;
    }

    next(): IteratorResult<string> {
        if (this.done) {
            return { done: this.done, value: undefined };
        }

        if (this.idx === this.labels.length) {
            this.done = true;
            return {
                done: true,
                value: this.idx,
            };
        }

        const value = this.labels[this.idx];
        this.idx += 1;
        return {
            done: false,
            value,
        };
    }
}

/**
 * The root (`.`) zone name.
 */
export const ROOT_ZONE = new FQDN([NULL_LABEL]);

/**
 * The `arpa.` zone name.
 */
export const ARPA_ZONE = new FQDN(["arpa", NULL_LABEL]);

/**
 * The `in-addr.arpa.` zone name.
 */
export const IN_ADDR_ARPA_ZONE = new FQDN(["in-addr", "arpa", NULL_LABEL]);

/**
 * The `ip6.arpa.` zone name.
 */
export const IP6_ARPA_ZONE = new FQDN(["ip6", "arpa", NULL_LABEL]);

/**
 * The `example.com.` zone name.
 */
export const EXAMPLE_ZONE = new FQDN(["example", "com", NULL_LABEL]);

/**
 * The reserved (RFC-2606) `localhost.` domain name.
 */
export const LOCALHOST = new FQDN(["localhost", NULL_LABEL]);
