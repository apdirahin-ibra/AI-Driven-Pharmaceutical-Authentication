import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getRiskReports, getScanRecords, subscribeRecordsChanged } from "@/api/records";
import type { RiskReport, ScanRecord } from "@/types/domain";

interface RecordsState<T> {
  records: T[];
  isLoading: boolean;
  error: string;
}

export function useScanRecords(): RecordsState<ScanRecord> {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      getScanRecords()
        .then((nextRecords) => {
          if (!active) return;
          setRecords(nextRecords);
          setError("");
          setIsLoading(false);
        })
        .catch((caughtError) => {
          if (!active) return;
          setRecords([]);
          setError(recordErrorMessage(caughtError, "scan history"));
          setIsLoading(false);
        });
    };
    load();
    const unsubscribe = subscribeRecordsChanged(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { records, isLoading, error };
}

export function useRiskReports(): RecordsState<RiskReport> {
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      getRiskReports()
        .then((nextReports) => {
          if (!active) return;
          setReports(nextReports);
          setError("");
          setIsLoading(false);
        })
        .catch((caughtError) => {
          if (!active) return;
          setReports([]);
          setError(recordErrorMessage(caughtError, "risk reports"));
          setIsLoading(false);
        });
    };
    load();
    const unsubscribe = subscribeRecordsChanged(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { records: reports, isLoading, error };
}

function recordErrorMessage(error: unknown, label: string): string {
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") {
      return `Could not load ${label}. The database request timed out. Check your internet connection and try again.`;
    }

    if (!error.response) {
      return `Could not load ${label}. The FastAPI backend is not reachable.`;
    }

    const detail = error.response.data?.detail;
    if (typeof detail?.message === "string") {
      return detail.message;
    }

    if (error.response.status === 401) {
      return "Your login session expired. Sign out and sign in again.";
    }
  }

  return `Could not load ${label}. Check your Supabase session and backend connection.`;
}
