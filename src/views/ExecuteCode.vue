<template>
  <div class="page">
    <h2>程式執行與提交查詢</h2>

    <!-- 已提交學生列表 -->
    <section class="card">
      <div class="card-header">
        <h3>已提交學生</h3>
        <button :disabled="loadingSubmitted" @click="fetchSubmitted">
          {{ loadingSubmitted ? "刷新中..." : "重新整理" }}
        </button>
      </div>
      <div v-if="!loadingSubmitted && submitted.length === 0" class="hint">
        目前沒有資料
      </div>
      <ul v-else class="list">
        <li v-for="id in submitted" :key="id">{{ id }}</li>
      </ul>
    </section>

    <!-- 執行程式 -->
    <section class="card">
      <h3>輸入學號執行程式</h3>
      <div class="input-row">
        <input
          v-model="studentID"
          placeholder="學號"
          @keyup.enter="handleExecute"
        />
        <button :disabled="execLoading" @click="handleExecute">
          {{ execLoading ? "執行中..." : "執行" }}
        </button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>

      <!-- 執行結果 -->
      <div v-if="execResult" class="result">
        <h4>執行結果</h4>
        <div
          v-for="prob in execResult.result"
          :key="prob.problemID"
          class="problem-block"
        >
          <strong>題目 {{ prob.problemID }}</strong>
          <table class="result-table">
            <thead>
              <tr>
                <th>測資ID</th>
                <th>成功</th>
                <th>訊息</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in prob.results" :key="r.testCaseID">
                <td>{{ r.testCaseID }}</td>
                <td>{{ r.success ? "✅" : "❌" }}</td>
                <td class="msg">{{ r.messeage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { executeCode, getSubmittedStudents } from "../utilities/api"; // TODO: 改成你的實際路徑

type TestResult = {
  testCaseID: string;
  success: boolean;
  messeage: string; // 後端字段就是 messeage（typo），保持一致
};

type ProblemResult = {
  problemID: string;
  results: TestResult[];
};

const studentID = ref("");
const submitted = ref<string[]>([]);
const loadingSubmitted = ref(false);
const execLoading = ref(false);
const execResult = ref<ProblemResult[] | null>(null);
const error = ref("");

const fetchSubmitted = async () => {
  loadingSubmitted.value = true;
  error.value = "";
  try {
    const studentIDs = await getSubmittedStudents();
    submitted.value = studentIDs;
  } catch (e) {
    error.value = "取得已提交學生失敗";
  } finally {
    loadingSubmitted.value = false;
  }
};

const handleExecute = async () => {
  if (!studentID.value.trim()) {
    error.value = "請輸入學號";
    return;
  }
  execLoading.value = true;
  error.value = "";
  execResult.value = null;
  try {
    const data = await executeCode(studentID.value.trim());
    execResult.value = data;
  } catch (e) {
    error.value = "執行程式失敗";
  } finally {
    execLoading.value = false;
  }
};

onMounted(() => {
  fetchSubmitted();
});
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.input-row {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.input-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.input-row button {
  padding: 8px 14px;
}
.list {
  margin: 8px 0 0;
  padding-left: 18px;
}
.error {
  color: #d93025;
  margin-bottom: 8px;
}
.result {
  margin-top: 12px;
}
.problem-block {
  margin-top: 10px;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
}
.result-table th,
.result-table td {
  border-bottom: 1px solid #eee;
  text-align: left;
  padding: 6px 4px;
}
.msg {
  white-space: pre-wrap;
}
</style>
