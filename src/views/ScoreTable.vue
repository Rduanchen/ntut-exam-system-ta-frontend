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
            <th>題組數</th>
            <th>通過子題數</th>
            <th v-for="col in puzzleColumns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in filtered" :key="rec.id">
            <td>{{ rec.student_ID }}</td>
            <td>{{ rec.student_name }}</td>
            <td>{{ formatTime(rec.last_submit_time) }}</td>
            <td>{{ rec.puzzle_amount }}</td>
            <td>{{ rec.passed_puzzle_amount }}</td>
            <td v-for="col in puzzleColumns" :key="col">
              {{ formatBool(rec.puzzle_results[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { io, Socket } from "socket.io-client";
import { getAllStudentsScores, BASE_URL } from "../utilities/api"; // ← 路徑依需求調整

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

const records = ref<StudentRecord[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");

const tableRef = ref<HTMLTableElement | null>(null);
let socket: Socket | null = null;

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
  // 根據你的後端設定替換 URL，例如：const url = import.meta.env.VITE_SOCKET_URL;
  const url = BASE_URL.replace("/admin", ""); // 預設同源，可依需求調整
  socket = io(url, {
    transports: ["websocket"], // 可依需求調整
  });

  socket.on("connect", () => {
    console.log("socket connected");
  });

  socket.on("scoreUpdate", (payload: ScoresPayload) => {
    console.log("收到 scoreUpdate 事件", payload);
    try {
      applyData(payload);
    } catch (err) {
      console.error("scoreUpdate payload 格式錯誤", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("socket connect_error", err);
  });
};

onMounted(async () => {
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

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return records.value;
  return records.value.filter(
    (r) =>
      r.student_ID.toLowerCase().includes(kw) ||
      r.student_name.toLowerCase().includes(kw)
  );
});

const puzzleColumns = computed(() => {
  const set = new Set<string>();
  filtered.value.forEach((r) => {
    Object.keys(r.puzzle_results || {}).forEach((k) => set.add(k));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-Hant"));
});

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
  // 以 TSV 匯出，方便直接貼到 Excel
  const baseCols = ["學生編號", "姓名", "最後提交時間", "題組數", "通過子題數"];
  const cols = [...baseCols, ...puzzleColumns.value];

  const lines = filtered.value.map((r) => {
    const base = [
      r.student_ID,
      r.student_name,
      formatTime(r.last_submit_time),
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
</style>