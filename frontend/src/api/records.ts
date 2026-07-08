import { apiClient } from "@/api/client";
import type { PredictionResponse, RiskReport, RiskStatus, ScanRecord } from "@/types/domain";

const RECORDS_CHANGED_EVENT = "pharmaguard:records-changed";
const DATABASE_TIMEOUT_MS = 30000;

interface NewScanInput {
  fileName: string;
  imageDataUrl?: string;
}

export async function getScanRecords(): Promise<ScanRecord[]> {
  const response = await apiClient.get<ScanRecord[]>("/scans", { timeout: DATABASE_TIMEOUT_MS });
  return response.data;
}

export async function getRiskReports(): Promise<RiskReport[]> {
  const response = await apiClient.get<RiskReport[]>("/reports", { timeout: DATABASE_TIMEOUT_MS });
  return response.data;
}

export async function savePredictionScan(prediction: PredictionResponse, input: NewScanInput): Promise<ScanRecord> {
  const response = await apiClient.post<ScanRecord>("/scans", {
    prediction,
    fileName: input.fileName,
    imageDataUrl: input.imageDataUrl,
  }, {
    timeout: DATABASE_TIMEOUT_MS,
  });
  notifyRecordsChanged();
  return response.data;
}

export async function updateRiskReport(id: string, status: RiskStatus, notes?: string): Promise<RiskReport[]> {
  const response = await apiClient.patch<RiskReport[]>(`/reports/${encodeURIComponent(id)}`, {
    status,
    notes,
  }, {
    timeout: DATABASE_TIMEOUT_MS,
  });
  notifyRecordsChanged();
  return response.data;
}

export function subscribeRecordsChanged(listener: () => void): () => void {
  window.addEventListener(RECORDS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(RECORDS_CHANGED_EVENT, listener);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function notifyRecordsChanged(): void {
  window.dispatchEvent(new CustomEvent(RECORDS_CHANGED_EVENT));
}
