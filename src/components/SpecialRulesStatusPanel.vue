<script setup lang="ts">
import { computed } from "vue";
import type { ExamConfig } from "../stores/examStore";
import type { SpecialRuleResultRecord } from "../stores/scoreStore";
import {
  buildRuleStatusList,
  getEffectiveRules,
  indexRuleResultsById,
} from "../specialRules/selectors";

const props = defineProps<{
  examConfig: ExamConfig | null | undefined;
  puzzleIndex: number;
  specialRuleResults?: SpecialRuleResultRecord[];
}>();

const effectiveRules = computed(() =>
  getEffectiveRules(props.examConfig, props.puzzleIndex),
);

const statusItems = computed(() => {
  const resultsById = indexRuleResultsById(props.specialRuleResults);
  return buildRuleStatusList({
    effectiveRules: effectiveRules.value,
    resultsById,
  });
});

const hasRules = computed(() => effectiveRules.value.length > 0);

function statusPillClass(status: string) {
  switch (status) {
    case "PASS":
      return "bg-green-100 text-green-700 border border-green-200";
    case "FAIL":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
}

function statusSymbol(status: string) {
  switch (status) {
    case "PASS":
      return "✓";
    case "FAIL":
      return "✕";
    default:
      return "–";
  }
}
</script>

<template>
  <div v-if="hasRules" class="mt-3 rounded-lg border border-gray-200 bg-white">
    <div class="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Special rules
      </div>
      <div class="text-[11px] text-gray-500">
        {{ statusItems.filter((x) => x.status === 'PASS').length }}/{{ statusItems.length }} passed
      </div>
    </div>

    <div class="p-3 space-y-2">
      <div
        v-for="item in statusItems"
        :key="item.rule.id"
        class="flex items-start justify-between gap-3"
      >
        <div class="min-w-0">
          <div class="text-sm text-gray-800 break-words">
            {{ item.rule.message }}
          </div>
          <div v-if="item.checkedAt" class="text-[11px] text-gray-400 mt-0.5">
            Checked at: {{ new Date(item.checkedAt).toLocaleString('zh-TW', { hour12: false }) }}
          </div>
          <div
            v-if="item.status === 'FAIL' && item.reason"
            class="text-[11px] text-red-700 mt-0.5 break-words"
            :title="item.reason"
          >
            Reason: {{ item.reason }}
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            :class="statusPillClass(item.status)"
            :title="item.status"
          >
            {{ statusSymbol(item.status) }} {{ item.status }}
          </span>

          <span
            v-if="item.rule.severity"
            class="px-2 py-0.5 rounded text-[10px] font-semibold border"
            :class="
              item.rule.severity === 'warn'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            "
          >
            {{ item.rule.severity }}
          </span>
        </div>
      </div>

      <div v-if="statusItems.length === 0" class="text-sm text-gray-500">
        No special rules.
      </div>
    </div>
  </div>
</template>
