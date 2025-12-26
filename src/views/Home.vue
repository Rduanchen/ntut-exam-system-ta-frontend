<template>
  <div class="page">
    <header class="header">
      <h1>Service Setup</h1>
      <button :disabled="loadingCheck" @click="checkStatus">
        {{ loadingCheck ? "Checking..." : "Check Status" }}
      </button>
      <span class="status-pill" :class="isConfigured ? 'ok' : 'not-ok'">
        {{
          isConfigured === null
            ? "Unknown"
            : isConfigured
            ? "Configured"
            : "Not Configured"
        }}
      </span>
    </header>

    <section class="card">
      <h2>Initialize (upload JSON)</h2>
      <input
        type="file"
        accept=".json,application/json"
        @change="onFileChange"
      />
      <div class="file-info" v-if="fileName">Selected: {{ fileName }}</div>
      <div class="error" v-if="parseError">Parse error: {{ parseError }}</div>
      <pre v-if="preview" class="preview">{{ preview }}</pre>
      <button :disabled="!initPayload || loadingInit" @click="submitInit">
        {{ loadingInit ? "Submitting..." : "Submit Init" }}
      </button>
    </section>

    <section class="card">
      <h2>Reset Database</h2>
      <button :disabled="loadingResetDatabase" @click="runResetDatabase">
        {{ loadingResetDatabase ? "Resetting..." : "Reset Database Service" }}
      </button>
    </section>

    <section class="log" v-if="message">
      <strong>Message:</strong> {{ message }}
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  initService,
  isConfigured as apiIsConfigured,
  resetDatabaseService as resetDatabaseService,
} from "../utilities/api";

const isConfigured = ref<boolean | null>(null);
const initPayload = ref<object | null>(null);
const preview = ref<string>("");
const fileName = ref<string>("");
const parseError = ref<string>("");
const message = ref<string>("");

const loadingCheck = ref(false);
const loadingInit = ref(false);
const loadingResetDatabase = ref(false);

const checkStatus = async () => {
  loadingCheck.value = true;
  message.value = "";
  try {
    const result = await apiIsConfigured();
    console.log("Configuration status:", result);
    isConfigured.value = result;
    message.value = `Status: ${result ? "configured" : "not configured"}`;
  } catch (err) {
    console.error(err);
    message.value = "Failed to check status";
  } finally {
    loadingCheck.value = false;
  }
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }
  const file = input.files[0];
  fileName.value = file.name;
  parseError.value = "";
  message.value = "";

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    initPayload.value = json;
    preview.value = JSON.stringify(json, null, 2);
  } catch (err: any) {
    initPayload.value = null;
    preview.value = "";
    parseError.value = err?.message ?? "Invalid JSON";
  }
};

const submitInit = async () => {
  if (!initPayload.value) return;
  loadingInit.value = true;
  message.value = "";
  try {
    const ok = await initService(initPayload.value);
    message.value = ok ? "Initialization succeeded" : "Initialization failed";
    if (ok) {
      await checkStatus();
    }
  } catch (err) {
    console.error(err);
    message.value = "Initialization error";
  } finally {
    loadingInit.value = false;
  }
};

const runResetDatabase = async () => {
  loadingResetDatabase.value = true;
  const result = confirm(
    "Are you sure you want to reset the database? This action cannot be undone."
  );
  if (!result) {
    loadingResetDatabase.value = false;
    return;
  }
  message.value = "";
  try {
    const ok = await resetDatabaseService();
    message.value = ok ? "Database reset succeeded" : "Database reset failed";
    if (ok) {
      await checkStatus();
    }
  } catch (err) {
    console.error(err);
    message.value = "Database reset error";
  } finally {
    loadingResetDatabase.value = false;
  }
};

// Optional: check status on load
checkStatus();
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
}
.status-pill.ok {
  background: #16a34a;
}
.status-pill.not-ok {
  background: #dc2626;
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
}
button {
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: #2563eb;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  transition: background 0.15s;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.file-info {
  margin-top: 8px;
  color: #374151;
}
.error {
  margin-top: 8px;
  color: #dc2626;
}
.preview {
  margin-top: 12px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  max-height: 240px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.log {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #eef2ff;
  color: #312e81;
}
</style>
