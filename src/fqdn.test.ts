import { expect } from "chai";
import {
    ARPA_ZONE,
    EXAMPLE_ZONE,
    FQDN,
    IN_ADDR_ARPA_ZONE,
    IP6_ARPA_ZONE,
    ROOT_ZONE,
} from "./fqdn";
import { ParseError } from "./error";

describe("test FQDN()", () => {
    it("should construct", () => {
        expect(new FQDN([]).toString()).to.equal(".");
        expect(new FQDN([""]).toString()).to.equal(".");
        expect(new FQDN(["com"]).toString()).to.equal("com.");
        expect(new FQDN(["com", ""]).toString()).to.equal("com.");
        expect(new FQDN(["example", "com"]).toString()).to.equal(
            "example.com."
        );
        expect(new FQDN(["example", "com", ""]).toString()).to.equal(
            "example.com."
        );
    });

    it("should parse", () => {
        expect(FQDN.parse("").toString()).to.equal(".");
        expect(FQDN.parse(".").toString()).to.equal(".");
        expect(FQDN.parse("com").toString()).to.equal("com.");
        expect(FQDN.parse("com.").toString()).to.equal("com.");
        expect(FQDN.parse("example.com").toString()).to.equal("example.com.");
        expect(FQDN.parse("example.com.").toString()).to.equal("example.com.");
    });

    it("should not parse", () => {
        expect(() => FQDN.parse("\\.")).to.throw(ParseError, `label must not contain backslash`);
        expect(() => FQDN.parse("\n.1.")).to.throw(ParseError, `top-level domain label "1" should not be numeric`);
        expect(() => FQDN.parse("a".repeat(64))).to.throw(ParseError, "label must be 63 characters or less");
        expect(() => FQDN.parse("a".repeat(256))).to.throw(ParseError, "domain name must be 255 characters or less");
    });

    it("should iter", () => {
        const name = FQDN.parse("www.example.com.");
        const labels: string[] = [];
        for (const label of name) {
            labels.push(label);
        }
        expect(labels).to.have.ordered.members(["www", "example", "com", ""]);
    });

    it("should get label length", () => {
        expect(FQDN.parse("").labelLength()).to.equal(1);
        expect(FQDN.parse(".").labelLength()).to.equal(1);
        expect(FQDN.parse("com").labelLength()).to.equal(2);
        expect(FQDN.parse("com.").labelLength()).to.equal(2);
        expect(FQDN.parse("example.com").labelLength()).to.equal(3);
        expect(FQDN.parse("example.com.").labelLength()).to.equal(3);
    });

    it("should get label at", () => {
        const name = FQDN.parse("www.example.com.");
        expect(name.labelAt(0)).to.equal("www");
        expect(name.labelAt(1)).to.equal("example");
        expect(name.labelAt(2)).to.equal("com");
        expect(name.labelAt(3)).to.equal("");
        expect(name.labelAt(4)).to.null;
    });

    it("should get label at reverse", () => {
        const name = FQDN.parse("www.example.com.");
        expect(name.labelAtReverse(0)).to.equal("");
        expect(name.labelAtReverse(1)).to.equal("com");
        expect(name.labelAtReverse(2)).to.equal("example");
        expect(name.labelAtReverse(3)).to.equal("www");
        expect(name.labelAtReverse(4)).to.null;
    });

    it("should get first label", () => {
        expect(ROOT_ZONE.first()).to.equal("");
        expect(ARPA_ZONE.first()).to.equal("arpa");
        expect(IN_ADDR_ARPA_ZONE.first()).to.equal("in-addr");
        expect(IP6_ARPA_ZONE.first()).to.equal("ip6");
    });

    it("should get penultimate label", () => {
        expect(ROOT_ZONE.penultimate()).to.null;
        expect(ARPA_ZONE.penultimate()).to.equal("arpa");
        expect(IN_ADDR_ARPA_ZONE.penultimate()).to.equal("arpa");
        expect(IP6_ARPA_ZONE.penultimate()).to.equal("arpa");
    });

    it("should equal", () => {
        expect(FQDN.parse(".").equal(ROOT_ZONE)).to.true;
        expect(FQDN.parse("arpa.").equal(ARPA_ZONE)).to.true;
        expect(FQDN.parse("in-addr.arpa.").equal(IN_ADDR_ARPA_ZONE)).to.true;
        expect(FQDN.parse("ip6.arpa.").equal(IP6_ARPA_ZONE)).to.true;
        expect(FQDN.parse("example.com.").equal(EXAMPLE_ZONE)).to.true;
    });

    it("should not equal", () => {
        expect(ARPA_ZONE.equal(ROOT_ZONE)).to.false;
        expect(IN_ADDR_ARPA_ZONE.equal(IP6_ARPA_ZONE)).to.false;
        expect(IP6_ARPA_ZONE.equal(IN_ADDR_ARPA_ZONE)).to.false;
    });

    it("should startsWith", () => {
        expect(ROOT_ZONE.startWith(ROOT_ZONE)).to.true;
        expect(ARPA_ZONE.startWith(ARPA_ZONE)).to.true;
        expect(IN_ADDR_ARPA_ZONE.startWith(IN_ADDR_ARPA_ZONE)).to.true;
        expect(IN_ADDR_ARPA_ZONE.startWith(FQDN.parse("in-addr."))).to.true;
        expect(IP6_ARPA_ZONE.startWith(IP6_ARPA_ZONE)).to.true;
        expect(IP6_ARPA_ZONE.startWith(FQDN.parse("ip6."))).to.true;
    });

    it("should not startsWith", () => {
        expect(ROOT_ZONE.startWith(ROOT_ZONE, true)).to.false;
        expect(ROOT_ZONE.startWith(ARPA_ZONE)).to.false;
        expect(ARPA_ZONE.startWith(ROOT_ZONE)).to.false;
        expect(ARPA_ZONE.startWith(ARPA_ZONE, true)).to.false;
        expect(IN_ADDR_ARPA_ZONE.startWith(ARPA_ZONE)).to.false;
        expect(IP6_ARPA_ZONE.startWith(ARPA_ZONE)).to.false;
    });

    it("should endsWith", () => {
        expect(ROOT_ZONE.endsWith(ROOT_ZONE)).to.true;
        expect(ARPA_ZONE.endsWith(ARPA_ZONE)).to.true;
        expect(IN_ADDR_ARPA_ZONE.endsWith(IN_ADDR_ARPA_ZONE)).to.true;
        expect(IN_ADDR_ARPA_ZONE.endsWith(ARPA_ZONE)).to.true;
        expect(IN_ADDR_ARPA_ZONE.endsWith(ROOT_ZONE)).to.true;
        expect(IP6_ARPA_ZONE.endsWith(IP6_ARPA_ZONE)).to.true;
        expect(IP6_ARPA_ZONE.endsWith(ARPA_ZONE)).to.true;
        expect(IP6_ARPA_ZONE.endsWith(ROOT_ZONE)).to.true;
    });

    it("should not endsWith", () => {
        expect(ROOT_ZONE.endsWith(ROOT_ZONE, true)).to.false;
        expect(ROOT_ZONE.endsWith(ARPA_ZONE)).to.false;
        expect(ARPA_ZONE.endsWith(ARPA_ZONE, true)).to.false;
        expect(ARPA_ZONE.endsWith(FQDN.parse("com."))).to.false;
        expect(IN_ADDR_ARPA_ZONE.endsWith(FQDN.parse("in-addr."))).to.false;
        expect(IP6_ARPA_ZONE.endsWith(FQDN.parse("ip6."))).to.false;
    });

    it("should get parent", () => {
        expect(IN_ADDR_ARPA_ZONE.parent()?.equal(ARPA_ZONE)).to.true;
        expect(ARPA_ZONE.parent()?.equal(ROOT_ZONE)).to.true;
        expect(ROOT_ZONE.parent()).to.null;
    });

    it("should create subdomain", () => {
        expect(ROOT_ZONE.subdomain("arpa").equal(ARPA_ZONE)).to.true;
        expect(ROOT_ZONE.subdomain("in-addr", "arpa").equal(IN_ADDR_ARPA_ZONE))
            .to.true;
        expect(ARPA_ZONE.subdomain("in-addr").equal(IN_ADDR_ARPA_ZONE)).to.true;
        expect(
            EXAMPLE_ZONE.subdomain("www").equal(FQDN.parse("www.example.com"))
        ).to.true;
    });

    it("should present", () => {
        expect(FQDN.parse("").present()).to.be.equal(".");
        expect(FQDN.parse(".").present()).to.be.equal(".");
        expect(FQDN.parse(`a-b\t\nk@#( )".test.`).present()).to.be.equal(String.raw`a-b\009\010k\@#\(\032\)\".test.`);
    });
});
