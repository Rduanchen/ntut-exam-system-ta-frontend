<template>
  <div class="page">
    <header class="header">
      <h2>學生解題成績查詢（可複製到 Excel）</h2>
      <div class="actions">
        <input
          v-model="keyword"
          placeholder="輸入學號或姓名搜尋"
          @keyup.enter="fetchData"
        />
        <button :disabled="loading" @click="fetchData">
          {{ loading ? "載入中..." : "重新整理" }}
        </button>
        <button :disabled="loading || filtered.length === 0" @click="copyTable">
          複製表格（TSV）
        </button>
        <button :disabled="loading" @click="openFormulaModal">公式</button>
      </div>
    </header>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="hint">資料載入中...</div>
    <div v-if="!loading && filtered.length === 0 && !error" class="hint">
      找不到符合的資料
    </div>

    <div class="table-wrapper" v-if="!loading && filtered.length > 0">
      <table ref="tableRef">
        <thead>
          <tr>
            <th>學生編號</th>
            <th>姓名</th>
            <th>最後提交時間</th>
            <th>公式輸出</th>
            <th>題組數</th>
            <th>通過子題數</th>
            <th v-for="col in puzzleColumns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rec in filtered"
            :key="rec.id"
            :class="{ selected: rec.id === selectedRowId }"
            @click="selectRow(rec.id)"
          >
            <td>{{ rec.student_ID }}</td>
            <td>{{ rec.student_name }}</td>
            <td>{{ formatTime(rec.last_submit_time) }}</td>
            <td class="formula-cell">{{ formulaOutputs[rec.id] ?? "" }}</td>
            <td>{{ rec.puzzle_amount }}</td>
            <td>{{ rec.passed_puzzle_amount }}</td>
            <td v-for="col in puzzleColumns" :key="col">
              {{ formatBool(rec.puzzle_results[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
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
            為當前列的學生物件。
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
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

const LOCAL_STORAGE_KEY = "scores_formula_code_v1";

const records = ref<StudentRecord[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");

const tableRef = ref<HTMLTableElement | null>(null);
let socket: Socket | null = null;

/** row 選取 */
const selectedRowId = ref<number | null>(null);
const selectRow = (id: number) => {
  selectedRowId.value = id;
};

/** 公式相關狀態 */
const showFormulaModal = ref(false);
const formulaCode = ref<string>(
  `// 你可以使用變數 record（當前列資料）\n// 請務必 return 數值或字串\nreturn record.student_name + " / " + record.passed_puzzle_amount;`
);
const formulaError = ref("");
const formulaFn = ref<(r: StudentRecord) => unknown>(() => "");

/** 套用資料 */
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

/** 初始載入資料與公式 */
onMounted(async () => {
  // 載入 localStorage 的公式
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

/** 篩選 */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return records.value;
  return records.value.filter(
    (r) =>
      r.student_ID.toLowerCase().includes(kw) ||
      r.student_name.toLowerCase().includes(kw)
  );
});

/** 動態題組欄 */
const puzzleColumns = computed(() => {
  const set = new Set<string>();
  filtered.value.forEach((r) => {
    Object.keys(r.puzzle_results || {}).forEach((k) => set.add(k));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
});

/** 公式輸出：計算每列顯示值；若出錯輸出 "error" */
const formulaOutputs = computed<Record<number, string>>(() => {
  const out: Record<number, string> = {};
  filtered.value.forEach((rec) => {
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

/** 彈窗控制 */
const openFormulaModal = () => {
  formulaError.value = "";
  showFormulaModal.value = true;
};
const closeFormulaModal = () => {
  showFormulaModal.value = false;
  formulaError.value = "";
};

/** 套用公式：將使用者程式碼包成 function(record) {...} 並存入 localStorage */
const applyFormula = () => {
  try {
    const fn = new Function("record", formulaCode.value) as (
      r: StudentRecord
    ) => unknown;
    // 先試跑一次避免語法錯誤
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

/** 工具函式 */
const formatTime = (iso: string | null) => {
  if (!iso) return "—";
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

const formatBool = (v: boolean | undefined) => {
  if (v === true) return "TRUE";
  if (v === false) return "FALSE";
  return "";
};

const copyTable = async () => {
  const baseCols = [
    "學生編號",
    "姓名",
    "最後提交時間",
    "公式輸出",
    "題組數",
    "通過子題數",
  ];
  const cols = [...baseCols, ...puzzleColumns.value];

  const lines = filtered.value.map((r) => {
    const base = [
      r.student_ID,
      r.student_name,
      formatTime(r.last_submit_time),
      formulaOutputs.value[r.id] ?? "",
      String(r.puzzle_amount),
      String(r.passed_puzzle_amount),
    ];
    const puzzles = puzzleColumns.value.map((c) =>
      formatBool(r.puzzle_results?.[c])
    );
    return [...base, ...puzzles].join("\t");
  });

  const tsv = [cols.join("\t"), ...lines].join("\n");

  try {
    await navigator.clipboard.writeText(tsv);
    alert("已複製表格（TSV），可直接貼到 Excel");
  } catch (err) {
    console.error(err);
    alert("複製失敗，請確認瀏覽器權限或手動複製");
  }
};
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
}
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 220px;
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
  margin-bottom: 8px;
}
.hint {
  color: #555;
  margin: 8px 0;
}
.table-wrapper {
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  border: 1px solid #e6e6e6;
  padding: 8px 10px;
  text-align: left;
  white-space: nowrap;
}
th {
  background: #f7f7f7;
}
.formula-cell {
  color: #0b7285;
  font-weight: 600;
}

/* row select */
tbody tr.selected {
  background: #e7f1ff;
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
