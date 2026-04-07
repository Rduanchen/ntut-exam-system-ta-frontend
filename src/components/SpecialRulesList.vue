<script setup lang="ts">
import { computed } from "vue";
import type { ExamConfig } from "../stores/examStore";

type SpecialRule = NonNullable<ExamConfig["globalSpecialRules"]>[number];

type Props = {
  title?: string;
  rules?: SpecialRule[];
  emptyText?: string;
};

const props = defineProps<Props>();

const safeRules = computed(() => props.rules ?? []);

function constraintLabel(constraint: SpecialRule["constraint"]) {
  return constraint === "MUST_HAVE" ? "Must have" : "Must not have";
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white">
    <div
      v-if="title"
      class="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between"
    >
      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {{ title }}
      </div>
      <div class="text-[11px] text-gray-500">{{ safeRules.length }} rules</div>
    </div>

    <div class="p-3 space-y-2">
      <div v-if="safeRules.length === 0" class="text-sm text-gray-500">
        {{ emptyText ?? "No special rules." }}
      </div>

      <div
        v-for="r in safeRules"
        :key="r.id"
        class="flex items-start justify-between gap-3"
      >
        <div class="min-w-0">
          <div class="text-sm text-gray-800 break-words">{{ r.message }}</div>
          <div class="text-[11px] text-gray-500 mt-0.5">
            <span class="font-mono">{{ r.type }}</span>
            <span class="mx-2 text-gray-300">|</span>
            {{ constraintLabel(r.constraint) }}
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span
            v-if="r.severity"
            class="px-2 py-0.5 rounded text-[10px] font-semibold border"
            :class="
              r.severity === 'warn'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            "
          >
            {{ r.severity }}
          </span>
          <span
            class="px-2 py-0.5 rounded text-[10px] font-semibold border bg-gray-50 text-gray-600 border-gray-200"
            title="Rule id"
          >
            {{ r.id }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
