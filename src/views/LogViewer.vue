<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useSystemLogStore } from "../stores/systemLogStore";

const store = useSystemLogStore();

const filterStudentId = ref("");
const filterNet = ref("");
const filterContent = ref("");

const loading = computed(() => store.isLoading);
const error = computed(() => store.error);
const filtered = computed(() => {
  const sid = filterStudentId.value.trim().toLowerCase();
  const net = filterNet.value.trim().toLowerCase();
  const content = filterContent.value.trim().toLowerCase();

  return store.logs.filter((log) => {
    // 1. Filter Student ID
    if (sid && !log.student_id?.toLowerCase().includes(sid)) return false;
    // 2. Filter IP / Mac
    if (net) {
      const ipMatch = log.ipAddress?.toLowerCase().includes(net);
      const macMatch = log.mac?.toLowerCase().includes(net);
      if (!ipMatch && !macMatch) return false;
    }
    // 3. Filter Content / Type
    if (content) {
      const msgMatch = (log.message || log.messeage)
        ?.toLowerCase()
        .includes(content);
      const typeMatch = log.type?.toLowerCase().includes(content);
      if (!msgMatch && !typeMatch) return false;
    }
    return true;
  });
});

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
  await store.fetchAllLogs();
};

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Filter -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
      >
        <div>
          <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-blue-500"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            System Logs
          </h3>
          <p class="text-gray-500 text-sm mt-1">
            View and filter student activity logs
          </p>
        </div>
        <button
          @click="fetchAll"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ 'animate-spin': loading }"
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {{ loading ? "Refreshing..." : "Refresh Logs" }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label
            class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >Student ID</label
          >
          <div class="relative">
            <input
              v-model="filterStudentId"
              type="text"
              placeholder="Filter by ID..."
              @keyup.enter="fetchAll"
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="absolute left-3 top-2.5 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        <div class="space-y-1">
          <label
            class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >Network (IP/Mac)</label
          >
          <div class="relative">
            <input
              v-model="filterNet"
              type="text"
              placeholder="Filter by Net..."
              @keyup.enter="fetchAll"
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="absolute left-3 top-2.5 text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
          </div>
        </div>

        <div class="space-y-1">
          <label
            class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >Content / Type</label
          >
          <div class="relative">
            <input
              v-model="filterContent"
              type="text"
              placeholder="Filter details..."
              @keyup.enter="fetchAll"
              class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="absolute left-3 top-2.5 text-gray-400"
            >
              <path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
              <path
                d="M4 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8l-4-4-4 4-4-4-4 4v-8z"
              />
              <path
                d="M2 2h20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-center gap-3"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-red-500"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <span class="text-sm font-medium text-red-700">{{ error }}</span>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filtered.length === 0 && !error"
      class="bg-gray-50 rounded-xl border-dashed border-2 border-gray-200 p-12 flex flex-col items-center justify-center text-center"
    >
      <div
        class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p class="text-gray-500 font-medium">No logs match your filter</p>
    </div>

    <!-- Table -->
    <div
      v-if="filtered.length > 0"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-500">
            <tr>
              <th class="px-6 py-3 font-medium border-b border-gray-100 w-24">
                ID
              </th>
              <th class="px-6 py-3 font-medium border-b border-gray-100 w-40">
                Time
              </th>
              <th class="px-6 py-3 font-medium border-b border-gray-100 w-32">
                Student
              </th>
              <th class="px-6 py-3 font-medium border-b border-gray-100 w-48">
                Network
              </th>
              <th class="px-6 py-3 font-medium border-b border-gray-100 w-32">
                Type
              </th>
              <th class="px-6 py-3 font-medium border-b border-gray-100">
                Message
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="log in filtered"
              :key="log.id"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <td class="px-6 py-4 font-mono text-xs text-gray-400">
                #{{ log.id }}
              </td>
              <td class="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                {{ formatTime(log.timestamp) }}
              </td>
              <td class="px-6 py-4 font-medium text-gray-900">
                {{ log.student_ID }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col text-xs">
                  <span class="font-mono text-gray-600">{{
                    log.ip_address
                  }}</span>
                  <span class="font-mono text-gray-400" v-if="log.mac">{{
                    log.mac_address
                  }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap"
                >
                  {{ log.action_type }}
                </span>
              </td>
              <td
                class="px-6 py-4 text-gray-600 font-mono text-xs break-all leading-relaxed"
              >
                {{ log.details || log.details }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
