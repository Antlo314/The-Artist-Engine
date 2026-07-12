/**
 * Authenticated fetch — attaches Clerk session token when signed in.
 */

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

/** Wired once from AuthProvider (Clerk getToken). */
export function setTokenGetter(fn: TokenGetter | null) {
    tokenGetter = fn;
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
    if (!tokenGetter) return null;
    try {
        return await tokenGetter();
    } catch {
        return null;
    }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers || {});
    const token = await getAccessToken();
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
