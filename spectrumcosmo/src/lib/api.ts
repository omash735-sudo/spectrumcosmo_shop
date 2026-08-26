export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function apiFetch(endpoint: string, options?: RequestInit) {
  return fetch(`${API_BASE}${endpoint}`, options);
}

export async function apiGet(endpoint: string, options?: RequestInit) {
  const res = await apiFetch(endpoint, {
    method: 'GET',
    ...options,
  });
  return res.json();
}

export async function apiPost(endpoint: string, data?: any, options?: RequestInit) {
  const res = await apiFetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  return res.json();
}

export async function apiPut(endpoint: string, data?: any, options?: RequestInit) {
  const res = await apiFetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  return res.json();
}

export async function apiDelete(endpoint: string, options?: RequestInit) {
  const res = await apiFetch(endpoint, {
    method: 'DELETE',
    ...options,
  });
  return res.json();
}
