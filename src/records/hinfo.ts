import { CharacterString, Slice } from "../packet";
import { RR } from "../rr";
import { Writer } from "../buffer";

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

    toString(): string {
        return `${this.header}\t${this.cpu} ${this.os}`;
    }
}
