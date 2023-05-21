import { Writer } from "../buffer";
import { CharactorString, Slice } from "../packet";
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
    content!: CharactorString[];

    unpackRdata(rdata: Slice): void {
        this.content = new Array<CharactorString>();
        while (rdata.remaining() > 0) {
            this.content.push(CharactorString.unpack(rdata));
        }
    }

    packRdata(buf: Writer): number {
        let n = 0;
        for (const cs of this.content) {
            n += cs.pack(buf);
        }
        return n;
    }

    toString(): string {
        return `${this.header}\t${this.content.map((cs) => `"${cs}"`).join(" ")}`;
    }
}
