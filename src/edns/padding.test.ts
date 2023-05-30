import { expect } from "chai";
import { Padding } from "./padding";

describe("test construction", () => {
    it("should create padding from requested size", () => {
        expect(Padding.fromSize(0).toString()).to.equal(`; PADDING: 0`);
        expect(Padding.fromSize(10).toString()).to.equal(`; PADDING: 10`);
    });
});
