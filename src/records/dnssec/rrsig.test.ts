import { expect } from "chai";
import { parseRecord } from "../";
import { RR } from "../../rr";
import { RRType } from "../../types";

describe("test RRSIG", () => {
    const input = `com.\t\t86400\tIN\tRRSIG\tNSEC 8 1 86400 20240629050000 20240616040000 5613 . Za3HLQyVZ8h3V3SN6T/mYRPXjXLNWH8jvt7e+RZ3linDJaquKIXPs0Y6HiBRLMWbwoKWl6z2UmE9Uf6ab2Yajo8P23ugFi08APeL6NAsNMC2GgVjFYdbdxdKwmcG2vOjEP6jICeMYiYOhhHk2jqoqfj19P9bPzvj6UmAYA0acuw4l9jVJBqZkhnMGmjUtvw3u8KeCdf6CW4dTIKEAzM9SEC1rjLPAPADBGlszhK8ZbIir3o4vPsEYtBC71ch70CYRtzmWR86+eYyyefAPwsFiBCUyqkOHxWYtGLF2UxjD+KzgIdI62i9K92qHgWuGldoHn8hXv1Ok8YaezvH3s17WQ==`;
    let nsec: RR | undefined;

    it("should parse", () => {
        nsec = parseRecord(input);
        expect(nsec.header.type).to.be.equals(RRType.RRSIG);
    });

    it("should present", () => {
        const out = nsec?.present();
        expect(out).to.be.equals(input);
    });
});
