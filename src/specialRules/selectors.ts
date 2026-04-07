import type { ExamConfig } from "../stores/examStore";
import type {
    SpecialRuleResultRecord,
} from "../stores/scoreStore";
import type {
    IndexedRuleResults,
    RuleStatusItem,
    SpecialRule,
} from "./types";

export function getEffectiveRules(
    examConfig: ExamConfig | null | undefined,
    puzzleIndex: number,
): SpecialRule[] {
    if (!examConfig) return [];

    const global = examConfig.globalSpecialRules ?? [];
    const puzzle = examConfig.puzzles?.[puzzleIndex]?.specialRules ?? [];

    return [...global, ...puzzle];
}

export function indexRuleResultsById(
    specialRuleResults: SpecialRuleResultRecord[] | undefined,
): IndexedRuleResults {
    const out: IndexedRuleResults = {};
    for (const r of specialRuleResults ?? []) {
        out[r.ruleId] = r;
    }
    return out;
}

export function buildRuleStatusList(params: {
    effectiveRules: SpecialRule[];
    resultsById: IndexedRuleResults;
}): RuleStatusItem[] {
    const { effectiveRules, resultsById } = params;

    return effectiveRules.map((rule) => {
        const result = resultsById[rule.id];

        if (!result) {
            return { rule, status: "NOT_EVALUATED" };
        }

        return {
            rule,
            status: result.passed ? "PASS" : "FAIL",
            checkedAt: result.checkedAt,
            reason: result.reason,
        };
    });
}
