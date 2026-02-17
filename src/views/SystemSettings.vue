<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">System Settings</h1>

    <!-- Status Bar -->
    <div
      class="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between"
    >
      <div class="flex items-center space-x-4">
        <span class="font-semibold text-gray-700">System Status:</span>
        <span
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium',
            examStore.isExamStarted
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800',
          ]"
        >
          {{
            examStore.isExamStarted ? "Exam In Progress" : "Preparation Mode"
          }}
        </span>
      </div>
      <div class="space-x-4">
        <button
          @click="toggleExamStatus"
          :class="[
            'px-4 py-2 rounded text-white font-medium transition-colors',
            examStore.isExamStarted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600',
          ]"
          :disabled="examStore.isLoading"
        >
          {{ examStore.isExamStarted ? "End Exam" : "Start Exam" }}
        </button>
        <button
          @click="confirmReset"
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
          :disabled="examStore.isLoading"
        >
          Reset System
        </button>
      </div>
    </div>

    <!-- Configuration Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-800">
        Exam Configuration
      </h2>

      <!-- Upload / View Config -->
      <div
        v-if="!examStore.config"
        class="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="mt-1 text-sm text-gray-600">No configuration loaded</p>
        </div>
        <label
          class="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          <span>Upload Config JSON</span>
          <input
            type="file"
            class="hidden"
            accept=".json"
            @change="handleFileUpload"
          />
        </label>
      </div>

      <div v-else>
        <!-- Info Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-gray-50 rounded border border-gray-200">
            <p class="text-sm text-gray-500">Test Title</p>
            <p class="font-medium text-lg">{{ examStore.config.testTitle }}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded border border-gray-200">
            <p class="text-sm text-gray-500">Judger Settings</p>
            <p class="text-sm">
              Time Limit: {{ examStore.config.judgerSettings.timeLimit }}ms
            </p>
            <p class="text-sm">
              Memory Limit: {{ examStore.config.judgerSettings.memoryLimit }}MB
            </p>
          </div>
          <div
            class="p-4 bg-gray-50 rounded border border-gray-200 col-span-full"
          >
            <p class="text-sm text-gray-500">Description</p>
            <p>{{ examStore.config.description }}</p>
          </div>
        </div>

        <!-- Editor Section -->
        <div class="border rounded-lg overflow-hidden">
          <!-- If exam NOT started, allow full JSON edit/upload -->
          <div
            v-if="!examStore.isExamStarted"
            class="p-4 bg-gray-50 border-b flex justify-between items-center"
          >
            <span class="text-sm font-medium text-gray-700"
              >Full Configuration Edit</span
            >
            <div>
              <label
                class="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
              >
                Upload New Config
                <input
                  type="file"
                  class="hidden"
                  accept=".json"
                  @change="handleFileUpload"
                />
              </label>
              <button
                @click="saveFullConfig"
                class="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          <!-- If exam STARTED, only allow testcase edit -->
          <div
            v-else
            class="p-4 bg-yellow-50 border-b flex justify-between items-center"
          >
            <div class="flex items-center">
              <svg
                class="h-5 w-5 text-yellow-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span class="text-sm font-medium text-gray-700"
                >Locked Mode: Only Test Cases Editable</span
              >
            </div>
            <button
              @click="showTestCaseUpdateModal = true"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit Test Cases
            </button>
          </div>

          <!-- JSON Viewer/Editor (Simplified as textarea for now, could be Monaco/CodeMirror) -->
          <textarea
            v-if="!examStore.isExamStarted"
            v-model="editableConfigString"
            class="w-full h-96 p-4 font-mono text-sm border-0 focus:ring-0 resize-y"
          ></textarea>

          <div v-else class="p-4">
            <p class="text-gray-500 italic">
              Configuration is locked. Start a new exam to fully edit.
            </p>
            <!-- We could display read-only view here -->
            <pre
              class="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm"
              >{{ examStore.config }}</pre
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Reset System?</h3>
        <p class="text-gray-600 mb-6">
          This will clear all configuration and student data. This action cannot
          be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showResetModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            @click="performReset"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>

    <!-- TestCase Update Modal -->
    <div
      v-if="showTestCaseUpdateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 h-5/6 flex flex-col"
      >
        <h3 class="text-lg font-bold text-gray-900 mb-4">Update Test Cases</h3>
        <p class="text-sm text-gray-500 mb-2">
          Modify inputs/outputs below. Saving will notify all students.
        </p>

        <div class="flex-1 overflow-auto border rounded p-2 mb-4">
          <!-- Simple editor for the subset of config that constitutes test cases -->
          <textarea
            v-model="editableTestCaseString"
            class="w-full h-full p-2 font-mono text-sm border focus:ring-blue-500 focus:border-blue-500 rounded"
            placeholder="JSON content for test cases..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="showTestCaseUpdateModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            @click="confirmTestCaseUpdate"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save & Notify Students
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Modal for Test Case Update Confirmation -->
    <div
      v-if="showUpdateConfirmModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Update?</h3>
        <p class="text-gray-600 mb-6">
          This will update the test cases and send a notification
          (`config_update`) to all connected students.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showUpdateConfirmModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            @click="performTestCaseUpdate"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Yes, Send Update
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  useExamStore,
  type ExamConfig,
  examConfigSchema,
} from "../stores/examStore";
import { ZodError } from "zod";
import { io } from "socket.io-client";
import { BASE_URL } from "../utilities/api";

const examStore = useExamStore();
const editableConfigString = ref("");
const editableTestCaseString = ref("");

const showResetModal = ref(false);
const showTestCaseUpdateModal = ref(false);
const showUpdateConfirmModal = ref(false);

onMounted(async () => {
  await examStore.fetchStatus();
  await examStore.fetchConfig();
});

// Keep local string specific to viewed config
watch(
  () => examStore.config,
  (newConfig) => {
    if (newConfig) {
      editableConfigString.value = JSON.stringify(newConfig, null, 2);
      // Initialize test case editor with current config structure relevant to test cases
      // We filter to just the parts needed for /config/testcase endpoint
      // Structure: { testTitle: string, puzzles: [...] }
      const testCaseData = {
        testTitle: newConfig.testTitle,
        puzzles: newConfig.puzzles.map((p) => ({
          title: p.title,
          subtasks: p.subtasks,
        })),
      };
      editableTestCaseString.value = JSON.stringify(testCaseData, null, 2);
    } else {
      editableConfigString.value = "";
      editableTestCaseString.value = "";
    }
  },
  { deep: true },
);

async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const json = JSON.parse(content);

      // Validate with Zod
      const parsed = examConfigSchema.parse(json);

      if (examStore.isExamStarted) {
        alert("Exam started. Cannot replace full config.");
        return;
      }

      // If valid, upload/update
      if (examStore.config) {
        await examStore.updateConfig(parsed);
      } else {
        await examStore.createConfig(parsed);
      }
      alert("Configuration loaded successfully!");
    } catch (err) {
      if (err instanceof ZodError) {
        alert(
          `Invalid Configuration:\n${err.issues.map((i) => i.message).join("\n")}`,
        );
      } else {
        alert("Error parsing JSON file");
      }
      console.error(err);
    }
  };
  reader.readAsText(file);
}

async function saveFullConfig() {
  try {
    const json = JSON.parse(editableConfigString.value);
    const parsed = examConfigSchema.parse(json);
    await examStore.updateConfig(parsed);
    alert("Configuration saved!");
  } catch (err) {
    alert("Invalid JSON or Schema Error");
    console.error(err);
  }
}

async function toggleExamStatus() {
  const newStatus = !examStore.isExamStarted;
  await examStore.setExamStatus(newStatus);
}

function confirmReset() {
  showResetModal.value = true;
}

async function performReset() {
  await examStore.resetSystem();
  showResetModal.value = false;
  alert("System reset successfully.");
}

function confirmTestCaseUpdate() {
  // Validate JSON before showing confirmation
  try {
    JSON.parse(editableTestCaseString.value);
    showTestCaseUpdateModal.value = false;
    showUpdateConfirmModal.value = true;
  } catch (e) {
    alert("Invalid JSON in test case editor");
  }
}

async function performTestCaseUpdate() {
  try {
    const data = JSON.parse(editableTestCaseString.value);
    await examStore.updateTestCase(data);

    // Notify students via socket
    const socket = io(BASE_URL.replace("/admin", ""), {
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      socket.emit("message", {
        type: "config_update",
        content: "Test cases have been updated.",
      });
      // Close socket after sending
      setTimeout(() => socket.disconnect(), 1000);
    });

    showUpdateConfirmModal.value = false;
    alert("Test cases updated and students notified.");
  } catch (err) {
    console.error(err);
    alert("Failed to update test cases");
  }
}
</script>
