// src/stores/examStore.ts
import { defineStore } from "pinia";
import axios from "axios";
import { z } from "zod";

// Define schemas based on user provided types
const languageSchema = z.string(); // Simplified for now, can be enum

const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

const subtaskSchema = z.object({
  title: z.string(),
  visible: z.array(testCaseSchema),
  hidden: z.array(testCaseSchema),
});

const puzzleSchema = z.object({
  title: z.string(),
  language: languageSchema,
  timeLimit: z.number().optional(),
  memoryLimit: z.number().optional(),
  subtasks: z.array(subtaskSchema),
  // Special rules are optional and may be absent in older configs.
  // We keep params flexible to allow future solvers without reshaping config.
  specialRules: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["regex", "use", "composite", "nestedLoop"]),
        constraint: z.enum(["MUST_HAVE", "MUST_NOT_HAVE"]),
        message: z.string(),
        severity: z.enum(["info", "warn"]).optional(),
        params: z.unknown(),
      }),
    )
    .optional(),
});

const accessUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const examConfigSchema = z.object({
  testTitle: z.string(),
  description: z.string(),
  judgerSettings: z.object({
    timeLimit: z.number(),
    memoryLimit: z.number(),
  }),
  accessibleUsers: z.array(accessUserSchema),
  globalSpecialRules: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["regex", "use", "composite", "nestedLoop"]),
        constraint: z.enum(["MUST_HAVE", "MUST_NOT_HAVE"]),
        message: z.string(),
        severity: z.enum(["info", "warn"]).optional(),
        params: z.unknown(),
      }),
    )
    .optional(),
  puzzles: z.array(puzzleSchema),
});

export type ExamConfig = z.infer<typeof examConfigSchema>;

// Base URL configuration - assuming it matches the existing api.ts or env
const BASE_URL = "http://localhost:3002";

export const useExamStore = defineStore("exam", {
  state: () => ({
    config: null as ExamConfig | null,
    isExamStarted: false,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchConfig() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`${BASE_URL}/config`);
        if (response.data?.data) {
          this.config = response.data.data;
        }
      } catch (err: any) {
        // It's possible config doesn't exist yet, handle gracefully if 404
        console.error("Error fetching config", err);
        this.error = err.message || "Failed to fetch configuration";
      } finally {
        this.isLoading = false;
      }
    },

    async createConfig(config: ExamConfig) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.post(`${BASE_URL}/config`, config);
        this.config = config;
      } catch (err: any) {
        console.error("Error creating config", err);
        this.error = err.message || "Failed to create configuration";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateConfig(config: ExamConfig) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.put(`${BASE_URL}/config`, config);
        this.config = config;
      } catch (err: any) {
        // Try to surface server-side validation errors (body.message or body.error)
        console.error("Error updating config", err);
        const serverMsg =
          err?.response?.data?.message ||
          (err?.response?.data && JSON.stringify(err.response.data)) ||
          err.message ||
          "Failed to update configuration";
        this.error = serverMsg;
        // throw a new Error so callers (UI) receive a readable message
        throw new Error(serverMsg);
      } finally {
        this.isLoading = false;
      }
    },

    async updateTestCase(config: ExamConfig) {
      this.isLoading = true;
      this.error = null;
      try {
        console.log("Updating test case with full config:", config);
        await axios.put(`${BASE_URL}/config/testcase`, config);
        // Optionally refetch config or update local state partially
        await this.fetchConfig();
      } catch (err: any) {
        console.error("Error updating test cases", err);
        this.error = err.message || "Failed to update test cases";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStatus() {
      try {
        const response = await axios.get(`${BASE_URL}/status`);
        if (response.data && response.data.data) {
          this.isExamStarted = response.data.data.exam_status;
        }
      } catch (err) {
        console.error("Error fetching status", err);
      }
    },

    async setExamStatus(status: boolean) {
      this.isLoading = true;
      try {
        await axios.put(`${BASE_URL}/status`, { exam_status: status });
        this.isExamStarted = status;
      } catch (err: any) {
        console.error("Error setting exam status", err);
        this.error = err.message || "Failed to update exam status";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async resetSystem() {
      this.isLoading = true;
      try {
        // Using the endpoint found in existing utilities/api.ts logic
        await axios.post(`${BASE_URL}/reset`, { clearSettings: true });
        this.config = null;
        this.isExamStarted = false;
      } catch (err: any) {
        console.error("Error resetting system", err);
        this.error = err.message || "Failed to reset system";
      } finally {
        this.isLoading = false;
      }
    },

    async initializeSystem(config: ExamConfig) {
      this.isLoading = true;
      this.error = null;
      try {
        await axios.post(`${BASE_URL}/init`, config);
        this.config = config;
        this.isExamStarted = false;
      } catch (err: any) {
        console.error("Error initializing system", err);
        this.error = err.message || "Failed to initialize system";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
