import { expect } from "chai";
import { stringToBinary } from "../encoding";
import { ZONEMD } from "./zonemd";
import { Header } from "../rr";
import { Class, RRType } from "../types";

describe("test stringify", () => {
    const digest_str =
        "1768E0E953E2A28A94C38594090CA061E6E94E7F2B37DFB6354BAA5099126F8E5EA4989BAD06ED7C7B7951A87C1C33E8";

    const md = new ZONEMD(
        new Header("example.com", RRType.ZONEMD, Class.IN, 300)
    );
    md.serial = 2023100500;
    md.scheme = 1;
    md.algorithm = 241;
    md.digest = stringToBinary(digest_str, "hex");

    it("should generate dns-json object", () => {
        expect(JSON.stringify(md.toJsonObject())).to.be.equal(
            JSON.stringify({
                name: "example.com.",
                type: 63,
                TTL: 300,
                data: `2023100500 1 241 ${digest_str}`,
            })
        );
    });

    it("should generate dig-like text", () => {
        expect(md.toString()).to.be.equal(
            `example.com.\t\t300\tIN\tZONEMD\t2023100500 1 241 ${digest_str}`
        );
    });
});
