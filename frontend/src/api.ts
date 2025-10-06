// src/api.ts
import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: handle 401 globally (logout/expired)
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;
    if (status === 401) {
      // Clear token and bounce to login (avoid loops if already there)
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    // Re-throw the error so callers can show messages
    return Promise.reject(err);
  }
);

// Small helper to extract a readable error
export function getApiError(e: unknown, fallback = "Something went wrong") {
  const ax = e as AxiosError<any>;
  return (
    ax?.response?.data?.detail ||
    ax?.response?.data?.message ||
    ax?.message ||
    fallback
  );
}
