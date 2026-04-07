import type { ExamConfig } from "../stores/examStore";
import type { SpecialRuleResultRecord } from "../stores/scoreStore";
import { getEffectiveRules } from "./selectors";

// Per puzzle:
// - no effective rules configured => 1
// - rules exist but not evaluated yet => 0
// - evaluated => 1 only if all passed
export const getSpecialRulesBinaryForPuzzle = (params: {
    examConfig: ExamConfig | null;
    puzzleId: string;
    specialRuleResults: SpecialRuleResultRecord[] | undefined;
}): number => {
    const puzzleIndex = Number(params.puzzleId);
    const effectiveRules = Number.isNaN(puzzleIndex)
        ? []
        : getEffectiveRules(params.examConfig, puzzleIndex);

    if (effectiveRules.length === 0) return 1;

    const results = params.specialRuleResults;
    if (!results || results.length === 0) return 0;
    return results.every((r) => r.passed) ? 1 : 0;
};
