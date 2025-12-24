<template>
  <div class="page">
    <section class="panel">
      <header class="panel-header">
        <h3>警告系統</h3>
        <div class="actions">
          <label class="switch">
            <input
              type="checkbox"
              v-model="realtimeOn"
              @change="toggleRealtime"
            />
            <span>即時更新</span>
          </label>
          <button :disabled="loadingAlerts" @click="refreshAlerts">
            {{ loadingAlerts ? "刷新中..." : "手動刷新" }}
          </button>
        </div>
      </header>

      <div v-if="alertError" class="error">{{ alertError }}</div>
      <div v-if="loadingAlerts" class="hint">載入中...</div>
      <div
        v-if="!loadingAlerts && alerts.length === 0 && !alertError"
        class="hint"
      >
        尚無警告
      </div>

      <div class="table-wrapper" v-if="!loadingAlerts && alerts.length > 0">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>學生</th>
              <th>類型</th>
              <th>時間</th>
              <th>IP</th>
              <th>Mac</th>
              <th>訊息</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alerts" :key="a.id">
              <td>{{ a.id }}</td>
              <td>{{ a.student_id }}</td>
              <td>{{ a.type }}</td>
              <td>{{ formatTime(a.time) }}</td>
              <td>{{ a.ipAddress }}</td>
              <td>{{ a.mac || "—" }}</td>
              <td class="pre">{{ a.messeage }}</td>
              <td>
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="a.isOk"
                    @change="onToggleOk(a)"
                  />
                  <span>{{ a.isOk ? "OK" : "Not OK" }}</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { io, Socket } from "socket.io-client";
import { getAlertList, modifyAlertStatus, BASE_URL } from "../utilities/api";

// 根據新的 JSON 格式定義介面
type AlertItem = {
  id: number;
  time: string;
  student_id: string; // 變更名稱
  type: string;
  ipAddress: string; // 變更名稱
  mac?: string; // 新增欄位 (API 若未回傳此欄位，會顯示為 —)
  messeage: string; // 根據 API 格式保留此拼寫
  isOk: boolean; // 變更名稱
};

const alerts = ref<AlertItem[]>([]);
const loadingAlerts = ref(false);
const alertError = ref("");
const realtimeOn = ref(true);
let socket: Socket | null = null;

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

const refreshAlerts = async () => {
  loadingAlerts.value = true;
  alertError.value = "";
  try {
    // 假設 getAlertList 回傳的資料已經符合 AlertItem[]
    const result = await getAlertList();
    if (Array.isArray(result)) {
      alerts.value = result.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    } else {
      throw new Error("回傳格式不正確");
    }
  } catch (e) {
    console.error(e);
    alertError.value = "載入失敗";
  } finally {
    loadingAlerts.value = false;
  }
};

const setupSocket = () => {
  if (socket) return;
  const url = BASE_URL.replace("/admin", "");
  socket = io(url, { transports: ["websocket"] });
  socket.on("connect", () => console.log("socket connected"));
  socket.on("disconnect", () => console.log("socket disconnected"));
  socket.on("connect_error", (err) => console.error("socket error", err));

  // Socket 回傳的格式也改變了，這裡做相應處理
  socket.on(
    "newAlert",
    (payload: { success: boolean; result: AlertItem[] | AlertItem }) => {
      if (!payload?.success || !payload.result) return;
      const incoming = Array.isArray(payload.result)
        ? payload.result
        : [payload.result];

      const map = new Map(alerts.value.map((a) => [a.id, a]));
      incoming.forEach((a) => map.set(a.id, a));

      alerts.value = Array.from(map.values()).sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    }
  );
};

const teardownSocket = () => {
  if (!socket) return;
  socket.off("newAlert");
  socket.disconnect();
  socket = null;
};

const toggleRealtime = () => {
  if (realtimeOn.value) {
    setupSocket();
  } else {
    teardownSocket();
  }
};

const onToggleOk = async (alert: AlertItem) => {
  const target = !alert.isOk;
  // 注意：modifyAlertStatus 的實作可能需要確認是否接受新的 id 類型 (number)
  const success = await modifyAlertStatus(String(alert.id), target);
  if (success) {
    alert.isOk = target;
  } else {
    alertError.value = "更新失敗";
  }
};

onMounted(async () => {
  await refreshAlerts();
  setupSocket();
});

onBeforeUnmount(() => {
  teardownSocket();
});
</script>

<style scoped>
.page {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
}
.panel {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
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
.switch {
  display: flex;
  gap: 6px;
  align-items: center;
  user-select: none;
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
