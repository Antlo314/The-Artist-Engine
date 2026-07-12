/**
 * Session token auth — token stored in localStorage after login/register.
 */

const TOKEN_KEY = 'engine_session_token';

export function getStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setStoredToken(token: string | null) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        /* ignore */
    }
}

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
    return getStoredToken();
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    const token = getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
}

export async function apiJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
    const res = await apiFetch(input, init);
    const text = await res.text();
    let payload: any = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = text;
    }
    if (!res.ok) {
        throw new ApiError(res.status, payload?.detail ?? payload);
    }
    return payload as T;
}
