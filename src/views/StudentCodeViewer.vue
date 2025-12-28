<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Submissions</h2>
        <span class="count-badge">{{ students.length }} Students</span>
      </div>
      
      <div class="sidebar-scroll">
        <ul class="student-list">
          <li 
            v-for="id in students" 
            :key="id" 
            :class="{ active: searchID === id }"
            @click="selectStudent(id)"
          >
            <div class="avatar">{{ id.charAt(0).toUpperCase() }}</div>
            <span class="student-id">{{ id }}</span>
          </li>
        </ul>
      </div>
    </aside>

    <main class="main-content">
      <div class="top-nav">
        <div class="search-box">
          <input 
            v-model="searchID" 
            placeholder="Search Student ID..." 
            @keyup.enter="fetchCode"
          />
          <button class="primary-btn" :disabled="loadingCode" @click="fetchCode">
            {{ loadingCode ? 'Searching...' : 'Fetch Code' }}
          </button>
        </div>
      </div>

      <div class="workspace">
        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
        
        <div v-if="studentData" class="code-container">
          <CodeViewer :codes="studentData" />
        </div>
        
        <div v-else-if="! loadingCode" class="empty-placeholder">
          <div class="icon">🔍</div>
          <p>Select a student from the left or enter an ID to review code</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSubmittedStudents, getStudentCodes } from '../utilities/api';
import CodeViewer from '../components/CodeViewer.vue';

const students = ref<string[]>([]);
const searchID = ref('');
const studentData = ref<any>(null);

const loadingList = ref(false);
const loadingCode = ref(false);
const errorMsg = ref('');

// 取得名單
const fetchList = async () => {
  loadingList.value = true;
  students.value = await getSubmittedStudents();
  loadingList.value = false;
};

// 取得特定學生程式碼
const fetchCode = async () => {
  if (! searchID.value) return;
  
  loadingCode. value = true;
  errorMsg.value = '';
  studentData.value = null;

  try {
    const result = await getStudentCodes(searchID.value);
    if (result) {
      studentData.value = result;
    } else {
      errorMsg.value = "Student not found or failed to fetch codes. ";
    }
  } catch (err) {
    errorMsg.value = "An error occurred while fetching codes.";
  } finally {
    loadingCode.value = false;
  }
};

const selectStudent = (id: string) => {
  searchID. value = id;
  fetchCode();
};

onMounted(fetchList);
</script>

<style scoped>
/* 鎖定全螢幕，不讓整個頁面滾動 */
.admin-layout {
  display: flex;
  width: 90vw;
  height: 80vh;
  overflow: hidden;
  background-color: #f8fafc;
  color: #1e293b;
  box-sizing: border-box;
}

/* 側邊欄佈局 - 30% 寬度 */
.sidebar {
  width:  30%;
  min-width: 200px;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  background:  white;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-header h2 {
  margin: 0 0 8px 0;
  font-size:  18px;
}

.count-badge {
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  color: #64748b;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto; /* 只有名單會滾動 */
}

.student-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.student-list li {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap:  12px;
  cursor: pointer;
  transition: all 0.2s;
}

.student-list li:hover {
  background:  #f8fafc;
}

.student-list li.active {
  background:  #eff6ff;
  border-left: 4px solid #2563eb;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size:  12px;
  font-weight: bold;
  flex-shrink: 0;
}

.student-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主內容佈局 - 70% 寬度 */
.main-content {
  flex:  1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 關鍵：允許 flex item 收縮到小於內容寬度 */
  overflow: hidden; /* 防止內容溢出 */
}

.top-nav {
  height: 72px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  background:  white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.search-box {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  border-radius:  8px;
  outline: none;
  min-width: 0; /* 允許 input 收縮 */
}

input:focus {
  border-color: #2563eb;
  box-shadow:  0 0 0 2px rgba(37, 99, 235, 0.1);
}

.workspace {
  flex:  1;
  padding: 24px;
  overflow:  hidden; /* 核心：Workspace 不滾動 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 關鍵：允許 flex 子元素正確計算高度 */
}

.code-container {
  flex: 1;
  min-height: 0; /* 核心：這讓內部的 code-viewer 可以滾動 */
  min-width: 0; /* 關鍵：允許內容收縮 */
  overflow: hidden;
}

.empty-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.primary-btn {
  background: #2563eb;
  color:  white;
  border: none;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor:  pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}
</style>