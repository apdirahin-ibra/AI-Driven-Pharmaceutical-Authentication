import { AxiosError } from "axios";
import { apiClient } from "@/api/client";
import type { PredictionResponse } from "@/types/domain";

export interface PredictionApiError {
  title: string;
  message: string;
  code?: string;
  retryable: boolean;
  variant: "warning" | "destructive";
}

export async function predictMedicineImage(file: File): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<PredictionResponse>("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export function toPredictionApiError(error: unknown): PredictionApiError {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (detail && typeof detail === "object") {
      const code = typeof detail.code === "string" ? detail.code : undefined;
      const message = typeof detail.message === "string" ? detail.message : "The image could not be analyzed.";
      if (code?.startsWith("SUPABASE_")) {
        return {
          title: code === "SUPABASE_NOT_CONFIGURED" ? "Database not configured" : "Database unavailable",
          message,
          code,
          retryable: Boolean(detail.retryable),
          variant: "destructive",
        };
      }
      return {
        title: code === "UNSUPPORTED_IMAGE" ? "Unsupported image" : detail.retryable ? "Backend validation unavailable" : "Image validation failed",
        message,
        code,
        retryable: Boolean(detail.retryable),
        variant: code === "UNSUPPORTED_IMAGE" ? "warning" : detail.retryable ? "warning" : "destructive",
      };
    }
    if (error.code === "ECONNABORTED") {
      return {
        title: "Request timed out",
        message: "The prediction service took too long to respond. Please try again.",
        retryable: true,
        variant: "warning",
      };
    }
    if (!error.response) {
      return {
        title: "Backend offline",
        message: "The FastAPI prediction service is not reachable at the configured API URL.",
        retryable: true,
        variant: "warning",
      };
    }
    return {
      title: "API error",
      message: `The prediction service returned status ${error.response.status}.`,
      retryable: error.response.status >= 500,
      variant: error.response.status >= 500 ? "warning" : "destructive",
    };
  }
  return {
    title: "Unexpected response",
    message: "The prediction response could not be processed.",
    retryable: false,
    variant: "destructive",
  };
}

export function isUnsupportedImageError(error: PredictionApiError): boolean {
  return error.code === "UNSUPPORTED_IMAGE";
}

export function unsupportedImagePrediction(error: PredictionApiError): PredictionResponse {
  return {
    prediction: "Suspicious",
    model_prediction: "Fake",
    confidence: 0,
    scores: {
      Fake: 0,
      Real: 0,
    },
    validation: {
      status: "rejected",
      code: error.code || "UNSUPPORTED_IMAGE",
      supported_domain: "consumer_medicine_packaging",
      message: error.message,
    },
  };
}
