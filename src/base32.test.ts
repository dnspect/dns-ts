import { Decoder, Encoder, encode, decode, Base32Spec, encodeExtendedHex, decodeExtendedHex } from "./base32";
import { expect, use } from "chai";
import chaibytes from "chai-bytes";
import { stringToBinary } from "./encoding";

use(chaibytes);

// base32 string => ascii string
const stdTestData: { [base32: string]: string | Error } = {
    "": "",
    "=": new Error("malformed base32 string: wrong padding"),
    "========": new Error("malformed base32 string: wrong padding"),
    "AB==@===": new Error("malformed base32 string: wrong padding"),
    // RFC 4648 examples
    "MY======": "f",
    "MZXQ====": "fo",
    "MZXW6===": "foo",
    "MZXW6YQ=": "foob",
    "MZXW6YTB": "fooba",
    "MZXW6YTBOI======": "foobar",
    // Wikipedia examples
    "ON2XEZJO": "sure.",
    "ON2XEZI=": "sure",
    "ON2XE===": "sur",
    "ON2Q====": "su",
    "NRSWC43VOJSS4===": "leasure.",
    "MVQXG5LSMUXA====": "easure.",
    "MFZXK4TFFY======": "asure.",
};

// base32 string => ascii string
const extendedHexTestData: { [base32: string]: string | Error } = {
    "": "",
    "=": new Error("malformed base32 string: wrong padding"),
    "========": new Error("malformed base32 string: wrong padding"),
    "AB==@===": new Error("malformed base32 string: wrong padding"),
    // RFC 4648 examples
    "CO======": "f",
    "CPNG====": "fo",
    "CPNMU===": "foo",
    "CPNMUOG=": "foob",
    "CPNMUOJ1": "fooba",
    "CPNMUOJ1E8======": "foobar",
    // Wikipedia examples
    "EDQN4P9E": "sure.",
    "EDQN4P8=": "sure",
    "EDQN4===": "sur",
    "EDQG====": "su",
    "DHIM2SRLE9IIS===": "leasure.",
    "CLGN6TBICKN0====": "easure.",
    "C5PNASJ55O======": "asure.",
};

describe("test withPadding()", () => {
    const enc = new Encoder();
    const dec = new Decoder();

    it("should encoder error out", () => {
        expect(() => enc.withPadding("")).to.throw(Error, "padding should be a single character");
        expect(() => enc.withPadding("==")).to.throw(Error, "padding should be a single character");
        expect(() => enc.withPadding("A")).to.throw(Error, "padding contained in alphabet");
        expect(() => enc.withPadding("a")).to.throw(Error, "padding contained in alphabet");
        expect(() => enc.withPadding("7")).to.throw(Error, "padding contained in alphabet");
    });

    it("should decoder error out", () => {
        expect(() => dec.withPadding("")).to.throw(Error, "padding should be a single character");
        expect(() => dec.withPadding("==")).to.throw(Error, "padding should be a single character");
        expect(() => dec.withPadding("A")).to.throw(Error, "padding contained in alphabet");
        expect(() => dec.withPadding("a")).to.throw(Error, "padding contained in alphabet");
        expect(() => dec.withPadding("7")).to.throw(Error, "padding contained in alphabet");
    });

    it("should decoder set padding", () => {
        dec.withPadding("@");
        expect(dec.decode(stringToBinary("foobar", "ascii"))).to.equal("MZXW6YTBOI@@@@@@");
    });

    it("should encoder set padding", () => {
        enc.withPadding("@");
        expect(enc.encodeToBinary("MZXW6YTBOI@@@@@@")).to.equalBytes(stringToBinary("foobar", "ascii"));
    });
});

describe("test decode()", () => {
    it("should decode", () => {
        for (const base32 in stdTestData) {
            const hex = stdTestData[base32];
            if (hex instanceof Error) {
                continue;
            }
            expect(decode(stringToBinary(hex, "ascii"))).to.equal(base32);
        }
    });
});

describe("test encode()", () => {
    it("should encode", () => {
        for (const base32 in stdTestData) {
            const output = stdTestData[base32];
            if (output instanceof Error) {
                expect(() => encode(base32)).to.throw(Error, output.message);
            } else {
                expect(encode(base32)).to.equalBytes(stringToBinary(output, "ascii"));
            }
        }
    });
});

describe("test decodeExtendedHex()", () => {
    it("should decode", () => {
        for (const base32 in extendedHexTestData) {
            const hex = extendedHexTestData[base32];
            if (hex instanceof Error) {
                continue;
            }
            expect(decodeExtendedHex(stringToBinary(hex, "ascii"))).to.equal(base32);
        }
    });
});

describe("test encodeExtendedHex()", () => {
    it("should encode", () => {
        for (const base32 in extendedHexTestData) {
            const output = extendedHexTestData[base32];
            if (output instanceof Error) {
                expect(() => encode(base32)).to.throw(Error, output.message);
            } else {
                expect(encodeExtendedHex(base32)).to.equalBytes(stringToBinary(output, "ascii"));
            }
        }
    });
});

describe("test standard decoder", () => {
    const decoder = new Decoder();
    it("should decode()", () => {
        for (const base32 in stdTestData) {
            const hex = stdTestData[base32];
            if (hex instanceof Error) {
                continue;
            }
            expect(decoder.decode(stringToBinary(hex, "ascii"))).to.equal(base32);
        }
    });

    it("should update()", () => {
        for (const base32 in stdTestData) {
            const input = stdTestData[base32];
            if (input instanceof Error) {
                continue;
            }

            const bin = stringToBinary(input, "ascii");
            if (bin.length < 2) {
                continue;
            }

            decoder.update(bin.slice(0, 2));
            decoder.update(bin.slice(2));

            expect(decoder.finish()).to.equal(base32);
        }
    });
});

describe("test standard encoder", () => {
    const encoder = new Encoder();
    it("should encodeToBinary()", () => {
        for (const base32 in stdTestData) {
            const output = stdTestData[base32];
            if (output instanceof Error) {
                expect(() => encoder.encodeToBinary(base32)).to.throw(Error, output.message);
            } else {
                expect(encoder.encodeToBinary(base32)).to.equalBytes(stringToBinary(output, "ascii"));
            }
        }
    });
});

describe("test extended-hex decoder", () => {
    const decoder = new Decoder(Base32Spec.ExtendedHex);
    it("should decode()", () => {
        for (const base32 in extendedHexTestData) {
            const input = extendedHexTestData[base32];
            if (input instanceof Error) {
                continue;
            }
            expect(decoder.decode(stringToBinary(input, "ascii"))).to.equal(base32);
        }
    });
});

describe("test extended-hex encoder", () => {
    const encoder = new Encoder(Base32Spec.ExtendedHex);
    it("should encodeToBinary()", () => {
        for (const base32 in extendedHexTestData) {
            const output = extendedHexTestData[base32];
            if (output instanceof Error) {
                expect(() => encoder.encodeToBinary(base32)).to.throw(Error, output.message);
            } else {
                expect(encoder.encodeToBinary(base32)).to.equalBytes(stringToBinary(output, "ascii"));
            }
        }
    });
});
