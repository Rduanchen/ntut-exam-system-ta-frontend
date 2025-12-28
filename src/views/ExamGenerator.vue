<template>
  <div class="page">
    <h1>考試設定 JSON 產生器</h1>
    <div class="grid two-cols">
      <!-- 左側：設定區 -->
      <div class="grid stack">
        <!-- 基本資訊 -->
        <details class="card" open>
          <summary>
            <div class="summary-row">
              <h2>基本資訊</h2>
              <span class="muted">點擊可展開/收合</span>
            </div>
          </summary>
          <div class="card-body">
            <div class="grid">
              <div>
                <label>testTitle</label>
                <input v-model="state.testTitle" placeholder="北科大計算機程式設計期中考" />
              </div>
              <div>
                <label>description</label>
                <textarea v-model="state.description" placeholder="the test will be start at 18:00 and end at 20:00"></textarea>
              </div>
              <!-- <div>
                <label>publicKey</label>
                <textarea v-model="state.publicKey" placeholder="粘貼 RSA 公鑰"></textarea>
              </div> -->
              <div class="row remote-row">
                <div class="grow">
                  <label>remoteHost</label>
                  <input v-model="state.remoteHost" placeholder="http://localhost:3001" />
                </div>
                <button class="btn" :disabled="loadingHost" @click="fillRemoteHost">
                  {{ loadingHost ? '取得中...' : '自動取得 URL' }}
                </button>
              </div>
              <div>
                <label>maxExecutionTime (ms)</label>
                <input v-model.number="state.maxExecutionTime" type="number" min="0" placeholder="預設毫秒限制" />
              </div>
              <!-- <div class="row wrap">
                <div>
                  <label>testTime.startTime (ISO)</label>
                  <input v-model="localStart" type="datetime-local" />
                </div>
                <div>
                  <label>testTime.endTime (ISO)</label>
                  <input v-model="localEnd" type="datetime-local" />
                </div>
                <label class="inline-checkbox">
                  <input v-model="state.testTime.forceQuit" type="checkbox" />
                  <span>forceQuit</span>
                </label>
              </div> -->
            </div>
          </div>
        </details>

        <!-- accessableUsers -->
        <details class="card" open>
          <summary>
            <div class="summary-row">
              <h2>accessableUsers</h2>
              <span class="muted">點擊可展開/收合</span>
            </div>
          </summary>
          <div class="card-body">
            <div class="section-header">
              <div></div>
              <button class="btn" @click="addUser">＋ 新增使用者</button>
            </div>

            <div v-if="!state.accessableUsers.length" class="muted">目前沒有使用者，請新增或匯入。</div>
            <div v-for="(u, idx) in state.accessableUsers" :key="idx" class="row user-row">
              <div>
                <label>ID</label>
                <input v-model="u.id" placeholder="學號或代號" />
              </div>
              <div>
                <label>Name</label>
                <input v-model="u.name" placeholder="姓名" />
              </div>
              <div class="shrink">
                <button class="btn-danger" @click="removeUser(idx)">刪除</button>
              </div>
            </div>

            <hr class="dash" />
            <div class="grid">
              <div>
                <label>貼上 CSV（以逗號分隔，每行：id,name）</label>
                <textarea
                  v-model="csvText"
                  placeholder="114590001,王小明&#10;114590034,李小華"
                ></textarea>
                <div class="muted">即時解析：貼上後自動更新 accessableUsers 與 JSON；按「匯入 CSV」也可手動觸發。</div>
              </div>
              <div class="row gap8">
                <button class="btn-secondary" @click="importCSV(false)">匯入 CSV</button>
                <button class="btn-secondary" @click="clearUsers">清空</button>
              </div>
            </div>
          </div>
        </details>

        <!-- puzzles -->
        <details class="card" open>
          <summary>
            <div class="summary-row">
              <h2>puzzles</h2>
              <span class="muted">點擊可展開/收合</span>
            </div>
          </summary>
          <div class="card-body">
            <div class="section-header">
              <div></div>
              <button class="btn" @click="addPuzzle">＋ 新增題目</button>
            </div>

            <div v-if="!state.puzzles.length" class="muted">尚未新增題目。</div>
            <div
              v-for="(puzzle, pIdx) in state.puzzles"
              :key="pIdx"
              class="card puzzle-card"
            >
              <div class="section-header">
                <div class="inline">
                  <span class="pill">id: {{ pIdx + 1 }}</span>
                  <h3 class="m0">題目 {{ pIdx + 1 }}</h3>
                </div>
                <button class="btn-danger" @click="removePuzzle(pIdx)">刪除題目</button>
              </div>

              <div class="row">
                <div>
                  <label>name</label>
                  <input v-model="puzzle.name" placeholder="題目名稱" />
                </div>
                <div>
                  <label>language</label>
                  <input v-model="puzzle.language" placeholder="Python / C / C++ ..." />
                </div>
              </div>

              <div class="mt10">
                <div class="section-header">
                  <h4 class="m0">testCases</h4>
                  <button class="btn-secondary" @click="addGroup(pIdx)">＋ 新增測試組</button>
                </div>

                <div v-if="!puzzle.testCases.length" class="muted">尚未新增測試組。</div>
                <div
                  v-for="(group, gIdx) in puzzle.testCases"
                  :key="gIdx"
                  class="card group-card"
                >
                  <div class="section-header">
                    <div class="inline">
                      <span class="pill">group id: {{ gIdx + 1 }}</span>
                      <input
                        v-model="group.title"
                        placeholder="Group 標題"
                        class="input-plain"
                      />
                    </div>
                    <button class="btn-danger" @click="removeGroup(pIdx, gIdx)">刪除此組</button>
                  </div>

                  <div class="row align-start">
                    <div class="group-column">
                      <div class="section-header">
                        <h4 class="m0">openTestCases</h4>
                        <button class="btn-secondary" @click="addOpenCase(pIdx, gIdx)">＋ 新增</button>
                      </div>
                      <div v-if="!group.openTestCases.length" class="muted">尚未新增。</div>
                      <div
                        v-for="(tc, tcIdx) in group.openTestCases"
                        :key="tcIdx"
                        class="card case-card"
                      >
                        <div class="section-header">
                          <span class="pill">id: {{ gIdx + 1 }}-{{ tcIdx + 1 }}</span>
                          <button class="btn-danger" @click="removeOpenCase(pIdx, gIdx, tcIdx)">刪除</button>
                        </div>
                        <label>input</label>
                        <textarea v-model="tc.input" placeholder="輸入"></textarea>
                        <label>output</label>
                        <input v-model="tc.output" placeholder="輸出" />
                      </div>
                    </div>

                    <div class="group-column">
                      <div class="section-header">
                        <h4 class="m0">hiddenTestCases</h4>
                        <button class="btn-secondary" @click="addHiddenCase(pIdx, gIdx)">＋ 新增</button>
                      </div>
                      <div v-if="!group.hiddenTestCases.length" class="muted">尚未新增。</div>
                      <div
                        v-for="(tc, tcIdx) in group.hiddenTestCases"
                        :key="tcIdx"
                        class="card case-card"
                      >
                        <div class="section-header">
                          <span class="pill">
                            id: {{ gIdx + 1 }}-{{ tcIdx + 1 + group.openTestCases.length }}
                          </span>
                          <button class="btn-danger" @click="removeHiddenCase(pIdx, gIdx, tcIdx)">刪除</button>
                        </div>
                        <label>input</label>
                        <textarea v-model="tc.input" placeholder="輸入"></textarea>
                        <label>output</label>
                        <input v-model="tc.output" placeholder="輸出" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- 右側：預覽與下載 -->
      <div class="grid sticky">
        <div class="card">
          <div class="section-header">
            <h2>Preview JSON</h2>
            <div class="inline gap8">
              <select v-model="previewMode">
                <option value="config">config</option>
                <option value="to-server">to-server</option>
              </select>
              <button class="btn-secondary" @click="forceRefresh">刷新</button>
              <button class="btn" @click="downloadConfig">下載 JSON</button>
              <button class="btn" @click="downloadToServer">to-server 下載</button>
            </div>
          </div>
          <pre>{{ previewText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { getHostUserUrl } from '../utilities/api';

type TestCase = { input: string; output: string };
type Group = { title: string; openTestCases: TestCase[]; hiddenTestCases: TestCase[] };
type Puzzle = { name: string; language: string; testCases: Group[] };
type User = { id: string; name: string };

const state = reactive({
  testTitle: '',
  description: '',
  publicKey: 'key-here',
  remoteHost: '',
  maxExecutionTime: 20000 as number | undefined,
  testTime: { startTime: '2025-12-28T07:37:00.000Z', endTime: '2025-12-28T07:37:00.000Z', forceQuit: false },
  accessableUsers: [] as User[],
  puzzles: [] as Puzzle[],
});

const csvText = ref('');
const previewMode = ref<'config' | 'to-server'>('config');
const refreshTick = ref(0);
const loadingHost = ref(false);

// datetime-local helpers
const localStart = computed({
  get: () => toLocal(state.testTime.startTime),
  set: (v: string) => (state.testTime.startTime = toISO(v)),
});
const localEnd = computed({
  get: () => toLocal(state.testTime.endTime),
  set: (v: string) => (state.testTime.endTime = toISO(v)),
});

function toISO(localValue: string) {
  if (!localValue) return '';
  const dt = new Date(localValue);
  return isNaN(dt.getTime()) ? '' : dt.toISOString();
}
function toLocal(iso: string) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// Build config & to-server
const configJSON = computed(() => ({
  testTitle: state.testTitle || '',
  description: state.description || '',
  publicKey: state.publicKey || '',
  remoteHost: state.remoteHost || '',
  maxExecutionTime: state.maxExecutionTime ?? null,
  testTime: {
    startTime: state.testTime.startTime || '',
    endTime: state.testTime.endTime || '',
    forceQuit: !!state.testTime.forceQuit,
  },
  accessableUsers: state.accessableUsers.map((u, idx) => ({
    id: u.id || String(idx),
    name: u.name || '',
  })),
  puzzles: state.puzzles.map((p, pIdx) => ({
    id: String(pIdx + 1),
    name: p.name || '',
    language: p.language || '',
    testCases: p.testCases.map((g, gIdx) => ({
      title: g.title || '',
      id: gIdx + 1,
      openTestCases: g.openTestCases.map((tc, tcIdx) => ({
        id: `${gIdx + 1}-${tcIdx + 1}`,
        input: tc.input || '',
        output: tc.output || '',
      })),
      hiddenTestCases: g.hiddenTestCases.map((tc, tcIdx) => ({
        id: `${gIdx + 1}-${tcIdx + 1 + g.openTestCases.length}`,
        input: tc.input || '',
        output: tc.output || '',
      })),
    })),
  })),
}));

const toServerJSON = computed(() => ({
  config: configJSON.value,
  studentList: state.accessableUsers.map((u, idx) => ({
    id: u.id || String(idx),
    name: u.name || '',
  })),
}));

const previewText = computed(() =>
  JSON.stringify(previewMode.value === 'config' ? configJSON.value : toServerJSON.value, null, 2)
);

// Users
function addUser() {
  state.accessableUsers.push({ id: '', name: '' });
}
function removeUser(idx: number) {
  state.accessableUsers.splice(idx, 1);
}
function clearUsers() {
  state.accessableUsers.splice(0, state.accessableUsers.length);
  csvText.value = '';
}
function importCSV(auto = false) {
  const raw = csvText.value.trim();
  if (!raw) {
    if (!auto) clearUsers();
    return;
  }
  const lines = raw.split(/\r?\n/);
  const parsed: User[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 2) continue;
    parsed.push({ id: parts[0], name: parts.slice(1).join(',') });
  }
  state.accessableUsers.splice(0, state.accessableUsers.length, ...parsed);
}
watch(csvText, () => importCSV(true));

// Puzzles & groups
function addPuzzle() {
  state.puzzles.push({ name: '', language: 'Python', testCases: [] });
}
function removePuzzle(pIdx: number) {
  state.puzzles.splice(pIdx, 1);
}
function addGroup(pIdx: number) {
  state.puzzles[pIdx].testCases.push({ title: '', openTestCases: [], hiddenTestCases: [] });
}
function removeGroup(pIdx: number, gIdx: number) {
  state.puzzles[pIdx].testCases.splice(gIdx, 1);
}
function addOpenCase(pIdx: number, gIdx: number) {
  state.puzzles[pIdx].testCases[gIdx].openTestCases.push({ input: '', output: '' });
}
function removeOpenCase(pIdx: number, gIdx: number, tcIdx: number) {
  state.puzzles[pIdx].testCases[gIdx].openTestCases.splice(tcIdx, 1);
}
function addHiddenCase(pIdx: number, gIdx: number) {
  state.puzzles[pIdx].testCases[gIdx].hiddenTestCases.push({ input: '', output: '' });
}
function removeHiddenCase(pIdx: number, gIdx: number, tcIdx: number) {
  state.puzzles[pIdx].testCases[gIdx].hiddenTestCases.splice(tcIdx, 1);
}

// Download helpers
function downloadJSON(obj: any, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadConfig() {
  downloadJSON(configJSON.value, 'exam-config.json');
}
function downloadToServer() {
  downloadJSON(toServerJSON.value, 'exam-config-to-server.json');
}

// Force preview refresh (tick to retrigger computed consumers)
function forceRefresh() {
  refreshTick.value++;
}

// Remote host fetch
async function fillRemoteHost() {
  loadingHost.value = true;
  try {
    const url = await getHostUserUrl();
    if (url) state.remoteHost = url;
  } finally {
    loadingHost.value = false;
  }
}
</script>

<style scoped>
:root {
  --bg: #f5f7fb;
  --card: #fff;
  --border: #d6d9e0;
  --accent: #2d7ff9;
  --muted: #6b7280;
}
.page {
  font-family: "Inter", system-ui, -apple-system, "Noto Sans TC", sans-serif;
  background: var(--bg);
  margin: 0;
  padding: 20px;
  color: #111827;
  box-sizing: border-box;
}
h1, h2, h3, h4 { margin: 0 0 10px; }
h1 { margin-bottom: 16px; }
.m0 { margin: 0; }
.grid { display: grid; gap: 12px; }
.two-cols { grid-template-columns: 2fr 1fr; align-items: start; }
.stack { align-content: start; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; box-shadow: 0 6px 20px rgba(17,24,39,0.05); }
label { font-weight: 600; display: block; margin-bottom: 6px; }
input, textarea, select { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; box-sizing: border-box; }
textarea { min-height: 80px; resize: vertical; }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.wrap { flex-wrap: wrap; }
.row > * { flex: 1 1 200px; }
.inline { display: inline-flex; align-items: center; gap: 6px; }
.inline-checkbox { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.grow { flex: 1 1 auto; }
.shrink { flex: 0 0 auto; }
.gap8 { gap: 8px; }
.muted { color: var(--muted); font-size: 12px; }
button { cursor: pointer; border: none; border-radius: 8px; padding: 10px 12px; font-weight: 700; }
.btn {
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: #2563eb;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  transition: background 0.15s;
}
.btn-secondary { background: #e5e7eb; color: #111827; }
.btn-danger { background: #ef4444; color: #fff; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.card-body { padding: 14px 16px; }
.dash { margin: 12px 0; border: none; border-top: 1px dashed var(--border); }
.pill { background: #eef2ff; color: #3730a3; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
details.card { padding: 0; }
details > summary { list-style: none; cursor: pointer; padding: 14px 16px; border-radius: 10px; }
details[open] > summary { border-bottom: 1px solid var(--border); }
summary::-webkit-details-marker { display: none; }
pre { background: #0b1021; color: #e5e7eb; padding: 12px; border-radius: 10px; overflow: auto; max-height: 420px; }
.sticky { position: sticky; top: 20px; align-self: start; }
.user-row { align-items: flex-end; }
.remote-row { align-items: flex-end; }
.puzzle-card { border: 1px dashed var(--border); background: #fafbff; }
.group-card { padding: 10px 12px; margin-bottom: 8px; }
.case-card { padding: 8px; margin-bottom: 6px; }
.group-column { flex: 1 1 320px; min-width: 0; }
.align-start { align-items: flex-start; }
.input-plain { padding: 8px; border-radius: 6px; }
.mt10 { margin-top: 10px; }
</style>