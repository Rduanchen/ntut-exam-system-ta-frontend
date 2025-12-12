<template>
  <div class="page">
    <header class="header">
      <h2>學生答題總覽</h2>
      <div class="actions">
        <button :disabled="loading" @click="fetchData">
          {{ loading ? "載入中..." : "重新整理" }}
        </button>
        <button :disabled="loading" @click="openFormulaModal">公式</button>
      </div>
    </header>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loading" class="hint">資料載入中...</div>

    <div v-if="!loading && records.length === 0 && !error" class="hint">
      目前沒有資料
    </div>

    <div v-if="!loading && records.length > 0" class="list">
      <div
        v-for="rec in records"
        :key="rec.id"
        class="card"
        :class="{ selected: rec.id === selectedId }"
        @click="selectCard(rec.id)"
      >
        <div class="card-top">
          <div>
            <div class="name">
              {{ rec.student_name }} ({{ rec.student_ID }})
            </div>
            <div class="meta">
              題目數：{{ rec.puzzle_amount }}； 通過測資數：{{
                rec.passed_puzzle_amount
              }}
            </div>
            <div class="meta">
              最後提交：
              <span v-if="rec.last_submit_time">{{
                formatTime(rec.last_submit_time)
              }}</span>
              <span v-else>未提交</span>
            </div>
            <div class="meta">
              公式輸出：
              <span class="formula-out">{{
                formulaOutputs[rec.id] ?? ""
              }}</span>
            </div>
          </div>
          <div class="status-chip" :class="overallClass(rec)">
            總覽：{{ overallText(rec) }}
          </div>
        </div>

        <div class="puzzles">
          <div
            v-for="puzzleNo in puzzleNumbers(rec)"
            :key="puzzleNo"
            class="puzzle-block"
          >
            <div class="puzzle-header">
              <strong>題目 {{ puzzleNo }}</strong>
              <span
                class="badge"
                :class="
                  rec.puzzle_results[`puzzle${puzzleNo}_status`] ? 'ok' : 'fail'
                "
              >
                {{
                  rec.puzzle_results[`puzzle${puzzleNo}_status`]
                    ? "已通過"
                    : "未通過"
                }}
              </span>
            </div>

            <div class="subcases">
              <div
                v-for="sub in puzzleSubcases(rec, puzzleNo)"
                :key="sub.key"
                class="chip"
                :class="sub.value ? 'ok' : 'fail'"
                :title="sub.key"
              >
                {{ sub.key.replace(`puzzle${puzzleNo}-`, "") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公式編輯彈窗 -->
    <div
      v-if="showFormulaModal"
      class="modal-backdrop"
      @click.self="closeFormulaModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>編輯公式（JS）</h3>
          <button class="close" @click="closeFormulaModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="tip">
            輸入 JS 程式碼，系統會包成
            <code>function(record) { /* 你的程式 */ }</code>。 請在程式碼中
            <strong>return 數值或字串</strong>；<code>record</code>
            為當前學生物件。
          </p>
          <textarea
            v-model="formulaCode"
            rows="10"
            spellcheck="false"
          ></textarea>
          <div v-if="formulaError" class="error">{{ formulaError }}</div>
        </div>
        <div class="modal-footer">
          <button @click="applyFormula">套用</button>
          <button @click="closeFormulaModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { io, Socket } from "socket.io-client";
import { getAllStudentsScores, BASE_URL } from "../utilities/api";

type PuzzleResults = Record<string, boolean>;
type StudentRecord = {
  id: number;
  student_ID: string;
  student_name: string;
  last_submit_time: string | null;
  puzzle_amount: number;
  passed_puzzle_amount: number;
  puzzle_results: PuzzleResults;
};

type ScoresPayload = { success: boolean; result: StudentRecord[] };

const LOCAL_STORAGE_KEY = "overview_formula_code_v1";

const records = ref<StudentRecord[]>([]);
const loading = ref(false);
const error = ref("");

const showFormulaModal = ref(false);
const formulaCode = ref<string>(
  `// 你可以使用變數 record（當前學生資料）\n// 請務必 return 數值或字串\nreturn record.student_name + " / " + record.passed_puzzle_amount;`
);
const formulaError = ref("");
const formulaFn = ref<(r: StudentRecord) => unknown>(() => "");
const selectedId = ref<number | null>(null);

let socket: Socket | null = null;

const selectCard = (id: number) => {
  selectedId.value = id;
};

const applyData = (res: ScoresPayload) => {
  if (res?.success && Array.isArray(res.result)) {
    records.value = res.result;
  } else {
    throw new Error("回傳格式不正確");
  }
};

const fetchData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getAllStudentsScores();
    console.log("Fetched scores:", res);
    applyData(res as ScoresPayload);
  } catch (e) {
    console.error(e);
    error.value = "載入失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
};

const setupSocket = () => {
  const url = BASE_URL.replace("/admin", "");
  socket = io(url, { transports: ["websocket"] });

  socket.on("connect", () => console.log("socket connected"));
  socket.on("scoreUpdate", (payload: ScoresPayload) => {
    try {
      applyData(payload);
    } catch (err) {
      console.error("scoreUpdate payload 格式錯誤", err);
    }
  });
  socket.on("disconnect", () => console.log("socket disconnected"));
  socket.on("connect_error", (err) =>
    console.error("socket connect_error", err)
  );
};

onMounted(async () => {
  // 讀取儲存的公式
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    formulaCode.value = saved;
    try {
      const fn = new Function("record", saved) as (r: StudentRecord) => unknown;
      formulaFn.value = fn;
    } catch (err) {
      console.error("載入儲存公式錯誤", err);
      formulaError.value = "儲存的公式有誤，請重新編輯";
    }
  }

  await fetchData();
  setupSocket();
});

onBeforeUnmount(() => {
  if (socket) {
    socket.off("scoreUpdate");
    socket.disconnect();
    socket = null;
  }
});

/** 公式輸出：若公式出錯，顯示 "error" */
const formulaOutputs = computed<Record<number, string>>(() => {
  const out: Record<number, string> = {};
  records.value.forEach((rec) => {
    try {
      const v = formulaFn.value(rec);
      out[rec.id] = v === undefined ? "" : String(v);
    } catch (err) {
      out[rec.id] = "error";
      console.error("公式執行錯誤", err);
    }
  });
  return out;
});

const openFormulaModal = () => {
  formulaError.value = "";
  showFormulaModal.value = true;
};
const closeFormulaModal = () => {
  showFormulaModal.value = false;
  formulaError.value = "";
};

const applyFormula = () => {
  try {
    const fn = new Function("record", formulaCode.value) as (
      r: StudentRecord
    ) => unknown;
    // 試跑一次避免語法錯誤
    fn({} as StudentRecord);
    formulaFn.value = fn;
    localStorage.setItem(LOCAL_STORAGE_KEY, formulaCode.value);
    formulaError.value = "";
    showFormulaModal.value = false;
  } catch (err: any) {
    console.error(err);
    formulaError.value = err?.message || "公式有誤，請檢查程式碼";
  }
};

const formatTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const puzzleNumbers = (rec: StudentRecord) => {
  const set = new Set<number>();
  Object.keys(rec.puzzle_results).forEach((k) => {
    const m = k.match(/^puzzle(\d+)_status/);
    if (m) set.add(Number(m[1]));
  });
  return Array.from(set).sort((a, b) => a - b);
};

const puzzleSubcases = (rec: StudentRecord, puzzleNo: number) => {
  return Object.entries(rec.puzzle_results)
    .filter(([k]) => k.startsWith(`puzzle${puzzleNo}-`))
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key, "zh-Hant"));
};

const overallText = (rec: StudentRecord) => {
  return rec.passed_puzzle_amount > 0
    ? `通過 ${rec.passed_puzzle_amount} 筆測資`
    : "尚未通過";
};

const overallClass = (rec: StudentRecord) => {
  return rec.passed_puzzle_amount > 0 ? "ok" : "fail";
};
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #d93025;
  margin-bottom: 12px;
}
.hint {
  color: #555;
  margin: 8px 0;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(0 0 0 / 4%);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.card.selected {
  background: #e7f1ff;
  border-color: #bcd4ff;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.name {
  font-size: 1.1rem;
  font-weight: 600;
}
.meta {
  color: #666;
  margin-top: 2px;
}
.formula-out {
  color: #0b7285;
  font-weight: 600;
}
.status-chip {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.9rem;
  border: 1px solid transparent;
}
.status-chip.ok {
  background: #e6f4ea;
  color: #0f9d58;
  border-color: #c7e9d3;
}
.status-chip.fail {
  background: #fdecea;
  color: #d93025;
  border-color: #f6c7c1;
}
.puzzles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}
.puzzle-block {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px;
  background: #fafafa;
}
.puzzle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.85rem;
}
.badge.ok {
  background: #e6f4ea;
  color: #0f9d58;
}
.badge.fail {
  background: #fdecea;
  color: #d93025;
}
.subcases {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid transparent;
}
.chip.ok {
  background: #e6f4ea;
  color: #0f9d58;
  border-color: #c7e9d3;
}
.chip.fail {
  background: #fdecea;
  color: #d93025;
  border-color: #f6c7c1;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 8px;
  width: min(720px, 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.modal-body {
  padding: 12px 16px;
  overflow: auto;
}
.modal-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #eee;
}
.modal .close {
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}
.modal textarea {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo,
    monospace;
  resize: vertical;
}
.tip {
  margin-bottom: 8px;
  color: #444;
  font-size: 13px;
}
</style>
