import { defineStore } from "pinia";
import axios from "axios";
import { BASE_URL } from "../utilities/api";
import type { ScoreBoardFormat, StudentRecord } from "./scoreStore";
import { useScoreStore } from "./scoreStore";

export interface StudentCodeResponse {
  codeList: string[];
  codeOBJ: Record<string, string>;
}

export interface JudgeResult {
  result: ScoreBoardFormat;
}

export const useStudentDashboardStore = defineStore("studentDashboard", {
  state: () => ({
    submittedStudents: [] as string[],
    currentStudentCode: null as StudentCodeResponse | null,
    currentStudentScore: null as StudentRecord | null,
    judgeResult: null as ScoreBoardFormat | null,
    isLoading: false,
    error: null as string | null,

    isJudging: false,
    judgeError: null as string | null,
  }),

  actions: {
    async fetchSubmittedStudents() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`${BASE_URL}/code/submitted-students`);
        if (response.data?.success) {
          this.submittedStudents = response.data.data.students;
        }
      } catch (err: any) {
        console.error("Failed to fetch submitted students:", err);
        this.error = err.message || "Failed to load submitted students";
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStudentCode(studentID: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.post(`${BASE_URL}/code`, { studentID });
        if (response.data?.success) {
          this.currentStudentCode = response.data.data;
        }
      } catch (err: any) {
        console.error("Failed to fetch student code:", err);
        this.error = err.message || "Failed to load student code";
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStudentScore(studentID: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`${BASE_URL}/scoreboard/student`, {
          params: { studentID },
        });
        if (response.data?.success) {
          this.currentStudentScore = response.data.data.score;
        }
      } catch (err: any) {
        console.error("Failed to fetch student score:", err);
        // Don't set global error if just score is missing, maybe just not found
        this.error = err.message || "Failed to load student score";
      } finally {
        this.isLoading = false;
      }
    },

    async judgeStudentCode(studentID: string) {
      this.isJudging = true;
      this.judgeError = null;
      this.judgeResult = null;
      try {
        const response = await axios.post(`${BASE_URL}/code/judge`, {
          studentID,
        });
        if (response.data?.success) {
          // The API returns { result: ScoreBoardFormat } inside data
          this.judgeResult = response.data.data.result;
          // Usually re-fetch score after judging?
          await this.fetchStudentScore(studentID);

          // Also refresh the global scoreboard so SpecialRuleResults/reasons
          // shown in ScoreTable stay in sync after a rejudge.
          // NOTE: scoreStore.fetchScores() catches internally and doesn't throw,
          // but we still await it so the UI reflects updated reasons ASAP.
          await useScoreStore().fetchScores();
        }
      } catch (err: any) {
        console.error("Failed to judge student code:", err);
        this.judgeError = err.message || "Failed to execute judge";
      } finally {
        this.isJudging = false;
      }
    },

    clearCurrentStudent() {
      this.currentStudentCode = null;
      this.currentStudentScore = null;
      this.judgeResult = null;
      this.error = null;

      this.isJudging = false;
      this.judgeError = null;
    },
  },
});
