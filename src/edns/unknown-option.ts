import { OptCode, Option } from "./option";
import { Writer } from "../buffer";
import { ParseError } from "../error";
import { binaryToString, stringToBinary } from "../encoding";

/**
 * Unknown Option.
 */
export class UnknownOption extends Option {
    data!: Uint8Array;

    /**
     * Creates a unkonwn option.
     *
     * @param code Option code
     * @param data Option data
     */
    constructor(code: OptCode, data: Uint8Array) {
        super(code);
        this.data = data;
    }

    packOptionData(buf: Writer): number {
        return buf.write(this.data);
    }

    /**
     * @returns
     */
    present(): string {
        return `; Unknown EDNS option code ${this.optCode} (length ${this.data.byteLength}) data: ${binaryToString(this.data, "hex")}`
    }

    /**
     * Parses Padding from a textual representation.
     *
     * @param input A regular comment string that has stripped out "PADDING: "
     *
     * @example
     * ```
     * ; EDNS0 Option Code: 65001, Length: 4, Data: 0x12345678
     * ; Unknown EDNS option code 65001 (length 4) data: 12345678
     * ;; Do not matter 65001 (length 4) (data 12345678)
     * ```
     *
     * Note that the prefix ";...[: ]+" should has been stripped from caller.
     */
    static parse(input: string): UnknownOption {
        const found = input.match(/(.+\s)?(\d+)[\s\(\),]+length[\s:]+(\d+)[\s\(\),]+data[\s:\(]+(0x)?([0-9a-f]+)[\)]?$/i);
        if (found === null) {
            throw new ParseError(`unrecognized unknown option text: "${input}"`);
        }

        const code = parseInt(found[2]);
        const len = parseInt(found[3])
        const hexString = found[5];
        if (hexString.length != len * 2) {
            throw new ParseError(`length ${len} does not match hex string "${hexString}"`);
        }

        return new UnknownOption(code, stringToBinary(hexString, "hex"));
    }
}
