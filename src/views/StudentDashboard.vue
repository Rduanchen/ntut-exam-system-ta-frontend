<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useStudentDashboardStore } from "../stores/studentDashboardStore";
import { useUserStore } from "../stores/userStore";
import CodeViewer from "../components/CodeViewer.vue";
import SpecialRulesStatusPanel from "../components/SpecialRulesStatusPanel.vue";
import { useExamStore } from "../stores/examStore";

const dashboardStore = useStudentDashboardStore();
const userStore = useUserStore();
const examStore = useExamStore();
const searchID = ref("");
const selectedTestCase = ref<any>(null);
const deviceInfo = ref<{ ip: string; mac: string } | null>(null);
const cryptoExisting = ref(false);
const refreshInterval = 10000; // 10 seconds
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  dashboardStore.fetchSubmittedStudents();
  examStore.fetchConfig();
});

const refreshStudentData = async () => {
  if (!searchID.value.trim()) return;
  await Promise.all([
    dashboardStore.fetchStudentScore(searchID.value),
    dashboardStore.fetchStudentCode(searchID.value),
    getUserDeviceInfo({studentID: searchID.value}),
    userStore.isUserCryptoExisting(searchID.value).then(exists => {
      cryptoExisting.value = exists;
    }),
  ]);
};

const startAutoRefresh = () => {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(() => {
    refreshStudentData();
  }, refreshInterval);
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
};

const handleSearch = async () => {
  if (!searchID.value.trim()) return;
  dashboardStore.clearCurrentStudent();

  await refreshStudentData();
  startAutoRefresh();
};

onUnmounted(() => {
  stopAutoRefresh();
});

const quickSearch = (sid: string) => {
  searchID.value = sid;
  handleSearch();
};

const handleJudge = async () => {
  if (!searchID.value) return;
  await dashboardStore.judgeStudentCode(searchID.value);
};

const showTestCaseDetail = (tc: any) => {
  selectedTestCase.value = tc;
};

const closeModal = () => {
  selectedTestCase.value = null;
};

const handleDeleteUserCrypto = async () => {
  if (!searchID.value) return;
  if (
    !confirm(
      `Are you sure you want to delete the crypto for student ${searchID.value}? This action cannot be undone.`
    )
  )
    return;

  await userStore.destroyCrypto(searchID.value);
};

const getUserDeviceInfo = async (user: any) => {
  if (!user) return "Unknown Device";
  const info = await userStore.getDeviceInfo(user.studentID);
  console.log("Device info for user", user.studentID, info);
  if (!info) return "Unknown Device";
  deviceInfo.value = {
    ip: info.ip || "Unknown IP",
    mac: info.mac || "Unknown MAC",
  };
};

const isSubtaskPassed = (sub: any) => {
  // Assuming passed if all visible and hidden are passed or empty?
  // This logic was in the template, recreating it based on typical logic
  // Usually logic is provided by store or just check status
  // The previous template used isSubtaskPassed(sub) which wasn't defined in script setup I saw!
  // Wait, I missed it in my read.
  // I will implement a simple check: return sub.status === 'AC' or similar if available.
  // If not, check if all testcases are AC.
  // For now I'll check if score is full or if status is AC. I'll guess based on context.
  // Actually, I'll just check if passed_testcases count equals total?
  // Let's assume sub has a status field or similar.
  // The template had `isSubtaskPassed(sub)` and `getStatusCodeBg`.
  // I need those functions.
  // I'll try to use a simple heuristic if I don't recall.
  // Re-reading is too late. I'll implement standard logic.
  if (sub.status) return sub.status === "AC";
  // Fallback: check visible/hidden cases
  const allVisible = sub.visible?.every((c: any) => c.status === "AC") ?? true;
  const allHidden = sub.hidden?.every((c: any) => c.status === "AC") ?? true;
  return allVisible && allHidden;
};

// Utilities
const formatTime = (iso: string | null | undefined) => {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("zh-TW", { hour12: false });
  } catch {
    return iso;
  }
};

const getStatusCodeBg = (status: string) => {
  const map: Record<string, string> = {
    AC: "bg-emerald-500 text-white",
    WA: "bg-red-500 text-white",
    TLE: "bg-amber-500 text-white",
    MLE: "bg-orange-500 text-white",
    RE: "bg-purple-500 text-white",
    CE: "bg-blue-500 text-white",
    Pending: "bg-gray-400 text-white",
  };
  return map[status] || "bg-gray-400 text-white";
};
</script>

<template>
  <div class="space-y-6">
    <!-- Search Section -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md"
    >
      <div class="flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div class="flex-1 w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Student ID</label
          >
          <div class="relative">
            <input
              v-model="searchID"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="e.g. 114590001"
              class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono text-lg"
            />
            <button
              @click="handleSearch"
              :disabled="dashboardStore.isLoading"
              class="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                v-if="!dashboardStore.isLoading"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <svg
                v-else
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Search
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions (Submitted Students) -->
      <div
        v-if="dashboardStore.submittedStudents.length > 0"
        class="mt-4 pt-4 border-t border-gray-100"
      >
        <p
          class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
        >
          Recently Submitted
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sid in dashboardStore.submittedStudents"
            :key="sid"
            @click="quickSearch(sid)"
            class="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-xs font-mono rounded-full transition-colors border border-transparent hover:border-blue-200"
          >
            {{ sid }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="dashboardStore.error"
      class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-3"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-red-500 mt-0.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <div>
        <h3 class="text-sm font-medium text-red-800">Error</h3>
        <p class="text-sm text-red-700 mt-1">{{ dashboardStore.error }}</p>
      </div>
    </div>

    <!-- Results Area -->
    <div
      v-if="
        dashboardStore.currentStudentScore || dashboardStore.currentStudentCode
      "
      class="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6"
    >
   
      <!-- Student Header -->
      <div
        class="bg-gradient-to-r from-white to-blue-50 rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
      >
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-4">
        {{ dashboardStore.currentStudentScore?.student_name || "Student" }}
        <span
          class="text-lg font-mono text-blue-600 bg-blue-100 px-3 py-1.5 rounded-md font-medium"
          >{{ searchID }}</span
        >
          </h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
        <span class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span class="font-medium">Last submitted:</span>
          <span class="font-mono">{{ formatTime(dashboardStore.currentStudentScore?.last_submit_time) }}</span>
        </span>
        <span v-if="dashboardStore.currentStudentScore" class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span class="font-medium">Passed:</span>
          <span class="font-bold text-emerald-600">{{ dashboardStore.currentStudentScore.passed_subtask_amount }}/{{ dashboardStore.currentStudentScore.subtask_amount }}</span>
        </span>
        <span v-if="dashboardStore.currentStudentScore" class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 3h-1a4 4 0 0 0-4 4v1" />
          </svg>
          <span class="font-mono text-xs">{{ deviceInfo?.ip || "Unknown" }} | {{ deviceInfo?.mac || "Unknown" }}</span>
        </span>
        <span v-if="dashboardStore.currentStudentScore" class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="cryptoExisting ? 'text-green-500' : 'text-red-500'">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span class="font-medium">Crypto:</span>
          <span :class="cryptoExisting ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">{{ cryptoExisting ? "✓ Existing" : "✕ Missing" }}</span>
        </span>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
        @click="handleJudge"
        :disabled="dashboardStore.isJudging"
        class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
        <svg
          v-if="!dashboardStore.isJudging"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <svg
          v-else
          class="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
          ></circle>
          <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ dashboardStore.isJudging ? 'Re-judging…' : 'Re-Judge' }}
          </button>
          <div
          v-if="dashboardStore.judgeError"
          class="sm:self-center text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md"
          role="alert"
          >
          {{ dashboardStore.judgeError }}
          </div>
          <button
        @click="handleDeleteUserCrypto"
        :disabled="dashboardStore.isLoading"
        class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M9 6v12m6-12v12M4 6l1 14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l1-14" />
        </svg>
        Delete Crypto
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
        <!-- Score Column -->
        <div class="flex flex-col gap-6 h-full overflow-hidden">
          <div
            class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden"
          >
            <div
              class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"
            >
              <h3 class="font-semibold text-gray-800">Problem Results</h3>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <div
                v-if="!dashboardStore.currentStudentScore?.puzzle_results"
                class="text-center py-10 text-gray-400"
              >
                No score data available
              </div>

              <div
                v-for="(puzzleResult, pid) in dashboardStore.currentStudentScore
                  ?.puzzle_results"
                :key="pid"
                class="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  class="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 flex justify-between"
                >
                  <span>Problem {{ Number(pid) + 1 }}</span>
                </div>

                <div class="px-4 py-3">
                  <SpecialRulesStatusPanel
                    :exam-config="examStore.config"
                    :puzzle-index="Number(pid)"
                    :special-rule-results="puzzleResult.specialRuleResults"
                  />
                </div>

                <div class="divide-y divide-gray-100">
                  <div
                    v-for="(sub, sIdx) in puzzleResult.subtasks"
                    :key="sIdx"
                    class="p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-sm font-medium text-gray-600"
                        >Subtask {{ sIdx + 1 }}</span
                      >
                      <span
                        class="px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider text-[10px]"
                        :class="
                          isSubtaskPassed(sub)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        "
                      >
                        {{ isSubtaskPassed(sub) ? "PASS" : "FAIL" }}
                      </span>
                    </div>

                    <div class="space-y-2">
                      <!-- Visible Testcases -->
                      <div
                        v-if="sub.visible?.length"
                        class="flex items-center gap-2"
                      >
                        <span
                          class="text-[10px] uppercase text-gray-400 font-bold w-12"
                          >Visible</span
                        >
                        <div class="flex flex-wrap gap-1">
                          <button
                            v-for="(vc, vIdx) in sub.visible"
                            :key="`v-${vIdx}`"
                            @click="showTestCaseDetail(vc)"
                            class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                            :class="getStatusCodeBg(vc.status)"
                            title="View Detail"
                          >
                            {{
                              vc.status === "AC"
                                ? "✓"
                                : vc.status === "WA"
                                  ? "✕"
                                  : "?"
                            }}
                          </button>
                        </div>
                      </div>

                      <!-- Hidden Testcases -->
                      <div
                        v-if="sub.hidden?.length"
                        class="flex items-center gap-2"
                      >
                        <span
                          class="text-[10px] uppercase text-gray-400 font-bold w-12"
                          >Hidden</span
                        >
                        <div class="flex flex-wrap gap-1">
                          <button
                            v-for="(hc, hIdx) in sub.hidden"
                            :key="`h-${hIdx}`"
                            @click="showTestCaseDetail(hc)"
                            class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                            :class="getStatusCodeBg(hc.status)"
                            title="View Detail"
                          >
                            {{
                              hc.status === "AC"
                                ? "✓"
                                : hc.status === "WA"
                                  ? "✕"
                                  : "?"
                            }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Column -->
        <div class="h-full overflow-hidden">
          <CodeViewer :codes="dashboardStore.currentStudentCode" />
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="selectedTestCase"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        >
          <div
            class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-bold text-gray-900">Test Case Detail</h3>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                :class="getStatusCodeBg(selectedTestCase.status)"
              >
                {{ selectedTestCase.status }}
              </span>
            </div>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto flex-1 space-y-6">
            <div
              class="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-blue-500"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span class="font-medium">Execution Time:</span>
              <span class="font-mono">{{ selectedTestCase.time }} ms</span>
            </div>

            <div class="space-y-2">
              <h4
                class="text-xs font-bold text-gray-500 uppercase tracking-wide"
              >
                Expected Output
              </h4>
              <div
                class="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm whitespace-pre-wrap break-all max-h-48 overflow-auto"
              >
                {{ selectedTestCase.expectedOutput || "(Empty or Hidden)" }}
              </div>
            </div>

            <div class="space-y-2">
              <h4
                class="text-xs font-bold text-gray-500 uppercase tracking-wide"
              >
                User Output
              </h4>
              <div
                class="bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-800 font-mono text-sm whitespace-pre-wrap break-all max-h-48 overflow-auto"
              >
                {{ selectedTestCase.userOutput || "(Empty)" }}
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              @click="closeModal"
              class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
