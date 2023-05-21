/**
 * Represent errors occur on parsing DNS messages.
 */
export class ParseError extends Error {
    parseMessage?: string;

    constructor(message: string, parseMessage?: string) {
        super(message);

        this.name = "ParseError";

        if (parseMessage !== null) {
            this.parseMessage = parseMessage;
        }
    }
}

/**
 * Represent errors occur on validating semantic of DNS messages.
 */
export class SemanticError extends Error {
    parseMessage?: string;

    constructor(message: string, parseMessage?: string) {
        super(message);

        this.name = "SemanticError";

        if (parseMessage !== null) {
            this.parseMessage = parseMessage;
        }
    }
}
