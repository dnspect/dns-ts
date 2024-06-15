import { Writer } from "../buffer";
import { CharacterString, QuoteMode } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";

/**
 * TXT RRs are used to hold descriptive text.
 * The semantics of the text depends on the domain where it is found.
 *
 * TXT RDATA format:
 *
 * ```
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 *  /                   TXT-DATA                    /
 *  +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class TXT extends RR {
    /**
     * One or more <character-string>s.
     */
    content!: CharacterString[];

    unpackRdata(rdata: Slice): void {
        this.content = new Array<CharacterString>();
        while (rdata.remaining() > 0) {
            this.content.push(CharacterString.unpack(rdata));
        }
    }

    packRdata(buf: Writer): number {
        let n = 0;
        for (const cs of this.content) {
            n += cs.pack(buf);
        }
        return n;
    }

    parseRdata(rdata: CharacterString[]): void {
        this.content = rdata;
    }

    /**
     * @override
     */
    presentRdata(): string {
        return `${this.content.map((cs) => cs.present(QuoteMode.Always)).join(" ")}`;
    }
}
