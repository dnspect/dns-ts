import { Writer } from "../buffer";
import { CharacterString } from "../char";
import { binaryToString } from "../encoding";
import { ParseError } from "../error";
import { Slice } from "../packet";
import { RR } from "../rr";

/**
 * An "RR of unknown type" is an RR whose RDATA format is not known to the DNS
 * implementation at hand, and whose type is not an assigned QTYPE or Meta-TYPE
 * as specified in [RFC 2929] (section 3.1) nor within the range rserved in that
 * section for assignment only to QTYPEs and Meta-TYEs. Such an RR cannot be
 * converted to a type- specific text formt, compressed, or otherwise handled in
 * a type-specific way. In te case of a tpe whose RDATA format is class specific,
 * an RR is considered to be o unknown type when the RDATA format for that combination
 * of typ and class is not known.
 *
 * RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                     RDATA                     /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class Unknown extends RR {
    /**
     * One or more <character-string>s.
     */
    data!: Uint8Array;

    unpackRdata(rdata: Slice): void {
        this.data = rdata.readUint8Array();
    }

    packRdata(buf: Writer): number {
        return buf.write(this.data);
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError(`missing RDATA`);
            case 1:
                throw new ParseError(`missing <length> in RDATA`);
        }

        const data = Unknown.tryParseUnknownRdata(rdata);
        if (data === null) {
            throw new ParseError(`invalid RDATA text representation`);
        }

        this.data = data;
    }

    /**
     * The RDATA section of an RR of unknown type is represented as a sequence
     * of white space separated words as follows:
     *
     * The special token \# (a backslash immediately followed by a hash sign),
     * which identifies the RDATA as having the generic encoding defined herein
     * rather than a traditional type-specific encoding.
     *
     * An unsigned decimal integer specifying the RDATA length in octets.
     *
     * Zero or more words of hexadecimal data encoding the actual RDATA field,
     * each containing an even number of hexadecimal digits.
     *
     * If the RDATA is of zero length, the text representation contains only the
     * \# token and the single zero representing the length.
     */
    presentRdata(): string {
        if (this.data.length === 0) {
            return "\\# 0";
        }

        const text = binaryToString(this.data, "hex");
        return `\\# ${this.data.length} ${text}`;
    }

    /**
     * Try parses RDATA text if it is in the Unkonwn RR's text representation and
     * returns it. Returns null otherwise.
     *
     * @param rdata RDATA textual chunks.
     * @returns
     *
     * @throws ParseError
     */
    static tryParseUnknownRdata(rdata: CharacterString[]): Uint8Array | null {
        if (rdata.length < 2) {
            return null;
        }

        // "\#" chunk in RDATA is scaned into a "#".
        if (rdata[0].raw() !== "#") {
            return null;
        }

        const len =
            rdata[1].toUint16() ??
            (() => {
                throw new ParseError("invalid <length> in RDATA");
            })();

        if (len === 0) {
            return new Uint8Array(0);
        }

        const data = new Uint8Array(len);
        let offset = 0;
        for (let i = 2; i < rdata.length; i++) {
            const chunk = rdata[i].toBinary("hex");
            if (offset + chunk.length > len) {
                throw new ParseError(`invalid hex in RDATA, exceeds the specified length ${len}`);
            }
            data.set(chunk, offset);
            offset += chunk.length;
        }

        if (data.length !== len) {
            throw new ParseError("invalid hex string in RDATA, too short");
        }

        return data;
    }
}
