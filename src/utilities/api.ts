import axios from "axios";

export const BASE_URL = "http://localhost:3001/admin";

export async function initService(initJson: any): Promise<boolean> {
  try {
    const { status } = await axios.post(`${BASE_URL}/init`, initJson);
    return status === 200;
  } catch (error) {
    console.error("Failed to initialize service:", error);
    return false;
  }
}

export async function isConfigured(): Promise<boolean> {
  try {
    const response = await axios.get(`${BASE_URL}/is-configured`);
    return response.data.data.isConfigured; // boolean
  } catch (error) {
    console.error("Failed to check configuration status:", error);
    return false;
  }
}

export async function resetDatabaseService(): Promise<boolean> {
  try {
    const response = await axios.get(`${BASE_URL}/reset-database`);
    return response.status === 200;
  } catch (error) {
    console.error("Failed to reset service:", error);
    return false;
  }
}

export async function executeCode(studentID: string): Promise<any> {
  try {
    const response = await axios.post(`${BASE_URL}/judge-code`, { studentID });
    return response.data.data;
  } catch (error) {
    console.error("Failed to execute code:", error);
    return null;
  }
}

export async function getSubmittedStudents(): Promise<string[]> {
  try {
    const response = await axios.get(`${BASE_URL}/get-submitted-students`);
    return response.data.data.result; // string[]
  } catch (error) {
    console.error("Failed to get submitted students:", error);
    return [];
  }
}

export async function getAllStudentsScores(): Promise<any> {
  try {
    const response = await axios.post(`${BASE_URL}/all-student-scores`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to get all students scores:", error);
    return null;
  }
}

export async function updateLogs(): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}/update-alert-list`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to get alert logs:", error);
    return [];
  }
}

export async function getAlertList(): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}/get-alert-logs`);
    return response.data.data.result;
  } catch (error) {
    console.error("Failed to get alert list:", error);
    return [];
  }
}

export async function modifyAlertStatus(
  alertID: string,
  isOK: boolean
): Promise<boolean> {
  try {
    const response = await axios.post(`${BASE_URL}/set-alert-ok-status`, {
      id: alertID,
      isOk: isOK,
    });
    return response.data.success; // boolean
  } catch (error) {
    console.error("Failed to modify alert status:", error);
    return false;
  }
}

export async function getAllLogs(): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}/get-all-logs`);
    return response.data.data.result; // any[]
  } catch (error) {
    console.error("Failed to get all logs:", error);
    return [];
  }
}
