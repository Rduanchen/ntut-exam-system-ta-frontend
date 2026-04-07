import { describe, expect, it } from "vitest";
import { evaluateRules } from "special-rule-engine";

import type { SpecialRule } from "../src/specialRules/types";

/**
 * This test is a guardrail to ensure TA-side configs stay compatible with the
 * `special-rule-engine` composite schema:
 *
 *   composite.params = { op: 'AND'|'OR', rules: SpecialRule[] }
 *
 * and that nested composites are supported via recursive `rules`.
 */
describe("special rules: engine schema compatibility (TA frontend)", () => {
    it("accepts nested composite params in { op, rules } shape and evaluates correctly", () => {
        const rule: SpecialRule = {
            id: "r-nested",
            type: "composite",
            constraint: "MUST_HAVE",
            message: "",
            params: {
                op: "AND",
                rules: [
                    {
                        id: "outer-a",
                        type: "use",
                        constraint: "MUST_HAVE",
                        message: "",
                        params: { target: "aaa" },
                    },
                    {
                        id: "outer-or",
                        type: "composite",
                        constraint: "MUST_HAVE",
                        message: "",
                        params: {
                            op: "OR",
                            rules: [
                                {
                                    id: "b",
                                    type: "use",
                                    constraint: "MUST_HAVE",
                                    message: "",
                                    params: { target: "bbb" },
                                },
                                {
                                    id: "c",
                                    type: "use",
                                    constraint: "MUST_HAVE",
                                    message: "",
                                    params: { target: "ccc" },
                                },
                            ],
                        },
                    },
                ],
            },
        };

        // Basic structural assertions: engine contract
        expect(rule.params).toHaveProperty("op");
        expect(rule.params).toHaveProperty("rules");
        expect((rule.params as any).children).toBeUndefined();
        expect(((rule.params as any).rules[1].params as any).children).toBeUndefined();

        const [pass] = evaluateRules([rule], {
            language: "javascript",
            sourceText: "const s = 'aaa ccc';",
        });
        expect(pass?.passed).toBe(true);

        const [fail] = evaluateRules([rule], {
            language: "javascript",
            sourceText: "const s = 'aaa ddd';",
        });
        expect(fail?.passed).toBe(false);

        // Safety check: if we ever regress to `children`, engine should reject it.
        const broken: SpecialRule = {
            ...rule,
            params: {
                op: "AND",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                children: [],
            } as any,
        };

        const [brokenResult] = evaluateRules([broken], {
            language: "javascript",
            sourceText: "const s = 'aaa ccc';",
        });

        expect(brokenResult?.passed).toBe(false);
        expect(brokenResult?.reason ?? "").toMatch(/params must be/i);
    });
});
