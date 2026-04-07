import { defineStore } from "pinia";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../utilities/api";

// Interfaces based on the prompt
export type StatusCode = "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "SE";

export interface TestCaseRecord {
  status: StatusCode;
  userOutput: string;
  expectedOutput: string;
  time: string;
}

export interface Subtask {
  hidden: TestCaseRecord[];
  visible: TestCaseRecord[];
}

export type SpecialRuleResultRecord = {
  ruleId: string;
  passed: boolean;
  message: string;
  reason?: string;
  checkedAt: string; // ISO
};

export type PuzzleResultPayload = {
  subtasks: Subtask[];
  specialRuleResults?: SpecialRuleResultRecord[];
};

export interface ScoreBoardFormat {
  // Canonical shape (post-BC drop): always a wrapper object per puzzle.
  [problemID: string]: PuzzleResultPayload;
}

export interface StudentRecord {
  id: number;
  student_ID: string;
  student_name: string;
  last_submit_time: string | null;
  subtask_amount: number;
  passed_subtask_amount: number;
  puzzle_amount: number;
  passed_puzzle_amount: number;
  puzzle_results: ScoreBoardFormat;
}

export interface ScoresPayload {
  success: boolean;
  data: {
    scores: StudentRecord[];
  };
}

export const useScoreStore = defineStore("score", {
  state: () => ({
    records: [] as StudentRecord[],
    loading: false,
    error: null as string | null,
    socket: null as Socket | null,
  }),

  actions: {
    async fetchScores() {
      this.loading = true;
      this.error = null;
      try {
        // Updated API path: /scoreboard
        const response = await axios.get(`${BASE_URL}/scoreboard`);
        if (response.data?.success && response.data?.data?.scores) {
          this.records = response.data.data.scores;
        } else {
          // Fallback for different response structure if needed, but based on prompt it is data.scores
          if (Array.isArray(response.data?.data)) {
            this.records = response.data.data;
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch scores:", err);
        this.error = err.message || "Failed to load scores";
      } finally {
        this.loading = false;
      }
    },

    setupSocket() {
      if (this.socket) return;

      const url = BASE_URL.replace("/admin", ""); // Adjust as per existing logic
      this.socket = io(url, { transports: ["websocket"] });

      this.socket.on("connect", () => {
        console.log("Scoreboard socket connected");
      });

      this.socket.on("score-update", (payload: any) => {
        // Handling broadcast updates.
        // Assuming payload might be full list or partial.
        // If full list:
        if (payload?.data?.scores) {
          this.records = payload.data.scores;
        } else {
          // Re-fetch if payload structure is unclear or just notification
          this.fetchScores();
        }
      });

      this.socket.on("disconnect", () => {
        console.log("Scoreboard socket disconnected");
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },
  },
});
