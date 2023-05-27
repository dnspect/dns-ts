import { expect } from "chai";
import { Class, QTypeExtend, RRType, classFrom, rrtypeFrom, qtypeFrom, qclassFrom, QClassExtend, Opcode, opcodeFrom } from "./types";

describe("test Opcode", () => {
    it("should get value and name", () => {
        expect(Opcode.QUERY).to.be.equal(0);
        expect(Opcode[Opcode.QUERY]).to.be.equal('QUERY');
    });

    it("should get enum variant", () => {
        expect(0).to.be.equal(Opcode.QUERY);
        expect(5).to.be.equal(Opcode.UPDATE);
        expect(opcodeFrom('QUERY')).to.be.equal(Opcode.QUERY);
        expect(opcodeFrom('UPDATE')).to.be.equal(Opcode.UPDATE);
        expect(opcodeFrom('UNKNOWN')).to.be.null;
    });
});

describe("test Class", () => {
    it("should get value and name", () => {
        expect(Class.IN).to.be.equal(1);
        expect(Class.CS).to.be.equal(2);
        expect(Class.CH).to.be.equal(3);
        expect(Class.HS).to.be.equal(4);
        expect(Class[Class.IN]).to.be.equal('IN');
        expect(Class[Class.CS]).to.be.equal('CS');
        expect(Class[Class.CH]).to.be.equal('CH');
        expect(Class[Class.HS]).to.be.equal('HS');
    });

    it("should get enum variant", () => {
        expect(1).to.be.equal(Class.IN);
        expect(2).to.be.equal(Class.CS);
        expect(3).to.be.equal(Class.CH);
        expect(4).to.be.equal(Class.HS);
        expect(classFrom('IN')).to.be.equal(Class.IN);
        expect(classFrom('CS')).to.be.equal(Class.CS);
        expect(classFrom('CH')).to.be.equal(Class.CH);
        expect(classFrom('HS')).to.be.equal(Class.HS);
    });
});

describe("test QClass", () => {
    it("should get value and name", () => {
        expect(QClassExtend.ANY).to.be.equal(255);
        expect(QClassExtend[QClassExtend.ANY]).to.be.equal('ANY');
    });

    it("should get enum variant", () => {
        expect(255).to.be.equal(QClassExtend.ANY);
        expect(qclassFrom('IN')).to.be.equal(Class.IN);
        expect(qclassFrom('ANY')).to.be.equal(QClassExtend.ANY);
    });
});

describe("test RRType", () => {
    it("should get value name", () => {
        expect(RRType.A).to.be.equal(1);
        expect(RRType[RRType.A]).to.be.equal('A');
    });

    it("should get enum variant", () => {
        expect(rrtypeFrom('UNKNOWN')).to.be.null;

        for (const str in RRType) {
            if (/^\d+$/.test(str)) {
                continue;
            }

            const rrtype = rrtypeFrom(str);
            expect(rrtype, `${str} should be a RRType`).to.not.be.null;
        }
    });
});

describe("test QType", () => {
    it("should get value name", () => {
        expect(QTypeExtend.IXFR).to.be.equal(251);
        expect(QTypeExtend.AXFR).to.be.equal(252);
        expect(QTypeExtend.MAILB).to.be.equal(253);
        expect(QTypeExtend.MAILA).to.be.equal(254);
        expect(QTypeExtend.ANY).to.be.equal(255);
        expect(QTypeExtend[QTypeExtend.IXFR]).to.be.equal('IXFR');
        expect(QTypeExtend[QTypeExtend.AXFR]).to.be.equal('AXFR');
        expect(QTypeExtend[QTypeExtend.MAILB]).to.be.equal('MAILB');
        expect(QTypeExtend[QTypeExtend.MAILA]).to.be.equal('MAILA');
        expect(QTypeExtend[QTypeExtend.ANY]).to.be.equal('ANY');
    });

    it("should get enum variant", () => {
        expect(255).to.be.equal(QTypeExtend.ANY);
        expect(qtypeFrom('ANY')).to.be.equal(QTypeExtend.ANY);
        expect(qtypeFrom('UNKNOWN')).to.be.null;
    });
});
