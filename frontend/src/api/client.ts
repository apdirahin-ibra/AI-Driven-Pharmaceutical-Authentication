import axios from "axios";
import { supabase } from "@/lib/supabase";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const detailCode = error.response?.data?.detail?.code;
    if (
      error.response?.status === 401 &&
      detailCode === "INVALID_AUTH_TOKEN" &&
      originalRequest &&
      !originalRequest._supabaseRetry
    ) {
      originalRequest._supabaseRetry = true;
      const { data } = await supabase.auth.refreshSession();
      const token = data.session?.access_token;
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
