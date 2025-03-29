import { CharReader, ByteReader } from "./buffer";
import { ParseError } from "./error";
import { FQDN } from "./fqdn";
import { CharacterString } from "./char";
import { Header } from "./rr";
import { Class, classFrom, RRType, rrtypeFrom, Uint32, Uint8 } from "./types";

/** '\t' */
const CHAR_CODE_TAB = 0x09;
/** '\n' */
const CHAR_CODE_LF = 0x0a;
/** ' ' */
const CHAR_CODE_WS = 0x20;
/** '"' */
const CHAR_CODE_QUOTE = 0x22;
/** '(' */
const CHAR_CODE_OPEN_PARENTHESIS = 0x28;
/** ')' */
const CHAR_CODE_CLOSE_PARENTHESIS = 0x29;
/** ';' */
const CHAR_CODE_SEMICOLON = 0x3b;
/** '\\' */
const CHAR_CODE_BACKSLASH = 0x5c;

export enum TokenType {
    Blank,
    String,
    Comment,
    OpenParen,
    CloseParen,
    Newline,
    EOF, // end-of-line
}

export class Token {
    type!: TokenType;
    value!: string;

    constructor(type: TokenType, value: string) {
        this.type = type;
        this.value = value;
    }

    toString(): string {
        switch (this.type) {
            case TokenType.Comment:
            case TokenType.String: {
                return `${TokenType[this.type]}(${this.value})`;
            }
            default: {
                return `${TokenType[this.type]}`;
            }
        }
    }
}

/**
 * DNS textual representation lexer.
 */
export class Lexer {
    // The source to read bytes from.
    private input!: ByteReader;
    // Current absolute position in the input.
    private position = 0;
    // Current line number in the input.
    private line = 1;
    // Current column number in the line.
    private col = 1;
    // Current char
    private charCode: Uint8 | null;
    // Is there an opening quote
    private openQuotePos = -1;

    /**
     * Create a new Lexer on the byte reader.
     *
     * @param input
     */
    constructor(input: ByteReader) {
        this.input = input;
        this.charCode = input.byteLength() === 0 ? null : input.readUint8(0);
    }

    /**
     * Create a new Lexer on the ASCII string.
     *
     * @param input
     */
    static from(input: string): Lexer {
        return new Lexer(CharReader.from(input));
    }

    /**
     * Moves cursor to next byte.
     */
    private advance() {
        this.position += 1;
        this.col += 1;

        // Crossing line, bump line number and reset colum number.
        if (this.charCode === CHAR_CODE_LF) {
            this.line += 1;
            this.col = 1;
        }

        this.charCode = this.position < this.input.byteLength() ? this.input.readUint8(this.position) : null;
    }

    /**
     * Checks if it is a whitespace character like ' ' or '\t'.
     */
    private isWhitespace(code: Uint8) {
        return code === 0x09 || code === 0x20;
    }

    /**
     * Skips whitespaces.
     */
    private skipWhitespace() {
        while (this.charCode !== null && this.isWhitespace(this.charCode)) {
            this.advance();
        }
    }

    /**
     * Checks if it is a ASCII character between '!' and '~'
     *
     * @param code
     * @returns
     */
    private isVisible(code: Uint8) {
        return code >= 0x21 && code <= 0x7e;
    }

    /**
     * Checks if it is a ASCII character between '0' and '9'
     *
     * @param code
     * @returns
     */
    private isDigit(code: Uint8) {
        return code >= 0x30 && code <= 0x39;
    }

    /**
     * Take a look what's next without advancing the cursor position.
     *
     * @returns
     */
    private peek(): Uint8 | null {
        const peekPos = this.position + 1;
        return peekPos < this.input.byteLength() ? this.input.readUint8(peekPos) : null;
    }

    /**
     * Gathers the DDD part of \DDD that represent an invisible character in ASCII table.
     *
     * @returns The char code in decimal number the three digits describes.
     */
    private parseDDD(): Uint8 | null {
        let codeStr = "";
        while (this.charCode !== null && this.isDigit(this.charCode) && codeStr.length < 3) {
            codeStr += String.fromCharCode(this.charCode);
            this.advance();
        }

        if (codeStr.length !== 3) {
            return null;
        }

        const code = parseInt(codeStr);
        if (code > 0xff) {
            // Encounter an invalid ASCII character.
            return null;
        }
        return code;
    }

    /**
     * Parses a character string.
     *
     * @returns
     */
    private parseString(): string {
        let str = "";
        let done = false;

        while (this.charCode !== null) {
            switch (this.charCode) {
                case CHAR_CODE_BACKSLASH: {
                    // Skip this backslash
                    this.advance();

                    const startCol = this.col;

                    // Digit don't need to be escaped unless it is the \DDD.
                    if (this.isDigit(this.charCode)) {
                        const ddd = this.parseDDD();
                        if (ddd === null) {
                            throw new ParseError(`bad \\DDD escape encountered at ln ${this.line}, col ${startCol}`);
                        }
                        str += String.fromCharCode(ddd);
                        continue;
                    }

                    if (!this.isVisible(this.charCode)) {
                        throw new ParseError(`bad \\X escape encountered at ln ${this.line}, col ${startCol}`);
                    }

                    str += String.fromCharCode(this.charCode);
                    break;
                }
                case CHAR_CODE_QUOTE: {
                    // A pair of opening and closing quote are found, reach the end of the quoted string.
                    if (this.openQuotePos >= 0) {
                        const nextChar = this.peek();
                        // A proper closing quote should be followed by whitespace, ';', or end-of-line.
                        if (
                            nextChar === null ||
                            [
                                CHAR_CODE_WS,
                                CHAR_CODE_TAB,
                                CHAR_CODE_LF,
                                CHAR_CODE_SEMICOLON,
                                CHAR_CODE_OPEN_PARENTHESIS,
                                CHAR_CODE_CLOSE_PARENTHESIS,
                            ].includes(nextChar)
                        ) {
                            done = true;
                            this.openQuotePos = -1;
                            this.advance();
                            break;
                        }
                    }

                    // Encounter a string like 'a"b' where the quote is unescaped.
                    throw new ParseError(`unescaped '"' encountered at ln ${this.line}, col ${this.col}`);
                }
                case CHAR_CODE_WS:
                case CHAR_CODE_TAB:
                case CHAR_CODE_LF:
                case CHAR_CODE_SEMICOLON:
                case CHAR_CODE_OPEN_PARENTHESIS:
                case CHAR_CODE_CLOSE_PARENTHESIS: {
                    // Reach the end of an unquoted string.
                    if (this.openQuotePos < 0) {
                        done = true;
                        break;
                    }

                    // Or just a regular whitespace in a quoted string.
                    str += String.fromCharCode(this.charCode);
                    break;
                }
                default: {
                    // All other invisible character, should have been encoded as \DDD.
                    if (!this.isVisible(this.charCode)) {
                        throw new ParseError(
                            `invalid character code: ${this.charCode.toString(16)} encountered at ln ${this.line
                            }, col ${this.col}`
                        );
                    }

                    str += String.fromCharCode(this.charCode);
                    break;
                }
            }

            if (done) {
                break;
            }

            this.advance();
        }

        if (this.openQuotePos >= 0) {
            throw new ParseError(`missing closing quote for the opening quote at col ${this.openQuotePos}`);
        }

        return str;
    }

    /**
     * Parses a comment string.
     * Comments won't cross line and should not have invisible characters.
     */
    private parseComment(): string {
        // Ignore consecutive ';' or blank at the beginning.
        while (this.charCode !== null && (this.charCode === CHAR_CODE_SEMICOLON || this.isWhitespace(this.charCode))) {
            this.advance();
        }

        let str = "";
        while (this.charCode !== null && this.charCode !== CHAR_CODE_LF) {
            if (!this.isVisible(this.charCode) && !this.isWhitespace(this.charCode)) {
                throw new ParseError(
                    `invalid character: ${this.charCode.toString(16)} encountered in comment at ln ${this.line}, col ${this.col
                    }`
                );
            }
            str += String.fromCharCode(this.charCode);
            this.advance();
        }
        return str.trimEnd();
    }

    /**
     * Gets the next token.
     *
     * @returns Token
     *
     * @throws ParseError
     */
    next(): Token {
        while (this.charCode !== null) {
            if (this.isWhitespace(this.charCode)) {
                this.skipWhitespace();
                return new Token(TokenType.Blank, "");
            }

            if (this.charCode === CHAR_CODE_OPEN_PARENTHESIS) {
                this.advance();
                return new Token(TokenType.OpenParen, "(");
            }

            if (this.charCode === CHAR_CODE_CLOSE_PARENTHESIS) {
                this.advance();
                return new Token(TokenType.CloseParen, ")");
            }

            if (this.charCode === CHAR_CODE_SEMICOLON) {
                this.advance();
                return new Token(TokenType.Comment, this.parseComment());
            }

            // Found the begin of an unquoted string starting with '\'.
            if (this.charCode === CHAR_CODE_BACKSLASH) {
                return new Token(TokenType.String, this.parseString());
            }

            // Found the begin of a quoted string.
            if (this.charCode === CHAR_CODE_QUOTE) {
                this.openQuotePos = this.position;
                this.advance();
                return new Token(TokenType.String, this.parseString());
            }

            // Reach the end of line.
            if (this.charCode === CHAR_CODE_LF) {
                this.advance();
                return new Token(TokenType.Newline, "");
            }

            // Found the begin of an unquoted string starting with regular visible char.
            if (this.isVisible(this.charCode)) {
                return new Token(TokenType.String, this.parseString());
            }

            throw new ParseError(
                `invalid character code: ${this.charCode.toString(16)} encountered at ln ${this.line}, col ${this.col}`
            );
        }

        // Reach the end of file.
        return new Token(TokenType.EOF, "");
    }
}

/**
 * Scans RR header textual representation into a header object.
 *
 * In zonefile, a resource record entry take one of the following forms:
 * - <domain-name><rr> [<comment>]
 * - <blank><rr> [<comment>]
 *
 * The <rr> contents take one of the following forms:
 * - [<TTL>] [<class>] <type> <RDATA>
 * - [<class>] [<TTL>] <type> <RDATA>
 *
 * Omitted class and TTL values are default to the last explicitly stated values.
 *
 * @param l The lexer
 * @returns
 */
export function scanHeader(
    l: Lexer,
    startedOwner: FQDN | null = null,
    startedClass: Class | null = null,
    startedTTL: Uint32 | null = null
): Header {
    let owner: FQDN | null = null;
    let rrtype: RRType | null = null;
    let ttl: Uint32 | null = null;
    let cls: Class | null = null;
    let token: Token;

    while ((token = l.next()).type !== TokenType.EOF) {
        if (token.type === TokenType.Blank) {
            // Case: <blank><rr> [<comment>]
            if (owner === null && startedOwner !== null) {
                owner = startedOwner;
            }
            continue;
        }

        if (token.type !== TokenType.String) {
            throw new ParseError(`invalid token ${token} in header`);
        }

        const str = token.value;
        if (owner === null) {
            owner = FQDN.parse(str);
            continue;
        }

        if (cls === null) {
            // See if it is the optional <class> field.
            if ((cls = classFrom(token.value)) !== null) {
                continue;
            }
        }

        if (ttl === null) {
            const n = parseInt(token.value);
            // See if it is the optional <TTL> field.
            if (!Number.isNaN(n) && n <= 0xffffffff) {
                ttl = n;
                continue;
            }
        }

        rrtype = rrtypeFrom(token.value);
        if (rrtype === null) {
            throw new ParseError(`invalid resource record type: ${token.value}`);
        }

        break;
    }

    if (owner === null) {
        throw new ParseError(`missing resource record owner`);
    }

    if (rrtype === null) {
        throw new ParseError(`missing resource record type`);
    }

    cls = cls ?? startedClass;
    if (cls === null) {
        throw new ParseError(`missing resource record class`);
    }

    ttl = ttl ?? startedTTL;
    if (ttl === null) {
        throw new ParseError(`missing resource record TTL`);
    }

    return new Header(owner, rrtype, cls, ttl);
}

/**
 * Scans RDATA textual representation into a slice of character strings.
 *
 * @param l The lexer
 * @returns
 */
export function scanRdata(l: Lexer): CharacterString[] {
    const result = [];
    let token;
    let openParen = 0;
    let done = false;

    while ((token = l.next()).type !== TokenType.EOF) {
        switch (token.type) {
            case TokenType.OpenParen: {
                openParen += 1;
                break;
            }
            case TokenType.CloseParen: {
                if (openParen === 0) {
                    throw new ParseError("open parenthesis is missing");
                }

                openParen -= 1;
                break;
            }
            case TokenType.Newline: {
                // Reach the end of line and there is no parentheses being used to group data that
                // crosses a line boundary, done.
                if (openParen === 0) {
                    done = true;
                }
                break;
            }
            case TokenType.String: {
                result.push(new CharacterString(token.value));
                break;
            }
        }

        if (done) {
            break;
        }
    }

    if (openParen > 0) {
        throw new ParseError("close parenthesis is missing");
    }

    return result;
}
