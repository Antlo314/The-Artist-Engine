/**
 * Authenticated fetch helper — attaches Supabase access token when present.
 * All heavy Engine API calls should go through this.
 */

import { getSupabase, isAuthEnabled } from './supabase';

export class ApiError extends Error {
    status: number;
    payload: any;
    constructor(status: number, payload: any) {
        const msg =
            typeof payload === 'string'
                ? payload
                : payload?.message || payload?.detail?.message || payload?.detail || `HTTP ${status}`;
        super(typeof msg === 'string' ? msg : JSON.stringify(msg));
        this.status = status;
        this.payload = payload;
    }
}

export async function getAccessToken(): Promise<string | null> {
    if (!isAuthEnabled()) return null;
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    const token = await getAccessToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    // Don't force Content-Type on FormData — browser sets boundary.
    const res = await fetch(input, { ...init, headers });
    return res;
}

export async function apiJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
    const res = await apiFetch(input, init);
    let payload: any = null;
    const text = await res.text();
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = text;
    }
    if (!res.ok) {
        // Normalize FastAPI detail shapes
        const detail = payload?.detail ?? payload;
        throw new ApiError(res.status, detail);
    }
    return payload as T;
}
