import { expect } from "chai";
import { Question } from "./question";
import { FQDN } from "./fqdn";
import { Class, RRType } from "./types";

describe("test stringify", () => {
    const q = new Question(FQDN.parse('example.com'), RRType.A, Class.IN);

    it("should get dig-like", () => {
        expect(q.toString()).to.be.equal(';example.com.\t\tIN\tA');
    });

    it("should get dns-json", () => {
        expect(q.toJSON()).to.be.equal('{"name": "example.com.", "type": 1}');
    });
});
