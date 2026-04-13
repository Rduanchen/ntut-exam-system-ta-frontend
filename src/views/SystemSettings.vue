<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">System Settings</h1>

    <!-- Status Bar -->
    <div
      class="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div
        class="flex flex-col gap-2 text-center md:text-left md:flex-row md:items-center md:gap-4"
      >
        <span
          class="font-semibold text-gray-700 text-sm uppercase tracking-wide"
          >System Status</span
        >
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
      <div
        class="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:justify-end md:w-auto"
      >
        <button
          @click="toggleExamStatus"
          :class="[
            'px-4 py-2 rounded text-white font-medium transition-colors w-full sm:w-auto',
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
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors w-full sm:w-auto"
          :disabled="examStore.isLoading"
        >
          Reset System
        </button>
        <button
          @click="doInitialize"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors w-full sm:w-auto"
          :disabled="examStore.isLoading || !localConfig"
        >
          Init System
        </button>
      </div>
    </div>

    <!-- Configuration Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Exam Configuration</h2>
        <div class="space-x-2">
          <label
            class="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
          >
            Import JSON
            <input
              type="file"
              class="hidden"
              accept=".json"
              @change="handleFileUpload"
              :disabled="examStore.isExamStarted"
            />
          </label>
          <button
            @click="downloadConfig"
            class="bg-gray-50 text-gray-600 px-3 py-1 rounded hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
          >
            Export JSON
          </button>
        </div>
      </div>

      <!-- If no config loaded -->
      <div
        v-if="!localConfig"
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
        <button
          @click="createNewConfig"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Create New Config
        </button>
      </div>

      <!-- Graphical Editor -->
      <div v-else>
        <!-- Basic Info -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h3
            class="font-medium text-gray-700 mb-3 uppercase text-xs tracking-wider"
          >
            Basic Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Test Title</label
              >
              <input
                v-model="localConfig.testTitle"
                :disabled="examStore.isExamStarted"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Time Limit (ms)</label
                >
                <input
                  type="number"
                  v-model.number="localConfig.judgerSettings.timeLimit"
                  :disabled="examStore.isExamStarted"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Memory Limit (KB)</label
                >
                <input
                  type="number"
                  v-model.number="localConfig.judgerSettings.memoryLimit"
                  :disabled="examStore.isExamStarted"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
            <div class="col-span-full">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Description</label
              >
              <textarea
                v-model="localConfig.description"
                :disabled="examStore.isExamStarted"
                rows="3"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Special Rules (Global) -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3
              class="font-medium text-gray-700 uppercase text-xs tracking-wider"
            >
              Special Rules — Global
            </h3>
            <button
              type="button"
              @click="addGlobalSpecialRule"
              class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
            >
              + Add Global Rule
            </button>
          </div>

          <div
            v-if="(localConfig.globalSpecialRules?.length ?? 0) === 0"
            class="text-sm text-gray-500"
          >
            No global special rules configured.
          </div>

          <div class="space-y-3" v-else>
            <div
              v-for="(r, rIdx) in localConfig.globalSpecialRules"
              :key="r.id"
              class="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-[11px] text-gray-500 font-mono break-all">
                  {{ r.id }}
                </div>
                <button
                  type="button"
                  @click="removeGlobalSpecialRule(rIdx)"
                  class="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>

              <div class="mt-2 grid grid-cols-1 md:grid-cols-5 gap-3">
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 uppercase"
                    >Message</label
                  >
                  <input
                    v-model="r.message"
                    class="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                    placeholder="Rule message shown to TAs"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 uppercase"
                    >Type</label
                  >
                  <select
                    :value="r.type"
                    @change="(e) => onRuleTypeChange(r, (e.target as HTMLSelectElement).value as any)"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  >
                    <option value="regex">regex</option>
                    <option value="use">use</option>
                    <option value="composite">composite</option>
                    <option value="nestedLoop">nestedLoop</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 uppercase"
                    >Constraint</label
                  >
                  <select
                    v-model="r.constraint"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  >
                    <option value="MUST_HAVE">MUST_HAVE</option>
                    <option value="MUST_NOT_HAVE">MUST_NOT_HAVE</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 uppercase"
                    >Severity</label
                  >
                  <select
                    v-model="r.severity"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  >
                    <option :value="undefined">(none)</option>
                    <option value="info">info</option>
                    <option value="warn">warn</option>
                  </select>
                </div>
              </div>

              <SpecialRuleParamsEditor
                :rule="r"
              />
            </div>
          </div>
        </div>

        <!-- Users Section -->
        <details
          class="bg-white border rounded-lg mb-4"
          :open="!examStore.isExamStarted"
        >
          <summary
            class="px-4 py-3 cursor-pointer bg-gray-50 font-medium text-gray-700 focus:outline-none flex justify-between items-center"
          >
            <span
              >Accessible Users ({{ localConfig.accessibleUsers.length }})</span
            >
            <span class="text-xs text-gray-500" v-if="examStore.isExamStarted"
              >Locked</span
            >
          </summary>
          <div class="p-4 border-t" v-if="!examStore.isExamStarted">
            <div class="flex flex-wrap gap-2 mb-4">
              <button
                @click="addUser"
                class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                + Add User
              </button>
              <button
                @click="clearUsers"
                class="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
              >
                Clear All
              </button>
            </div>

            <div
              class="max-h-60 overflow-y-auto mb-4 border rounded p-2 bg-gray-50"
            >
              <div
                v-if="localConfig.accessibleUsers.length === 0"
                class="text-gray-400 text-center py-4 text-sm"
              >
                No users added
              </div>
              <div
                v-for="(user, idx) in localConfig.accessibleUsers"
                :key="idx"
                class="flex gap-2 mb-2 items-center"
              >
                <input
                  v-model="user.id"
                  placeholder="Student ID"
                  class="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm p-1 border"
                />
                <input
                  v-model="user.name"
                  placeholder="Name"
                  class="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm p-1 border"
                />
                <button
                  @click="removeUser(idx)"
                  class="text-red-500 hover:text-red-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="border-t pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Bulk Import (CSV format: ID,Name)</label
              >
              <textarea
                v-model="csvImportText"
                placeholder="101,John Doe&#10;102,Jane Smith"
                rows="3"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border mb-2"
              ></textarea>
              <button
                @click="importUsersFromCSV"
                class="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
              >
                Import CSV
              </button>
            </div>
          </div>
        </details>

        <!-- Puzzles Section -->
        <div class="space-y-4">
          <div class="flex justify-between items-end border-b pb-2 mb-4">
            <h3
              class="font-medium text-gray-700 uppercase text-xs tracking-wider"
            >
              Puzzles ({{ localConfig.puzzles.length }})
            </h3>
            <button
              v-if="!examStore.isExamStarted"
              @click="addPuzzle"
              class="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 shadow-sm"
            >
              + Add Puzzle
            </button>
          </div>

          <div
            v-for="(puzzle, pIdx) in localConfig.puzzles"
            :key="pIdx"
            class="bg-white border rounded-lg shadow-sm overflow-hidden"
          >
            <div
              class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center"
            >
              <div class="font-medium text-gray-800 flex items-center gap-2">
                <span
                  class="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                  >#{{ pIdx + 1 }}</span
                >
                <input
                  v-if="!examStore.isExamStarted"
                  v-model="puzzle.title"
                  class="bg-transparent border-none focus:ring-0 p-0 font-medium"
                  placeholder="Puzzle Title"
                />
                <span v-else>{{ puzzle.title }}</span>
              </div>
              <button
                v-if="!examStore.isExamStarted"
                @click="removePuzzle(pIdx)"
                class="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>

            <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
              <div>
                <label class="block text-xs font-medium text-gray-500 uppercase"
                  >Language</label
                >
                <select
                  v-model="puzzle.language"
                  :disabled="examStore.isExamStarted"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                  <option
                    v-for="option in LANGUAGE_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 uppercase"
                  >Time Limit (opt)(Ms)</label
                >
                <input
                  type="number"
                  v-model.number="puzzle.timeLimit"
                  :disabled="examStore.isExamStarted"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder="Default"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 uppercase"
                  >Memory Limit (opt) (KB)</label
                >
                <input
                  type="number"
                  v-model.number="puzzle.memoryLimit"
                  :disabled="examStore.isExamStarted"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  placeholder="Default"
                />
              </div>
            </div>

            <!-- Special Rules (Per puzzle) -->
            <div class="px-4 py-3 border-b bg-white">
              <div class="flex items-center justify-between">
                <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Special Rules — Puzzle #{{ pIdx + 1 }}
                </div>
                <button
                  type="button"
                  @click="addPuzzleSpecialRule(pIdx)"
                  class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                >
                  + Add Rule
                </button>
              </div>

              <div
                v-if="(puzzle.specialRules?.length ?? 0) === 0"
                class="text-sm text-gray-500 mt-2"
              >
                No per-puzzle special rules configured.
              </div>

              <div class="space-y-3 mt-3" v-else>
                <div
                  v-for="(r, rIdx) in puzzle.specialRules"
                  :key="r.id"
                  class="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-[11px] text-gray-500 font-mono break-all">
                      {{ r.id }}
                    </div>
                    <button
                      type="button"
                      @click="removePuzzleSpecialRule(pIdx, rIdx)"
                      class="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>

                  <div class="mt-2 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div class="md:col-span-2">
                      <label class="block text-xs font-medium text-gray-500 uppercase"
                        >Message</label
                      >
                      <input
                        v-model="r.message"
                        class="mt-1 w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                        placeholder="Rule message shown to TAs"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 uppercase"
                        >Type</label
                      >
                      <select
                        :value="r.type"
                        @change="(e) => onRuleTypeChange(r, (e.target as HTMLSelectElement).value as any)"
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      >
                        <option value="regex">regex</option>
                        <option value="use">use</option>
                        <option value="composite">composite</option>
                        <option value="nestedLoop">nestedLoop</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 uppercase"
                        >Constraint</label
                      >
                      <select
                        v-model="r.constraint"
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      >
                        <option value="MUST_HAVE">MUST_HAVE</option>
                        <option value="MUST_NOT_HAVE">MUST_NOT_HAVE</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 uppercase"
                        >Severity</label
                      >
                      <select
                        v-model="r.severity"
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      >
                        <option :value="undefined">(none)</option>
                        <option value="info">info</option>
                        <option value="warn">warn</option>
                      </select>
                    </div>
                  </div>

                  <SpecialRuleParamsEditor
                    :rule="r"
                  />
                </div>
              </div>
            </div>

            <!-- Subtasks -->
            <div class="p-4 bg-gray-50/50">
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-sm font-medium text-gray-700">
                  Test Case Groups (Subtasks)
                </h4>
                <button
                  v-if="!examStore.isExamStarted"
                  @click="addSubtask(pIdx)"
                  class="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
                >
                  + Add Group
                </button>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(subtask, sIdx) in puzzle.subtasks"
                  :key="sIdx"
                  class="border rounded-md bg-white p-3"
                >
                  <div
                    class="flex justify-between items-center mb-3 border-b pb-2"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono text-gray-500"
                        >Group {{ sIdx + 1 }}</span
                      >
                      <input
                        v-model="subtask.title"
                        :disabled="examStore.isExamStarted"
                        class="text-sm border-gray-300 rounded focus:ring-blue-500 p-1 border"
                        placeholder="Group Title"
                      />
                    </div>
                    <button
                      v-if="!examStore.isExamStarted"
                      @click="removeSubtask(pIdx, sIdx)"
                      class="text-red-500 text-xs hover:underline"
                    >
                      Remove Group
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Visible Cases -->
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <span
                          class="text-xs font-semibold text-green-700 uppercase tracking-wide"
                          >Visible Cases</span
                        >
                        <button
                          v-if="!examStore.isExamStarted"
                          @click="addTestCase(pIdx, sIdx, 'visible')"
                          class="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add
                        </button>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="(tc, tIdx) in subtask.visible"
                          :key="tIdx"
                          class="grid grid-cols-1 gap-1 border p-2 rounded bg-green-50/30 relative group"
                        >
                          <button
                            v-if="!examStore.isExamStarted"
                            @click="removeTestCase(pIdx, sIdx, 'visible', tIdx)"
                            class="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <textarea
                            v-model="tc.input"
                            rows="1"
                            class="text-xs font-mono w-full p-1 border rounded resize-y"
                            placeholder="Input"
                          ></textarea>
                          <textarea
                            v-model="tc.output"
                            rows="1"
                            class="text-xs font-mono w-full p-1 border rounded resize-y"
                            placeholder="Output"
                          ></textarea>
                        </div>
                        <div
                          v-if="subtask.visible.length === 0"
                          class="text-xs text-gray-400 italic text-center p-2"
                        >
                          No visible cases
                        </div>
                      </div>
                    </div>

                    <!-- Hidden Cases -->
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <span
                          class="text-xs font-semibold text-red-700 uppercase tracking-wide"
                          >Hidden Cases</span
                        >
                        <button
                          v-if="!examStore.isExamStarted"
                          @click="addTestCase(pIdx, sIdx, 'hidden')"
                          class="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add
                        </button>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="(tc, tIdx) in subtask.hidden"
                          :key="tIdx"
                          class="grid grid-cols-1 gap-1 border p-2 rounded bg-red-50/30 relative group"
                        >
                          <button
                            v-if="!examStore.isExamStarted"
                            @click="removeTestCase(pIdx, sIdx, 'hidden', tIdx)"
                            class="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <textarea
                            v-model="tc.input"
                            rows="1"
                            class="text-xs font-mono w-full p-1 border rounded resize-y"
                            placeholder="Input"
                          ></textarea>
                          <textarea
                            v-model="tc.output"
                            rows="1"
                            class="text-xs font-mono w-full p-1 border rounded resize-y"
                            placeholder="Output"
                          ></textarea>
                        </div>
                        <div
                          v-if="subtask.hidden.length === 0"
                          class="text-xs text-gray-400 italic text-center p-2"
                        >
                          No hidden cases
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3 sticky bottom-4">
          <div
            v-if="hasUnsavedChanges"
            class="flex items-center text-yellow-600 text-sm mr-4 bg-yellow-50 px-3 py-1 rounded border border-yellow-200 shadow-sm"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Unsaved Changes
          </div>

          <button
            v-if="examStore.isExamStarted"
            @click="confirmTestCaseUpdate"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
          >
            Save Test Case Updates & Notify
          </button>

          <button
            v-else
            @click="saveFullConfig"
            class="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition-colors font-medium"
          >
            Save Full Configuration
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Reset System?</h3>
        <p class="text-gray-600 mb-6 font-medium">
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
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Update Confirm Modal -->
    <div
      v-if="showUpdateConfirmModal"
      class="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Update?</h3>
        <p class="text-gray-600 mb-6">
          This will update the test cases and send a notification
          (`config_update`) to all connected students immediately.
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
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            Yes, Send Update
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import {
  useExamStore,
  type ExamConfig,
  examConfigSchema,
} from "../stores/examStore";
import { createDefaultSpecialRule } from "../specialRules/defaults";
import type { SpecialRule } from "../specialRules/types";
import SpecialRuleParamsEditor from "../components/SpecialRuleParamsEditor.vue";
import { useMessageStore } from "../stores/messegeStore";
import { ZodError } from "zod";

const LANGUAGE_OPTIONS = [
  { label: "Python", value: "Python" },
  { label: "C", value: "C" },
  { label: "C++", value: "C++" },
  { label: "Java", value: "Java" },
  { label: "JavaScript", value: "JavaScript" },
] as const;

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  python: "Python",
  py: "Python",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
};

const DEFAULT_LANGUAGE = LANGUAGE_OPTIONS[0].value;

function normalizeLanguageValue(language?: string | null): string {
  if (!language) return DEFAULT_LANGUAGE;
  const trimmed = language.trim();
  if (!trimmed) return DEFAULT_LANGUAGE;
  const aliasKey = trimmed.toLowerCase();
  return LANGUAGE_ALIAS_MAP[aliasKey] ?? trimmed;
}

function normalizeConfigLanguages(config: ExamConfig | null) {
  if (!config) return;
  config.puzzles.forEach((puzzle) => {
    puzzle.language = normalizeLanguageValue(puzzle.language);
  });
}

const examStore = useExamStore();
const messageStore = useMessageStore();
const localConfig = ref<ExamConfig | null>(null);
const csvImportText = ref("");

const showResetModal = ref(false);
const showUpdateConfirmModal = ref(false);

// Special rule editing helpers

const normalizedStoreConfig = computed<ExamConfig | null>(() => {
  if (!examStore.config) return null;
  const cloned = JSON.parse(JSON.stringify(examStore.config)) as ExamConfig;
  normalizeConfigLanguages(cloned);
  return cloned;
});

const hasUnsavedChanges = computed(() => {
  if (!localConfig.value && !normalizedStoreConfig.value) {
    return false;
  }
  return (
    JSON.stringify(localConfig.value) !==
    JSON.stringify(normalizedStoreConfig.value)
  );
});

function getNormalizedConfigSnapshot(): ExamConfig | null {
  if (!localConfig.value) return null;
  const cloned = JSON.parse(JSON.stringify(localConfig.value)) as ExamConfig;
  normalizeConfigLanguages(cloned);
  return cloned;
}

onMounted(async () => {
  await examStore.fetchStatus();
  await examStore.fetchConfig();
});

// Sync store config to local editable config when loaded
watch(
  () => examStore.config,
  (newConfig) => {
    if (newConfig) {
      const cloned = JSON.parse(JSON.stringify(newConfig)) as ExamConfig;
      normalizeConfigLanguages(cloned);
      localConfig.value = cloned;
    } else {
      localConfig.value = null;
    }
  },
  { immediate: true, deep: true },
);

function createNewConfig() {
  localConfig.value = {
    testTitle: "New Exam",
    description: "",
    judgerSettings: { timeLimit: 1000, memoryLimit: 128 },
    accessibleUsers: [],
    puzzles: [],
  };
}

async function handleFileUpload(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const file = inputEl.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const json = JSON.parse(content);
      const parsed = examConfigSchema.parse(json);

      // Update local config immediately for review before saving
      normalizeConfigLanguages(parsed);
      localConfig.value = parsed;
      // Also save directly if desired, but user might want to edit first.
      // Requirement "allowing user to upload... check config type".
      // To match typical UX, we load it into the editor.

      // OPTIONAL: Auto-save on upload? The previous version did. Let's ask via alert/confirmation or just autosave.
      // Given the requirement to be able to "update ExamConfig", sticking to "Load into Editor" is safer.
      // User can click "Save" to commit.
      alert("Configuration loaded into editor. Please review and click Save.");
    } catch (err) {
      if (err instanceof ZodError) {
        alert(
          `Invalid Configuration:\n${err.issues.map((i) => i.message).join("\n")}`,
        );
      } else {
        alert("Error parsing JSON file");
      }
    }
  };
  reader.readAsText(file);

  // Important UX fix: allow importing the *same* file twice.
  // Browsers don't fire `change` if the chosen file path doesn't change,
  // so we clear the input after reading.
  inputEl.value = '';
}

function downloadConfig() {
  if (!localConfig.value) return;
  const blob = new Blob([JSON.stringify(localConfig.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `exam-config-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// User Management
function addUser() {
  localConfig.value?.accessibleUsers.push({ id: "", name: "" });
}
function removeUser(idx: number) {
  localConfig.value?.accessibleUsers.splice(idx, 1);
}
function clearUsers() {
  if (localConfig.value) localConfig.value.accessibleUsers = [];
}
function importUsersFromCSV() {
  if (!csvImportText.value || !localConfig.value) return;
  const lines = csvImportText.value.split("\n");
  lines.forEach((line) => {
    const [id, name] = line.split(",");
    if (id && name) {
      localConfig.value!.accessibleUsers.push({
        id: id.trim(),
        name: name.trim(),
      });
    }
  });
  csvImportText.value = "";
}

// Puzzle Management
function addPuzzle() {
  localConfig.value?.puzzles.push({
    title: "New Puzzle",
    language: DEFAULT_LANGUAGE,
    subtasks: [],
  });
}
function removePuzzle(idx: number) {
  if (confirm("Delete this puzzle?")) {
    localConfig.value?.puzzles.splice(idx, 1);
  }
}

function ensureGlobalRulesArray() {
  if (!localConfig.value) return;
  if (!localConfig.value.globalSpecialRules) {
    localConfig.value.globalSpecialRules = [];
  }
}

function ensurePuzzleRulesArray(pIdx: number) {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle) return;
  if (!puzzle.specialRules) {
    puzzle.specialRules = [];
  }
}

function addGlobalSpecialRule() {
  if (!localConfig.value) return;
  ensureGlobalRulesArray();
  localConfig.value.globalSpecialRules!.push(createDefaultSpecialRule());
}

function removeGlobalSpecialRule(ruleIndex: number) {
  if (!localConfig.value?.globalSpecialRules) return;
  localConfig.value.globalSpecialRules.splice(ruleIndex, 1);
}

function addPuzzleSpecialRule(pIdx: number) {
  if (!localConfig.value) return;
  ensurePuzzleRulesArray(pIdx);
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle?.specialRules) return;
  puzzle.specialRules.push(createDefaultSpecialRule());
}

function removePuzzleSpecialRule(pIdx: number, ruleIndex: number) {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle?.specialRules) return;
  puzzle.specialRules.splice(ruleIndex, 1);
}

function onRuleTypeChange(rule: SpecialRule, nextType: SpecialRule["type"]) {
  // Normalize params when switching types so we never keep stale keys
  // like { pattern, flags } after switching to composite.
  rule.type = nextType;

  if (nextType === "regex") {
    rule.params = { pattern: "", flags: "" };
    return;
  }

  if (nextType === "use") {
    rule.params = { target: "" };
    return;
  }

  if (nextType === "nestedLoop") {
    // nestedLoop currently has no parameters
    rule.params = {};
    return;
  }

  // composite
  rule.params = { op: "AND", rules: [] };
}

// Subtask Management
function addSubtask(pIdx: number) {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle) return;
  puzzle.subtasks.push({
    title: "Group 1",
    visible: [],
    hidden: [],
  });
}
function removeSubtask(pIdx: number, sIdx: number) {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle) return;
  puzzle.subtasks.splice(sIdx, 1);
}

// Test Case Management
function addTestCase(pIdx: number, sIdx: number, type: "visible" | "hidden") {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle) return;
  const subtask = puzzle.subtasks[sIdx];
  if (!subtask) return;
  subtask[type].push({
    input: "",
    output: "",
  });
}
function removeTestCase(
  pIdx: number,
  sIdx: number,
  type: "visible" | "hidden",
  tIdx: number,
) {
  if (!localConfig.value) return;
  const puzzle = localConfig.value.puzzles[pIdx];
  if (!puzzle) return;
  const subtask = puzzle.subtasks[sIdx];
  if (!subtask) return;
  subtask[type].splice(tIdx, 1);
}

// Save Actions
async function saveFullConfig() {
  const snapshot = getNormalizedConfigSnapshot();
  if (!snapshot) return;
  try {
    const parsed = examConfigSchema.parse(snapshot);

    if (examStore.config) {
      await examStore.updateConfig(parsed);
    } else {
      await examStore.createConfig(parsed);
    }
    alert("Configuration saved successfully!");
  } catch (err) {
    console.error(err);
    if (err instanceof ZodError) {
  alert("Validation Failed: " + (err.issues[0]?.message ?? "Unknown error"));
    } else {
  // Show backend error message when available
  alert("Failed to save configuration: " + ((err as any)?.message ?? "Unknown error"));
    }
  }
}

// Status & Updates
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
  localConfig.value = null;
  alert("System reset successfully.");
}

async function doInitialize() {
  const snapshot = getNormalizedConfigSnapshot();
  if (!snapshot) {
    alert("Please create or load a configuration first.");
    return;
  }
  if (
    !confirm(
      "Are you sure you want to initialize the system with the current configuration? This might overwrite existing data.",
    )
  ) {
    return;
  }

  try {
    const parsed = examConfigSchema.parse(snapshot);
    await examStore.initializeSystem(parsed);
    alert("System initialized successfully!");
  } catch (err: any) {
    console.error(err);
    if (err instanceof ZodError) {
  alert("Validation Failed: " + (err.issues[0]?.message ?? "Unknown error"));
    } else {
      alert("Failed to initialize system: " + (err.message || "Unknown error"));
    }
  }
}

function confirmTestCaseUpdate() {
  showUpdateConfirmModal.value = true;
}

async function performTestCaseUpdate() {
  const snapshot = getNormalizedConfigSnapshot();
  if (!snapshot) return;
  try {
    // Send the full config
    const parsed = examConfigSchema.parse(snapshot);
    await examStore.updateTestCase(parsed);

    // Notify students via messageStore
    await messageStore.sendMessage(
      "config_update",
      "Test cases have been updated.",
    );
    console.log("Sent config_update message to students");

    showUpdateConfirmModal.value = false;
    alert("Test cases updated and students notified.");
  } catch (err) {
    console.error(err);
    alert("Failed to update test cases");
  }
}
</script>
