import { expect } from "chai";
import { parseRecord, Serial } from ".";
import { RR } from "../rr";

describe("test SOA", () => {
    const input = `.\t\t86400\tIN\tSOA\ta.root-servers.net. nstld.verisign-grs.com. 2024061600 1800 900 604800 86400`;
    let soa: RR | undefined;

    it("should parse", () => {
        soa = parseRecord(input);
        expect(soa.header.name.isRoot()).to.be.true;
    });

    it("should present", () => {
        const out = soa?.present();
        expect(out).to.be.equals(input);
    });
});

describe("test Serial", () => {
    it("should parse", () => {
        expect(() => { Serial.parse(""); }).to.throw(`"" is not a number`);
        expect(() => { Serial.parse("-1"); }).to.throw(`serial number is out of range`);
        expect(() => { Serial.parse("0"); }).to.not.throw;
        expect(() => { Serial.parse(0xffffffff.toString()); }).to.not.throw;
        expect(() => { Serial.parse(0x100000000.toString()); }).to.throw(`serial number is out of range`);
    });

    it("should compare", () => {
        expect((new Serial(0)).cmp(new Serial(0))).to.be.equals(0);
        expect((new Serial(0)).cmp(new Serial(1))).to.be.equals(-1);
        expect((new Serial(1)).cmp(new Serial(0))).to.be.equals(1);
        expect((new Serial(0)).cmp(new Serial(0x8000_0001))).to.be.equals(1);
        expect((new Serial(2)).cmp(new Serial(0x8000_0001))).to.be.equals(-1);
        expect((new Serial(0)).cmp(new Serial(0x8000_0000))).to.be.undefined;
        expect((new Serial(1)).cmp(new Serial(0x8000_0001))).to.be.undefined;
    });

    it("should add", () => {
        const serial = new Serial(0);
        expect(serial.toUint32()).to.be.equals(0);

        serial.add(1);
        expect(serial.toUint32()).to.be.equals(1);

        serial.add(0x7fff_ffff);
        expect(serial.toUint32()).to.be.equals(0x8000_0000);


        expect(() => { serial.add(0x8000_0000); }).to.throw("other should not greater than 2^31 - 1");
    });
});
