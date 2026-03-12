import { defineStore } from "pinia";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../utilities/api";

export interface AnticheatLog {
  id: number | string;
  student_id: string;
  time: string;
  type: string;
  ipAddress: string;
  mac?: string;
  messeage?: string; // Some APIs use message, some might use messeage typo based on previous code
  message?: string;
  isOk: boolean;
}

interface AnticheatState {
  logs: AnticheatLog[];
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  realtimeOn: boolean;
}

export const useAnticheatStore = defineStore("anticheat", {
  state: (): AnticheatState => ({
    logs: [],
    isLoading: false,
    error: null,
    socket: null,
    realtimeOn: true,
  }),

  actions: {
    async fetchAllLogs() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`${BASE_URL}/anticheat/logs`);
        this.logs = response.data.data.logs;
      } catch (err: any) {
        console.error("Failed to fetch anticheat logs:", err);
        this.error = err.message || "Failed to fetch logs";
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStudentLogs(studentId: string) {
      if (!studentId) return;
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `${BASE_URL}/anticheat/logs/${studentId}`,
        );
        this.logs = response.data;
      } catch (err: any) {
        console.error(`Failed to fetch logs for student ${studentId}:`, err);
        this.error = err.message || "Failed to fetch student logs";
      } finally {
        this.isLoading = false;
      }
    },

    async updateLogStatus(id: number | string, isOk: boolean) {
      if (!id) return;

      // Optimistic update
      const logIndex = this.logs.findIndex((l) => l.id === id);
      const originalIsOk = logIndex !== -1 ? this.logs[logIndex].isOk : false;

      if (logIndex !== -1) {
        this.logs[logIndex].isOk = isOk;
      }

      try {
        await axios.put(`${BASE_URL}/anticheat/status`, {
          id: id,
          isOk: isOk,
        });
      } catch (err: any) {
        console.error("Failed to update log status:", err);
        // Revert on failure
        if (logIndex !== -1) {
          this.logs[logIndex].isOk = originalIsOk;
        }
        this.error = err.message || "Failed to update log status";
        throw err;
      }
    },

    upsertLogs(newLogs: AnticheatLog[]) {
      const map = new Map(this.logs.map((l) => [l.id, l]));
      newLogs.forEach((l) => map.set(l.id, l));
      this.logs = Array.from(map.values()).sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      );
    },

    setupSocket() {
      if (this.socket) return;
      const url = BASE_URL.replace("/admin", "");
      this.socket = io(url, { transports: ["websocket"] });

      this.socket.on("connect", () => console.log("socket connected"));
      this.socket.on("disconnect", () => console.log("socket disconnected"));
      this.socket.on("connect_error", (err) =>
        console.error("socket error", err),
      );

      this.socket.on(
        "new-alert",
        (payload: {
          success: boolean;
          result: AnticheatLog[] | AnticheatLog;
        }) => {
          if (!payload?.success || !payload.result) return;
          const incoming = Array.isArray(payload.result)
            ? payload.result
            : [payload.result];
          this.upsertLogs(incoming);
        },
      );
    },

    teardownSocket() {
      if (!this.socket) return;
      this.socket.off("newAlert");
      this.socket.disconnect();
      this.socket = null;
    },

    toggleRealtime(value?: boolean) {
      if (typeof value === "boolean") {
        this.realtimeOn = value;
      } else {
        this.realtimeOn = !this.realtimeOn;
      }

      if (this.realtimeOn) {
        this.setupSocket();
      } else {
        this.teardownSocket();
      }
    },
  },
});
