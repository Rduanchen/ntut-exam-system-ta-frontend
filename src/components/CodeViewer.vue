<template>
  <div class="code-viewer" v-if="codes">
    <div class="tabs">
      <button 
        v-for="fileName in codes.codeList" 
        :key="fileName"
        :class="['tab-btn', { active: currentFile === fileName }]"
        @click="currentFile = fileName"
      >
        <span class="file-icon">📄</span> {{ fileName }}
      </button>
    </div>

    <div class="code-scroll-area">
      <div class="code-layout">
        
        <div class="line-numbers">
          <span v-for="n in lineCount" :key="n">{{ n }}</span>
        </div>

        <div class="code-content">
          <highlightjs
            v-if="currentFile"
            language="python"
            :code="currentCodeContent"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  codes: { codeList: string[]; codeOBJ: Record<string, string> } | null
}>();

const currentFile = ref<string>('');

// 計算當前的程式碼內容
const currentCodeContent = computed(() => {
  if (!props.codes || !currentFile.value) return '';
  return props.codes.codeOBJ[currentFile.value] || '';
});

// 計算總行數 (透過換行符號分割)
const lineCount = computed(() => {
  if (!currentCodeContent.value) return 0;
  return currentCodeContent.value.split('\n').length;
});

// 當切換學生或資料更新時，自動選中第一個檔案
watch(() => props.codes, (newCodes) => {
  let len = Object.keys(newCodes?.codeOBJ || {}).length;
  if (newCodes && len > 0) {
    currentFile.value = newCodes.codeList[0] || '';
  } else {
    currentFile.value = '';
  }
}, { immediate: true });
</script>

<style scoped>
/* 共用變數：確保行號與程式碼對齊的關鍵 */
.code-viewer {
  --code-font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  --code-font-size: 14px;
  --code-line-height: 1.6;
  --code-padding-y: 20px; /* 上下內距 */
}

.code-viewer {
  display: flex;
  flex-direction: column;
  height: 100%; /* 關鍵：填滿父容器高度 */
  width: 100%;
  background: #282c34;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
  background: #21252b;
  border-bottom: 1px solid #181a1f;
  overflow-x: auto;
  flex-shrink: 0; /* 防止頁籤被壓縮 */
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #9da5b4;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  font-size: 13px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn.active {
  background: #282c34;
  color: #fff;
}

/* 滾動區域：佔滿剩餘空間 */
.code-scroll-area {
  flex: 1; /* 關鍵：讓它佔滿剩餘高度 */
  overflow: auto; /* 同時處理水平與垂直滾動 */
  position: relative;
}

/* 佈局容器：讓行號與程式碼並排 */
.code-layout {
  display: flex;
  min-width: 100%; /* 確保內容至少填滿寬度 */
  width: fit-content; /* 內容過長時自動撐開 */
  min-height: 100%; /* 確保背景色填滿高度 */
}

/* 行號欄位樣式 */
.line-numbers {
  display: flex;
  flex-direction: column;
  padding: var(--code-padding-y) 10px; /* 上下 padding 必須與 code 一致 */
  background: #21252b;
  color: #636d83;
  text-align: right;
  border-right: 1px solid #3e4451;
  user-select: none; /* 防止複製程式碼時選到行號 */
  flex-shrink: 0; /* 防止被壓縮 */
  
  /* 字體設定必須與程式碼完全一致 */
  font-family: var(--code-font-family);
  font-size: var(--code-font-size);
  line-height: var(--code-line-height);
}

/* 程式碼區塊 */
.code-content {
  flex-grow: 1;
}

/* 覆蓋 highlightjs 樣式 */
:deep(.hljs) {
  margin: 0;
  padding: var(--code-padding-y) 20px !important; /* 強制覆蓋 padding */
  background: transparent;
  font-family: var(--code-font-family);
  font-size: var(--code-font-size);
  line-height: var(--code-line-height);
  white-space: pre; 
  overflow: visible; /* 滾動交給外層 parent */
}

:deep(pre), :deep(code) {
  margin: 0;
  padding: 0;
  background: transparent;
}
</style>