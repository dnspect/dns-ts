import { expect } from "chai";
import { Compressor } from "./compression";
import { NameWriter } from "./buffer";
import { Uint8, Uint16 } from "./types";
import { stringToBinary } from "./encoding";
import { IN_ADDR_ARPA_ZONE, IP6_ARPA_ZONE, ROOT_ZONE } from "./fqdn";

class MockNameWriter implements NameWriter {
    private buffer!: Uint8Array;
    private offset: Uint16 = 0;

    constructor(cap: Uint16) {
        this.buffer = new Uint8Array(cap);
    }

    writeUint8(n: Uint8): number {
        if (this.offset + 1 > this.buffer.byteLength) {
            throw new RangeError("too big");
        }

        this.buffer[this.offset] = n;
        this.offset += 1;
        return 1;
    }

    writeUint16(n: Uint16): number {
        if (this.offset + 2 > this.buffer.byteLength) {
            throw new RangeError("too big");
        }

        this.buffer[this.offset] = n >>> 8;
        this.buffer[this.offset + 1] = n & 0xff;
        this.offset += 2;
        return 2;
    }

    writeLabel(label: string): number {
        if (label.length === 0) {
            return this.writeUint8(label.length);
        }

        const data = stringToBinary(label, "ascii");
        const n = 1 + data.length;

        if (this.offset + n > this.buffer.byteLength) {
            throw new RangeError("too big");
        }

        this.buffer[this.offset] = data.length;
        this.buffer.set(data, this.offset + 1);
        this.offset += n;
        return n;
    }
}

describe("test Compressor()", () => {
    it("should construct", () => {
        expect(new Compressor(new MockNameWriter(1024))).to.not.throw;
    });
});

describe("test writeName()", () => {
    it("should write root", () => {
        const compressor = new Compressor(new MockNameWriter(2));
        expect(compressor.writeName(ROOT_ZONE, 0)).to.equals(1);
        expect(
            compressor.writeName(ROOT_ZONE, 0),
            "should not use any cache"
        ).to.equals(1);
        expect(() => compressor.writeName(ROOT_ZONE, 0)).to.throw(
            RangeError,
            "too big"
        );
    });

    it("should compress arpa.", () => {
        const compressor = new Compressor(new MockNameWriter(1024));
        expect(compressor.writeName(IN_ADDR_ARPA_ZONE, 0)).to.equals(14);
        expect(compressor.writeName(IP6_ARPA_ZONE, 14)).to.equals(6);
        expect(compressor.writeName(IP6_ARPA_ZONE, 20)).to.equals(2);
    });
});
