<template>
  <div class="page">
    <header class="header">
      <h3>所有學生 Log</h3>
      <!-- 修正: 拆分為三個篩選區塊 -->
      <div class="filters">
        <div class="filter-group">
          <label>學號:</label>
          <input
            v-model="filterStudentId"
            placeholder="篩選學號..."
            @keyup.enter="fetchAll"
          />
        </div>
        <div class="filter-group">
          <label>IP / Mac:</label>
          <input
            v-model="filterNet"
            placeholder="篩選 IP 或 Mac..."
            @keyup.enter="fetchAll"
          />
        </div>
        <div class="filter-group">
          <label>內容 / 類型:</label>
          <input
            v-model="filterContent"
            placeholder="篩選內容或類型..."
            @keyup.enter="fetchAll"
          />
        </div>
        <button :disabled="loading" @click="fetchAll">
          {{ loading ? "載入中..." : "手動刷新" }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="hint">載入中...</div>
    <div v-if="!loading && filtered.length === 0 && !error" class="hint">
      尚無資料
    </div>
    <div class="table-wrapper" v-if="!loading && filtered.length > 0">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>時間</th>
            <th>學生</th>
            <th>IP</th>
            <!-- 新增 Mac 欄位 -->
            <th>Mac</th>
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
            <!-- 新增顯示 Mac Address -->
            <td>{{ log.mac_address || "—" }}</td>
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

// 修正: 更新型別定義，加入 mac_address
type StudentLog = {
  id: number;
  timestamp: string;
  student_ID: string;
  ip_address: string;
  mac_address?: string; // 新增欄位 (標記為可選，以防舊資料沒有)
  action_type: string;
  details: string;
};

const logs = ref<StudentLog[]>([]);
const loading = ref(false);
const error = ref("");

// 修正: 拆分三個篩選變數
const filterStudentId = ref("");
const filterNet = ref("");
const filterContent = ref("");

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
      // 這裡可以預設做時間排序
      logs.value = result.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
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

// 修正: 更新篩選邏輯，同時滿足三個條件
const filtered = computed(() => {
  const kwId = filterStudentId.value.trim().toLowerCase();
  const kwNet = filterNet.value.trim().toLowerCase();
  const kwContent = filterContent.value.trim().toLowerCase();

  return logs.value.filter((r) => {
    // 1. 篩選學號
    const matchId = !kwId || (r.student_ID || "").toLowerCase().includes(kwId);

    // 2. 篩選 IP 或 Mac
    const matchNet =
      !kwNet ||
      (r.ip_address || "").toLowerCase().includes(kwNet) ||
      (r.mac_address || "").toLowerCase().includes(kwNet);

    // 3. 篩選 內容 或 類型
    const matchContent =
      !kwContent ||
      (r.action_type || "").toLowerCase().includes(kwContent) ||
      (r.details || "").toLowerCase().includes(kwContent);

    return matchId && matchNet && matchContent;
  });
});

onMounted(fetchAll);
</script>

<style scoped>
.page {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
}
.header {
  display: flex;
  flex-direction: column; /* 改為垂直排列標題與篩選器 */
  gap: 10px;
  margin-bottom: 16px;
}
.filters {
  display: flex;
  gap: 12px;
  align-items: flex-end; /* 對齊底部讓按鈕跟輸入框水平一致 */
  flex-wrap: wrap;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #eee;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 150px;
}
button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  height: 30px; /* 確保與 input 高度接近 */
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
  max-width: 400px; /* 限制內容寬度避免撐開表格 */
}
</style>
