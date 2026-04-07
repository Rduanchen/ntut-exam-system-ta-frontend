<script setup lang="ts">
import { computed } from "vue";

type Constraint = "MUST_HAVE" | "MUST_NOT_HAVE";

type RegexParams = { pattern: string; flags?: string };

type UseParams = { target: string };

type CompositeOp = "AND" | "OR";

type CompositeRuleChild = {
  type: "regex" | "use" | "composite";
  params: unknown;
};

type CompositeParams = {
  op: CompositeOp;
  rules: CompositeRuleChild[];
};

type BaseRule = {
  id: string;
  type: "regex" | "use" | "composite";
  constraint: Constraint;
  message: string;
  severity?: "info" | "warn";
  params: unknown;
};

const props = defineProps<{
  rule: BaseRule;
  disabled?: boolean;
}>();

// These operate directly on `rule.params` (mutating parent state via reference).
const isRegex = computed(() => props.rule.type === "regex");
const isUse = computed(() => props.rule.type === "use");
const isComposite = computed(() => props.rule.type === "composite");

function ensureRegexParams(): RegexParams {
  const p = (props.rule.params ?? {}) as any;
  if (typeof p.pattern !== "string") p.pattern = "";
  if (p.flags != null && typeof p.flags !== "string") p.flags = "";
  props.rule.params = p;
  return p as RegexParams;
}

function ensureUseParams(): UseParams {
  const p = (props.rule.params ?? {}) as any;
  if (typeof p.target !== "string") p.target = "";
  props.rule.params = p;
  return p as UseParams;
}

function ensureCompositeParams(): CompositeParams {
  const p = (props.rule.params ?? {}) as any;
  if (p.op !== "AND" && p.op !== "OR") p.op = "AND";
  if (!Array.isArray(p.rules)) p.rules = [];
  // sanitize rules
  p.rules = p.rules
    .filter(
      (c: any) =>
        c && (c.type === "regex" || c.type === "use" || c.type === "composite"),
    )
    .map((c: any) => {
      const child: CompositeRuleChild = {
        type: c.type,
        params: {},
      };

      const cp = typeof c.params === "object" && c.params ? c.params : {};

      if (c.type === "regex") {
        child.params = {
          pattern: typeof (cp as any).pattern === "string" ? (cp as any).pattern : "",
          flags: typeof (cp as any).flags === "string" ? (cp as any).flags : "",
        } satisfies RegexParams;
      }

      if (c.type === "use") {
        child.params = {
          target: typeof (cp as any).target === "string" ? (cp as any).target : "",
        } satisfies UseParams;
      }

      if (c.type === "composite") {
        child.params = {
          op: (cp as any).op === "OR" ? "OR" : "AND",
          rules: Array.isArray((cp as any).rules) ? (cp as any).rules : [],
        } satisfies CompositeParams;
      }

      return child;
    });

  props.rule.params = p;
  return p as CompositeParams;
}

const regexParams = computed(() => (isRegex.value ? ensureRegexParams() : null));
const useParams = computed(() => (isUse.value ? ensureUseParams() : null));
const compositeParams = computed(() =>
  isComposite.value ? ensureCompositeParams() : null,
);

function addCompositeChild(type: "regex" | "use" | "composite") {
  const p = ensureCompositeParams();
  p.rules.push(
    type === "regex"
      ? { type, params: { pattern: "", flags: "" } }
      : type === "use"
        ? { type, params: { target: "" } }
        : { type, params: { op: "AND", rules: [] } },
  );
}

function removeCompositeChild(index: number) {
  const p = ensureCompositeParams();
  p.rules.splice(index, 1);
}
</script>

<template>
  <div class="mt-3">
    <label class="block text-xs font-medium text-gray-500 uppercase">Params</label>

    <div v-if="isRegex" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-500">pattern</label>
        <input
          v-model="regexParams!.pattern"
          :disabled="disabled"
          class="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border font-mono"
          placeholder="e.g. \\bprintf\\(" 
        />
      </div>
      <div>
        <label class="block text-xs text-gray-500">flags (optional)</label>
        <input
          v-model="(regexParams as any)!.flags"
          :disabled="disabled"
          class="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border font-mono"
          placeholder="e.g. i"
        />
      </div>
    </div>

    <div v-else-if="isUse" class="mt-2">
      <label class="block text-xs text-gray-500">target</label>
      <input
        v-model="useParams!.target"
        :disabled="disabled"
        class="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border font-mono"
        placeholder="e.g. scanf"
      />
    </div>

    <div v-else-if="isComposite" class="mt-2 space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-500">op</label>
          <select
            v-model="compositeParams!.op"
            :disabled="disabled"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            type="button"
            class="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
            :disabled="disabled"
            @click="addCompositeChild('use')"
          >
            + Child(use)
          </button>
          <button
            type="button"
            class="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
            :disabled="disabled"
            @click="addCompositeChild('regex')"
          >
            + Child(regex)
          </button>
          <button
            type="button"
            class="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
            :disabled="disabled"
            @click="addCompositeChild('composite')"
          >
            + Child(composite)
          </button>
        </div>
      </div>

  <div v-if="compositeParams!.rules.length === 0" class="text-sm text-gray-500">
        No composite children. Add at least one.
      </div>

      <div
  v-for="(c, cIdx) in compositeParams!.rules"
        :key="cIdx"
        class="rounded border border-gray-200 bg-gray-50 p-3"
      >
        <div class="flex items-center justify-between">
          <div class="text-xs font-semibold text-gray-700 capitalize">
            child #{{ cIdx + 1 }} — {{ c.type }}
          </div>
          <button
            type="button"
            class="text-xs text-red-600 hover:text-red-800"
            :disabled="disabled"
            @click="removeCompositeChild(cIdx)"
          >
            Delete
          </button>
        </div>

        <!-- Nested child editing (including composite-of-composite) is handled recursively. -->
        <SpecialRuleParamsEditor
          :rule="({
            id: `${props.rule.id}/child-${cIdx}`,
            type: c.type,
            constraint: props.rule.constraint,
            message: props.rule.message,
            severity: props.rule.severity,
            params: c.params,
          } as any)"
          :disabled="disabled"
        />
      </div>
    </div>

    <div v-else class="mt-2 text-sm text-gray-500">Unknown rule type.</div>
  </div>
</template>
