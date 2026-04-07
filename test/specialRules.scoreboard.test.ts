import { describe, expect, it } from "vitest";
import { getSpecialRulesBinaryForPuzzle } from "../src/specialRules/scoreboard";

// Keep these tests minimal and data-shape focused.
// ScoreTable uses `puzzleId` as a stringified puzzle index (e.g. "0", "1").

describe("specialRules/scoreboard", () => {
    it("returns 1 when no effective rules are configured", () => {
        const examConfig: any = {
            globalSpecialRules: [],
            puzzles: [{ specialRules: [] }],
        };

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "0",
                specialRuleResults: undefined,
            }),
        ).toBe(1);
    });

    it("returns 0 when rules exist but results are missing/empty (not evaluated)", () => {
        const examConfig: any = {
            globalSpecialRules: [{ id: "g1" }],
            puzzles: [{ specialRules: [] }],
        };

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "0",
                specialRuleResults: undefined,
            }),
        ).toBe(0);

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "0",
                specialRuleResults: [],
            }),
        ).toBe(0);
    });

    it("returns 1 only if all rule results passed", () => {
        const examConfig: any = {
            globalSpecialRules: [{ id: "g1" }],
            puzzles: [{ specialRules: [] }],
        };

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "0",
                specialRuleResults: [
                    { ruleId: "g1", passed: true, message: "", checkedAt: "t" },
                ],
            }),
        ).toBe(1);

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "0",
                specialRuleResults: [
                    { ruleId: "g1", passed: true, message: "", checkedAt: "t" },
                    { ruleId: "x", passed: false, message: "", checkedAt: "t" },
                ],
            }),
        ).toBe(0);
    });

    it("treats non-numeric puzzleId as no rules (returns 1)", () => {
        const examConfig: any = {
            globalSpecialRules: [{ id: "g1" }],
            puzzles: [{ specialRules: [{ id: "p0" }] }],
        };

        expect(
            getSpecialRulesBinaryForPuzzle({
                examConfig,
                puzzleId: "not-a-number",
                specialRuleResults: undefined,
            }),
        ).toBe(1);
    });
});
