import axios from "axios";

const BASE_URL = "http://localhost:3001/admin";

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
    return response.data.isConfigured; // boolean
  } catch (error) {
    console.error("Failed to check configuration status:", error);
    return false;
  }
}

export async function restoreService(): Promise<boolean> {
  try {
    const response = await axios.get(`${BASE_URL}/restore`);
    return response.status === 200;
  } catch (error) {
    console.error("Failed to restore service:", error);
    return false;
  }
}

export async function executeCode(studentID: string): Promise<any> {
  try {
    const response = await axios.post(`${BASE_URL}/judge-code`, { studentID });
    console.log("Execute code response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to execute code:", error);
    return null;
  }
}

export async function getSubmittedStudents(): Promise<string[]> {
  try {
    const response = await axios.get(`${BASE_URL}/get-submitted-students`);
    return response.data.result; // string[]
  } catch (error) {
    console.error("Failed to get submitted students:", error);
    return [];
  }
}

export async function getAllStudentsScores(): Promise<any> {
  try {
    const response = await axios.post(`${BASE_URL}/all-student-scores`);
    return response.data; // any
  } catch (error) {
    console.error("Failed to get all students scores:", error);
    return null;
  }
}
// export async function getSubmittedStudents(): Promise<string[]> {
