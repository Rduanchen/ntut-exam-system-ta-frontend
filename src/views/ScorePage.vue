<template>
  <div class="page">
    <header class="header">
      <h2>學生解題成績總覽</h2>
      <button :disabled="loading" @click="fetchData">
        {{ loading ? "載入中..." : "重新整理" }}
      </button>
    </header>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loading" class="hint">資料載入中...</div>

    <div v-if="!loading && records.length === 0 && !error" class="hint">
      目前沒有資料
    </div>

    <div v-if="!loading && records.length > 0" class="list">
      <div v-for="rec in records" :key="rec.id" class="card">
        <div class="card-top">
          <div>
            <div class="name">
              {{ rec.student_name }} ({{ rec.student_ID }})
            </div>
            <div class="meta">
              題組數：{{ rec.puzzle_amount }}； 通過子題數：{{
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
              <strong>題組 {{ puzzleNo }}</strong>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAllStudentsScores } from "../utilities/api"; // 請依實際路徑調整

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

const records = ref<StudentRecord[]>([]);
const loading = ref(false);
const error = ref("");

const fetchData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getAllStudentsScores();
    if (res?.success && Array.isArray(res.result)) {
      records.value = res.result;
    } else {
      throw new Error("回傳格式不正確");
    }
  } catch (e) {
    console.error(e);
    error.value = "載入失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

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
    ? `通過 ${rec.passed_puzzle_amount} 題`
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
</style>
