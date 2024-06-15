import { CharacterString } from "../char";
import { Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";
import { ParseError } from "../error";

/**
 * HINFO records are used to acquire general information about a host.
 *
 * The main use is for protocols such as FTP that can use special procedures when talking between
 * machines or operating systems of the same type.
 *
 * HINFO RDATA format:
 *
 * ```
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                      CPU                      /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * /                       OS                      /
 * +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
 * ```
 */
export class HINFO extends RR {
    /**
     * A <character-string> which specifies the CPU type.
     */
    cpu!: CharacterString;
    /**
     * A <character-string> which specifies the operating system type.
     */
    os!: CharacterString;

    unpackRdata(rdata: Slice): void {
        const s = rdata.readSlice(this.header.rdlength);
        this.cpu = CharacterString.unpack(s);
        this.os = CharacterString.unpack(s);
    }

    packRdata(buf: Writer): number {
        return this.cpu.pack(buf) + this.os.pack(buf);
    }

    parseRdata(rdata: CharacterString[]): void {
        switch (rdata.length) {
            case 0:
                throw new ParseError("missing RDATA");
            case 1:
                throw new ParseError("missing <OS> in RDATA");
        }

        this.cpu = rdata[0];
        this.os = rdata[1];
    }

    presentRdata(): string {
        return `${this.cpu.present()} ${this.os.present()}`;
    }
}
