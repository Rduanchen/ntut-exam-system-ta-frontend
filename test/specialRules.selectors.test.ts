import { describe, expect, it } from "vitest";
import {
    buildRuleStatusList,
    getEffectiveRules,
    indexRuleResultsById,
} from "../src/specialRules/selectors";

describe("specialRules/selectors", () => {
    it("getEffectiveRules merges global then puzzle rules", () => {
        const config: any = {
            globalSpecialRules: [{ id: "g1" }, { id: "g2" }],
            puzzles: [{ specialRules: [{ id: "p0" }] }, { specialRules: [{ id: "p1" }] }],
        };

        expect(getEffectiveRules(config, 1).map((r) => r.id)).toEqual(["g1", "g2", "p1"]);
    });

    it("indexRuleResultsById indexes by ruleId (last wins)", () => {
        const indexed = indexRuleResultsById([
            { ruleId: "a", passed: true, message: "", checkedAt: "t1" },
            { ruleId: "a", passed: false, message: "", checkedAt: "t2", reason: "x" },
        ]);

        expect(indexed.a.passed).toBe(false);
        expect(indexed.a.checkedAt).toBe("t2");
        expect(indexed.a.reason).toBe("x");
    });

    it("buildRuleStatusList returns PASS/FAIL/NOT_EVALUATED", () => {
        const effectiveRules: any[] = [{ id: "r1" }, { id: "r2" }, { id: "r3" }];
        const resultsById = indexRuleResultsById([
            { ruleId: "r1", passed: true, message: "m1", checkedAt: "t1" },
            { ruleId: "r2", passed: false, message: "m2", checkedAt: "t2", reason: "bad" },
        ]);

        const list = buildRuleStatusList({ effectiveRules: effectiveRules as any, resultsById });

        expect(list.map((x) => x.status)).toEqual(["PASS", "FAIL", "NOT_EVALUATED"]);
        expect(list[1].reason).toBe("bad");
        expect(list[0].checkedAt).toBe("t1");
    });
});
