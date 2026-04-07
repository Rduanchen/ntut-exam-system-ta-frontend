import type { ExamConfig } from "../stores/examStore";
import type { SpecialRuleResultRecord } from "../stores/scoreStore";

export type SpecialRule = NonNullable<ExamConfig["globalSpecialRules"]>[number];

export type RuleStatus = "PASS" | "FAIL" | "NOT_EVALUATED";

export type RuleStatusItem = {
    rule: SpecialRule;
    status: RuleStatus;
    checkedAt?: string;
    reason?: string;
};

export type IndexedRuleResults = Record<string, SpecialRuleResultRecord>;
