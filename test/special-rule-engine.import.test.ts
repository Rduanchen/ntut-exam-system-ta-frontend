import { describe, expect, it } from "vitest";
import { evaluateRules } from "special-rule-engine";

describe("special-rule-engine import (TA frontend)", () => {
    it("can import and run a trivial rule", () => {
        const results = evaluateRules(
            [
                {
                    id: "r1",
                    type: "use",
                    constraint: "MUST_NOT_HAVE",
                    message: "must not include eval",
                    params: { target: "eval" },
                },
            ],
            { language: "javascript", sourceText: "const x = 1;" },
        );

        expect(results[0]?.passed).toBe(true);
    });
});
