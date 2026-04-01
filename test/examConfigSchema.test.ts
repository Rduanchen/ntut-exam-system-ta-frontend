import { describe, expect, it } from "vitest";
import { examConfigSchema } from "../src/stores/examStore";

describe("examConfigSchema (TA frontend)", () => {
    it("parses legacy config (no special rules)", () => {
        const legacy = {
            testTitle: "T",
            description: "D",
            judgerSettings: { timeLimit: 1, memoryLimit: 1 },
            accessableUsers: [{ id: "A123", name: "Alice" }],
            puzzles: [
                {
                    title: "P1",
                    language: "C",
                    subtasks: [
                        {
                            title: "S1",
                            visible: [{ input: "1", output: "1" }],
                            hidden: [{ input: "2", output: "2" }],
                        },
                    ],
                },
            ],
        };

        const parsed = examConfigSchema.parse(legacy);
        expect(parsed.globalSpecialRules).toBeUndefined();
        expect(parsed.puzzles[0]?.specialRules).toBeUndefined();
    });

    it("parses config with globalSpecialRules + puzzles[].specialRules", () => {
        const cfg = {
            testTitle: "T",
            description: "D",
            judgerSettings: { timeLimit: 1, memoryLimit: 1 },
            accessableUsers: [{ id: "A123", name: "Alice" }],
            globalSpecialRules: [
                {
                    id: "g1",
                    type: "regex",
                    constraint: "MUST_HAVE",
                    message: "Must include main",
                    params: { pattern: "\\bmain\\b" },
                },
            ],
            puzzles: [
                {
                    title: "P1",
                    language: "C",
                    specialRules: [
                        {
                            id: "p1",
                            type: "includes",
                            constraint: "MUST_NOT_HAVE",
                            message: "Must not include goto",
                            params: { needle: "goto", caseSensitive: false },
                        },
                    ],
                    subtasks: [
                        {
                            title: "S1",
                            visible: [{ input: "1", output: "1" }],
                            hidden: [{ input: "2", output: "2" }],
                        },
                    ],
                },
            ],
        };

        const parsed = examConfigSchema.parse(cfg);
        expect(parsed.globalSpecialRules?.length).toBe(1);
        expect(parsed.puzzles[0]?.specialRules?.length).toBe(1);
    });
});
