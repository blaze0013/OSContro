import type { AnalyzeResponse, HealthResponse, ModelHealthResponse } from '../types/api';
import { MOCK_RESPONSE_NO_SCREENSHOT, MOCK_RESPONSE_WITH_SCREENSHOT } from '../data/mocks';
import { auth } from './firebase';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiRequestError extends Error {
  code: string;
  detail?: string;
  status?: number;
  timestamp: string;

  constructor(code: string, message: string, detail?: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.detail = detail;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

export async function health(): Promise<HealthResponse> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return {
      status: 'ok',
      model: 'models/gemma-4-31b-it (mock)',
      fixture_mode: true,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) {
    throw new ApiRequestError('INTERNAL', `Health check failed with status ${res.status}`, undefined, res.status);
  }
  return res.json();
}

export async function modelHealth(): Promise<ModelHealthResponse> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return {
      ok: true,
      model: 'models/gemma-4-31b-it (mock)',
      detail: null,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/health/model`);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiRequestError(
      errorBody?.error?.code || 'MODEL_ERROR',
      errorBody?.error?.message || `Model health check failed with status ${res.status}`,
      errorBody?.error?.detail,
      res.status
    );
  }
  return res.json();
}

export async function analyze(
  repositoryUrl: string,
  screenshot?: File,
  options?: { signal?: AbortSignal }
): Promise<AnalyzeResponse> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return screenshot ? MOCK_RESPONSE_WITH_SCREENSHOT : MOCK_RESPONSE_NO_SCREENSHOT;
  }

  const formData = new FormData();
  formData.append('repository_url', repositoryUrl);
  if (screenshot) {
    formData.append('screenshot', screenshot);
  }

  const headers: Record<string, string> = {};
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Continue without token
    }
  }

  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
    headers,
    signal: options?.signal,
  });

  if (!res.ok) {
    let errCode = 'INTERNAL';
    let errMessage = 'An unexpected server error occurred.';
    let errDetail: string | undefined;

    try {
      const errJson = await res.json();
      if (errJson?.error) {
        errCode = errJson.error.code || errCode;
        errMessage = errJson.error.message || errMessage;
        errDetail = errJson.error.detail;
      }
    } catch {
      errMessage = await res.text().catch(() => errMessage);
    }

    throw new ApiRequestError(errCode, errMessage, errDetail, res.status);
  }

  return res.json();
}

