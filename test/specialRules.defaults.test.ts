import { describe, expect, it, vi } from "vitest";
import { createDefaultSpecialRule } from "../src/specialRules/defaults";

describe("specialRules/defaults", () => {
    it("creates a valid default rule with a deterministic id when crypto.randomUUID is mocked", () => {
        const spy = vi
            .spyOn(globalThis.crypto, "randomUUID")
            .mockReturnValue("00000000-0000-0000-0000-000000000001");

        const rule = createDefaultSpecialRule();

        expect(rule.id).toBe("00000000-0000-0000-0000-000000000001");
        expect(rule.type).toBe("regex");
        expect(rule.constraint).toBe("MUST_NOT_HAVE");
        expect(rule.severity).toBe(undefined);
        expect(rule.params).toEqual({ pattern: "", flags: "" });

        spy.mockRestore();
    });

    it("applies overrides", () => {
        vi
            .spyOn(globalThis.crypto, "randomUUID")
            .mockReturnValue("00000000-0000-0000-0000-000000000002");

        const rule = createDefaultSpecialRule({
            type: "use",
            constraint: "MUST_HAVE",
            message: "Must use scanf",
            params: { target: "scanf" },
        });

        expect(rule.id).toBe("00000000-0000-0000-0000-000000000002");
        expect(rule.type).toBe("use");
        expect(rule.constraint).toBe("MUST_HAVE");
        expect(rule.message).toBe("Must use scanf");
        expect(rule.params).toEqual({ target: "scanf" });
    });
});
