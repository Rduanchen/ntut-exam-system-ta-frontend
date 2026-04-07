import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => {
    return {
        default: {
            post: vi.fn(),
            get: vi.fn(),
        },
    };
});

import axios from "axios";
import { setActivePinia, createPinia } from "pinia";
import { useStudentDashboardStore } from "../src/stores/studentDashboardStore";
import { useScoreStore } from "../src/stores/scoreStore";

describe("studentDashboardStore.judgeStudentCode", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it("uses isJudging/judgeError and refreshes student score on success", async () => {
        const store = useStudentDashboardStore();
        // judgeStudentCode now triggers a best-effort global scoreboard refresh.
        // Mock it so this unit test stays isolated and doesn't spam stderr.
        vi.spyOn(useScoreStore(), "fetchScores").mockResolvedValue(undefined as any);
        const fetchStudentScoreSpy = vi
            .spyOn(store, "fetchStudentScore")
            .mockResolvedValue(undefined as any);

        (axios.post as any).mockResolvedValue({
            data: {
                success: true,
                data: {
                    result: {
                        "0": {
                            subtasks: [],
                            specialRuleResults: [
                                { ruleId: "r1", passed: true, message: "", checkedAt: "t" },
                            ],
                        },
                    },
                },
            },
        });

        const p = store.judgeStudentCode("114590001");
        expect(store.isJudging).toBe(true);

        await p;

        expect(store.isJudging).toBe(false);
        expect(store.judgeError).toBe(null);
        expect(store.judgeResult).toBeTruthy();
        expect(fetchStudentScoreSpy).toHaveBeenCalledWith("114590001");
    });

    it("sets judgeError on failure and doesn't throw", async () => {
        const store = useStudentDashboardStore();
        vi.spyOn(store, "fetchStudentScore").mockResolvedValue(undefined as any);

        (axios.post as any).mockRejectedValue(new Error("boom"));

        await store.judgeStudentCode("114590001");

        expect(store.isJudging).toBe(false);
        expect(store.judgeError).toBe("boom");
    });
});
