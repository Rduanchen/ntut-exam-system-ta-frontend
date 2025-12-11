<template>
  <div class="page">
    <header class="header">
      <h3>所有學生 Log</h3>
      <div class="actions">
        <input
          v-model="keyword"
          placeholder="輸入學號篩選（留空顯示全部）"
          @keyup.enter="fetchAll"
        />
        <button :disabled="loading" @click="fetchAll">
          {{ loading ? "載入中..." : "手動刷新" }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="hint">載入中...</div>
    <div v-if="!loading && filtered.length === 0 && !error" class="hint">尚無資料</div>

    <div class="table-wrapper" v-if="!loading && filtered.length > 0">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>時間</th>
            <th>學生</th>
            <th>IP</th>
            <th>類型</th>
            <th>內容</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filtered" :key="log.id">
            <td>{{ log.id }}</td>
            <td>{{ formatTime(log.timestamp) }}</td>
            <td>{{ log.student_ID || "—" }}</td>
            <td>{{ log.ip_address }}</td>
            <td>{{ log.action_type }}</td>
            <td class="pre">{{ log.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getAllLogs } from "../utilities/api";

type StudentLog = {
  id: number;
  timestamp: string;
  student_ID: string;
  ip_address: string;
  action_type: string;
  details: string;
};

const logs = ref<StudentLog[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");

const formatTime = (iso: string | null | undefined) => {
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

const fetchAll = async () => {
  loading.value = true;
  error.value = "";
  try {
    const result = await getAllLogs();
    if (Array.isArray(result)) {
      logs.value = result;
    } else {
      throw new Error("回傳格式不正確");
    }
  } catch (e) {
    console.error(e);
    error.value = "載入失敗";
  } finally {
    loading.value = false;
  }
};

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return logs.value;
  return logs.value.filter((r) => (r.student_ID || "").toLowerCase().includes(kw));
});

onMounted(fetchAll);
</script>

<style scoped>
.page {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 200px;
}
button {
  padding: 6px 10px;
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
  border-radius: 6px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  border: 1px solid #e6e6e6;
  padding: 6px 8px;
  text-align: left;
  white-space: nowrap;
}
th {
  background: #f7f7f7;
}
.pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>