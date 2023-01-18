"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const time_1 = require("../utils/time");
vitest_1.it("milliseconds to minutes", () => {
    const minutes = time_1.msToMin(60000);
    vitest_1.assert.equal(minutes, 1);
});
vitest_1.it("minutes to milliseconds", () => {
    const ms = time_1.minToMs(1);
    vitest_1.assert.equal(ms, 60000);
});
vitest_1.it("milliseconds to seconds", () => {
    const seconds = time_1.msToSec(60000);
    vitest_1.assert.equal(seconds, 60);
});
vitest_1.it("seconds to milliseconds", () => {
    const ms = time_1.secToMs(60);
    vitest_1.assert.equal(ms, 60000);
});
//# sourceMappingURL=time.test.js.map