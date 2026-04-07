<template>
  <div class="p-6 max-w-[95%] mx-auto font-sans text-gray-800">
    <header class="flex flex-wrap items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-gray-900">學生成績表</h2>

      <div class="flex flex-wrap gap-2 ml-auto">
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
          >
            <svg
              class="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            v-model="keyword"
            class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="搜尋學號或姓名..."
            @keyup.enter="refreshData"
          />
        </div>

        <button
          @click="refreshData"
          :disabled="scoreStore.loading"
          class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 disabled:opacity-50"
        >
          {{ scoreStore.loading ? "載入中..." : "重新整理" }}
        </button>

        <button
          @click="copyTable"
          :disabled="scoreStore.loading || filteredRecords.length === 0"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 disabled:opacity-50"
        >
          複製表格 (Excel)
        </button>

        <button
          @click="openFormulaModal"
          :disabled="scoreStore.loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
        >
          計算公式
        </button>
      </div>
    </header>

    <!-- Error / Loading / Empty States -->
    <div
      v-if="scoreStore.error"
      class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
      role="alert"
    >
      <span class="font-medium">Error:</span> {{ scoreStore.error }}
    </div>

    <div
      v-if="
        !scoreStore.loading && filteredRecords.length === 0 && !scoreStore.error
      "
      class="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50"
      role="alert"
    >
      找不到符合的資料
    </div>

    <!-- Main Table -->
    <div
      v-if="!scoreStore.loading && filteredRecords.length > 0"
      class="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-200"
    >
      <table class="w-full text-sm text-left text-gray-500">
        <thead
          class="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10"
        >
          <tr>
            <th
              scope="col"
              class="px-3 py-3 w-24 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              學生編號
            </th>
            <th
              scope="col"
              class="px-3 py-3 w-32 sticky left-24 bg-gray-100 z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              姓名
            </th>

            <!-- Dynamic Puzzle Columns -->
            <template v-for="pid in puzzleIds" :key="pid">
              <th
                :colspan="(subtaskCounts[pid] || 1) + 1"
                class="px-3 py-2 text-center border-l border-b border-gray-300 bg-gray-200"
              >
                題目 {{ Number(pid) + 1 }}
              </th>
            </template>

            <th rowspan="2" class="px-3 py-3 border-l border-gray-200">
              題目數
            </th>
            <th rowspan="2" class="px-3 py-3">通過 Subtasks</th>
            <th
              rowspan="2"
              class="px-3 py-3 bg-blue-50 text-blue-800 font-bold border-l border-blue-100"
            >
              公式得分
            </th>
            <th rowspan="2" class="px-3 py-3">提交時間</th>
          </tr>
          <!-- <tr>
          
            <template v-for="pid in puzzleIds" :key="`sub-${pid}`">
              <th
                v-for="sIdx in subtaskCounts[pid] || 0"
                :key="`${pid}-${sIdx}`"
                class="px-2 py-1 text-center font-normal text-xs border-l border-gray-200 min-w-[60px]"
              >
                Subtask {{ sIdx }}
              </th>
          
              <th
                v-if="(subtaskCounts[pid] || 0) === 0"
                class="px-2 py-1 border-l border-gray-200"
              >
                -
              </th>
            </template>
          </tr> -->
        </thead>
        <tbody>
          <tr
            v-for="rec in filteredRecords"
            :key="rec.id"
            class="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50': selectedRecord?.id === rec.id }"
            @click="selectRecord(rec)"
          >
            <td
              class="px-3 py-3 font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              {{ rec.student_ID }}
            </td>
            <td
              class="px-3 py-3 sticky left-24 bg-inherit z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              {{ rec.student_name }}
            </td>

            <!-- Puzzle Results Cells -->
            <template v-for="pid in puzzleIds" :key="`cell-${pid}`">
              <td
                v-for="sIdx in subtaskCounts[pid] || 0"
                :key="`${pid}-${sIdx}-val`"
                class="px-2 py-3 text-center border-l border-gray-100"
                :class="
                  getStatusColorClass(getAggregatedStatus(rec, pid, sIdx - 1))
                "
              >
                {{ getAggregatedStatus(rec, pid, sIdx - 1) || "-" }}
              </td>
              <td
                v-if="(subtaskCounts[pid] || 0) === 0"
                class="px-2 py-3 text-center border-l border-gray-100 text-gray-300"
              >
                -
              </td>

              <!-- Special rules binary cell: 1 if all passed, else 0 -->
              <td
                class="px-2 py-3 text-center border-l border-gray-100 font-semibold"
                :class="
                  getSpecialRulesBinary(rec, pid) === 1
                    ? 'text-green-700 bg-green-50'
                    : 'text-red-700 bg-red-50'
                "
                title="Special rules: 1=all passed, 0=any failed"
              >
                {{ getSpecialRulesBinary(rec, pid) }}
              </td>
            </template>

            <td class="px-3 py-3 text-center border-l border-gray-200">
              {{ rec.puzzle_amount }}
            </td>
            <td class="px-3 py-3 text-center">
              {{ rec.passed_subtask_amount }}
            </td>
            <td
              class="px-3 py-3 text-center font-bold text-blue-600 bg-blue-50/50 border-l border-blue-100"
            >
              {{ formulaOutputs[rec.id] || "-" }}
            </td>
            <td class="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
              {{ formatTime(rec.last_submit_time) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="selectedRecord"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      @click.self="selectedRecord = null"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-xl font-bold text-gray-900">
            {{ selectedRecord.student_name }} ({{ selectedRecord.student_ID }})
            - 詳細資料
          </h3>
          <button
            @click="selectedRecord = null"
            class="text-gray-400 hover:text-gray-500"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <div
            v-for="(puzzleResult, pid) in selectedRecord.puzzle_results"
            :key="pid"
            class="mb-8"
          >
            <h4 class="text-lg font-semibold mb-2 text-gray-800">
              題目 {{ Number(pid) + 1 }}
            </h4>

            <div class="mb-4">
              <SpecialRulesStatusPanel
                :examConfig="examStore.config"
                :puzzleIndex="Number(pid)"
                :specialRuleResults="puzzleResult.specialRuleResults || []"
              />
            </div>

            <div
              v-for="(subtask, sIdx) in puzzleResult.subtasks"
              :key="sIdx"
              class="mb-4 ml-4 p-4 border rounded-lg bg-gray-50"
            >
              <h5 class="font-medium text-gray-700 mb-2">
                Subtask {{ sIdx + 1 }}
              </h5>

              <!-- Visible Cases -->
              <div class="mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase"
                  >Visible Cases</span
                >
                <div class="grid gap-2 mt-1">
                  <div
                    v-for="(vc, vIdx) in subtask.visible"
                    :key="`v-${vIdx}`"
                    class="flex items-center text-sm bg-white p-2 rounded border gap-3"
                  >
                    <span
                      class="w-8 h-8 flex items-center justify-center rounded font-bold text-white text-xs shrink-0"
                      :class="getStatusCodeBg(vc.status)"
                    >
                      {{ vc.status }}
                    </span>
                    <div
                      class="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs"
                    >
                      <div>
                        <span class="text-gray-400">Exp:</span>
                        <span class="font-mono text-gray-800 break-all">{{
                          truncate(vc.expectedOutput)
                        }}</span>
                      </div>
                      <div>
                        <span class="text-gray-400">Gained:</span>
                        <span class="font-mono text-gray-800 break-all">{{
                          truncate(vc.userOutput)
                        }}</span>
                      </div>
                      <div class="col-span-2 text-gray-400 text-[10px]">
                        {{ vc.time ? `${vc.time}ms` : "" }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="!subtask.visible.length"
                    class="text-gray-400 text-xs italic"
                  >
                    No visible cases
                  </div>
                </div>
              </div>

              <!-- Hidden Cases -->
              <div class="mb-3">
                <span class="text-xs font-bold text-gray-500 uppercase"
                  >Hidden Cases</span
                >
                <div class="grid gap-2 mt-1">
                  <div
                    v-for="(hc, hIdx) in subtask.hidden"
                    :key="`h-${hIdx}`"
                    class="flex items-center text-sm bg-white p-2 rounded border gap-3"
                  >
                    <span
                      class="w-8 h-8 flex items-center justify-center rounded font-bold text-white text-xs shrink-0"
                      :class="getStatusCodeBg(hc.status)"
                    >
                      {{ hc.status }}
                    </span>
                    <div
                      class="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs"
                    >
                      <div>
                        <span class="text-gray-400">Exp:</span>
                        <span class="text-gray-500 italic">Hidden</span>
                      </div>
                      <div>
                        <span class="text-gray-400">Gained:</span>
                        <span class="text-gray-500 italic">Hidden</span>
                      </div>
                      <div class="col-span-2 text-gray-400 text-[10px]">
                        {{ hc.time ? `${hc.time}ms` : "" }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="!subtask.hidden.length"
                    class="text-gray-400 text-xs italic"
                  >
                    No hidden cases
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formula Modal -->
    <div
      v-if="showFormulaModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 "
      @click.self="closeFormulaModal"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
      >
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">編輯計分公式 (JavaScript)</h3>
          <button
            @click="closeFormulaModal"
            class="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div class="p-4 flex-1 overflow-auto">
          <p class="text-sm text-gray-600 mb-2">
            系統會將代碼包裹為
            <code>function(record) { ... }</code
            >。請回傳分數(字串或數字)。<br />
            <code>record</code> 包含 <code>puzzle_results</code>,
            <code>passed_subtask_amount</code> 等欄位。
          </p>
          <div class="relative">
            <textarea
              v-model="formulaCode"
              class="w-full h-64 p-3 font-mono text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              spellcheck="false"
            ></textarea>
          </div>
          <div
            v-if="formulaError"
            class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded"
          >
            {{ formulaError }}
          </div>
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end space-x-2">
          <button
            @click="resetDefaultFormula"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            重置預設值
          </button>
          <button
            @click="applyFormula"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            套用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  useScoreStore,
  type StudentRecord,
  type StatusCode,
} from "../stores/scoreStore";
import { useExamStore } from "../stores/examStore";
import { getSpecialRulesBinaryForPuzzle } from "../specialRules/scoreboard";
import SpecialRulesStatusPanel from "../components/SpecialRulesStatusPanel.vue";

const scoreStore = useScoreStore();
const examStore = useExamStore();
const keyword = ref("");
const selectedRecord = ref<StudentRecord | null>(null);

// Formula State
const showFormulaModal = ref(false);
const LOCAL_STORAGE_KEY = "scores_formula_v2"; // Changed key for versioning
const defaultFormula = `
// Available: record.subtask_amount, record.puzzle_results (map)
// record.puzzle_results['0'] is array of subtasks for puzzle 0

const { puzzle_results, puzzle_amount } = record;
if (!puzzle_amount) return "0 / 100";

let totalScore = 0;
const scorePerPuzzle = 100 / puzzle_amount;

// Iterate through puzzles (keys might be "0", "1"...)
Object.keys(puzzle_results).forEach(pid => {
  const puzzleResult = puzzle_results[pid];
  const subtasks = puzzleResult?.subtasks;
  if (!subtasks || subtasks.length === 0) return;

    let passedSubtasks = 0;
    subtasks.forEach(sub => {
        // A subtask is passed if ALL visible AND hidden cases are AC
        const visiblePass = sub.visible.every(tc => tc.status === 'AC');
        const hiddenPass = sub.hidden.every(tc => tc.status === 'AC');
        if (visiblePass && hiddenPass) {
            passedSubtasks++;
        }
    });
    
    // Proportional score for this puzzle
    totalScore += (passedSubtasks / subtasks.length) * scorePerPuzzle;
});

return Math.round(totalScore) + " / 100";
`;
const formulaCode = ref(defaultFormula);
const formulaError = ref("");
// Compiled formula function
const formulaFn = ref<(r: StudentRecord) => any>(() => "");

onMounted(async () => {
  // Load formula
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) formulaCode.value = saved;
  tryApplyFormula(formulaCode.value, false);

  await examStore.fetchConfig();
  await scoreStore.fetchScores();
  scoreStore.setupSocket();
});

onBeforeUnmount(() => {
  scoreStore.disconnectSocket();
});

const refreshData = () => {
  scoreStore.fetchScores();
};

const filteredRecords = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return scoreStore.records;
  return scoreStore.records.filter(
    (r) =>
      r.student_name.toLowerCase().includes(k) ||
      r.student_ID.toLowerCase().includes(k),
  );
});

// Calculate columns dynamically
// We need to know max subtasks for each puzzle to align columns
const puzzleIds = computed(() => {
  const pids = new Set<string>();
  filteredRecords.value.forEach((r) => {
    Object.keys(r.puzzle_results || {}).forEach((k) => pids.add(k));
  });
  return Array.from(pids).sort((a, b) => Number(a) - Number(b));
});

const subtaskCounts = computed(() => {
  const counts: Record<string, number> = {};
  puzzleIds.value.forEach((pid) => {
    let max = 0;
    filteredRecords.value.forEach((r) => {
  const subtasks = r.puzzle_results[pid]?.subtasks;
  if (subtasks && subtasks.length > max) max = subtasks.length;
    });
    counts[pid] = max;
  });
  return counts;
});

// Helper to determine status string for a subtask cell
const getAggregatedStatus = (
  rec: StudentRecord,
  pid: string,
  sIdx: number,
): string => {
  const subtasks = rec.puzzle_results[pid]?.subtasks;
  if (!subtasks || !subtasks[sIdx]) return "";

  const sub = subtasks[sIdx];
  const allCases = [...sub.visible, ...sub.hidden];
  if (allCases.length === 0) return "";

  // Priority: AC if all AC. Else Show first non-AC error.
  // Order of error severity could be debatable, but usually we just want to know "Why not AC?"
  // If mixed errors, which one to show? Usually just the first failed one we encounter.

  // However, cell display space is small.
  // If all AC -> AC
  // Else -> First non-AC status found.

  for (const c of allCases) {
    if (c.status !== "AC") return c.status;
  }
  return "AC";
};

// Per puzzle:
// - no effective rules configured => 1
// - rules exist but not evaluated yet => 0
// - evaluated => 1 only if all passed
const getSpecialRulesBinary = (rec: StudentRecord, pid: string): number => {
  return getSpecialRulesBinaryForPuzzle({
    examConfig: examStore.config,
    puzzleId: pid,
    specialRuleResults: rec.puzzle_results[pid]?.specialRuleResults,
  });
};

const getStatusColorClass = (status: string) => {
  switch (status) {
    case "AC":
      return "text-green-600 font-bold bg-green-50";
    case "WA":
      return "text-red-600 font-bold bg-red-50";
    case "TLE":
      return "text-orange-600 font-bold bg-orange-50";
    case "MLE":
      return "text-orange-600 font-bold bg-orange-50";
    case "RE":
      return "text-purple-600 font-bold bg-purple-50";
    case "CE":
      return "text-yellow-600 font-bold bg-yellow-50";
    case "SE":
      return "text-gray-600 font-bold bg-gray-100";
    default:
      return "text-gray-400";
  }
};

const getStatusCodeBg = (status: StatusCode) => {
  switch (status) {
    case "AC":
      return "bg-green-500";
    case "WA":
      return "bg-red-500";
    case "TLE":
      return "bg-orange-500";
    case "MLE":
      return "bg-orange-500";
    case "RE":
      return "bg-purple-500";
    case "CE":
      return "bg-yellow-500";
    case "SE":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
};

const formatTime = (iso: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-TW", {
      hour12: false,
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const truncate = (str: string, len = 20) => {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
};

// Selection
const selectRecord = (r: StudentRecord) => {
  selectedRecord.value = r;
};

// Formula Logic
const formulaOutputs = computed(() => {
  const outs: Record<number, string> = {};
  if (!formulaFn.value) return outs;

  filteredRecords.value.forEach((r) => {
    try {
      outs[r.id] = String(formulaFn.value(r));
    } catch (e) {
      outs[r.id] = "Err";
    }
  });
  return outs;
});

const openFormulaModal = () => {
  showFormulaModal.value = true;
};
const closeFormulaModal = () => (showFormulaModal.value = false);

const tryApplyFormula = (code: string, save = true) => {
  try {
    const fn = new Function("record", code) as (r: StudentRecord) => any;
    // Test run
    fn({
      id: 0,
      student_ID: "",
      student_name: "",
      last_submit_time: null,
      subtask_amount: 0,
      passed_subtask_amount: 0,
      puzzle_amount: 0,
      passed_puzzle_amount: 0,
      puzzle_results: {},
    });

    formulaFn.value = fn;
    formulaError.value = "";
    if (save) {
      localStorage.setItem(LOCAL_STORAGE_KEY, code);
      showFormulaModal.value = false;
    }
  } catch (err: any) {
    console.error(err);
    formulaError.value = err.message || "語法錯誤";
  }
};
const applyFormula = () => {
  tryApplyFormula(formulaCode.value, true);
};
const resetDefaultFormula = () => {
  formulaCode.value = defaultFormula;
};

// Copy Table
const copyTable = async () => {
  try {
    // Headers
    const headers = [
      "ID",
      "Name",
      ...puzzleIds.value.flatMap((pid) =>
        Array.from({ length: subtaskCounts.value[pid] || 0 }).map(
          (_, i) => `P${Number(pid) + 1}-S${i + 1}`,
        ),
      ),
  ...puzzleIds.value.map((pid) => `P${Number(pid) + 1}-SR`),
      "Puzzles",
      "Passed Subtasks",
      "Score",
      "Time",
    ];

    const rows = filteredRecords.value.map((r) => {
      const puzzleCells = puzzleIds.value.flatMap((pid) => {
        const count = subtaskCounts.value[pid] || 0;
        return Array.from({ length: count }).map((_, i) =>
          getAggregatedStatus(r, pid, i),
        );
      });

      const specialRuleCells = puzzleIds.value.map((pid) =>
        String(getSpecialRulesBinary(r, pid)),
      );
      return [
        r.student_ID,
        r.student_name,
        ...puzzleCells,
        ...specialRuleCells,
        r.puzzle_amount,
        r.passed_subtask_amount,
        formulaOutputs.value[r.id],
        r.last_submit_time,
      ].join("\t");
    });

    const text = [headers.join("\t"), ...rows].join("\n");
    await navigator.clipboard.writeText(text);
    alert("已複製到剪貼簿 (Excel format)");
  } catch (e) {
    alert("複製失敗");
  }
};
</script>
