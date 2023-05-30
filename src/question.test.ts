import { expect } from "chai";
import { Question } from "./question";
import { FQDN } from "./fqdn";
import { Class, RRType } from "./types";

describe("test stringify", () => {
    const q = new Question(FQDN.parse('example.com'), RRType.AAAA, Class.IN);

    it("should get dig-like text", () => {
        expect(q.toString()).to.be.equal(';example.com.\t\tIN\tAAAA');
    });

    it("should get dns-json object", () => {
        expect(JSON.stringify(q.toJsonObject())).to.be.equal(JSON.stringify({ "name": "example.com.", "type": 28 }));
    });
});
