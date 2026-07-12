import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { apiJson, ApiError, getStoredToken, setStoredToken } from './api';

export type UsageBucket = { used: number; limit: number; remaining: number };

export type MeUser = {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
    role: string;
    status?: string;
    badge: string;
};

export type MePayload = {
    user: MeUser;
    usage: Record<string, UsageBucket>;
    resets_in_seconds: number;
    limits: Record<string, number>;
};

type AuthState = {
    ready: boolean;
    authEnabled: boolean;
    isSignedIn: boolean;
    me: MePayload | null;
    meError: string | null;
    waitlisted: boolean;
    canUseEngine: boolean;
    email: string | null;
    displayName: string | null;
    imageUrl: string | null;
    refreshMe: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

function persistProfile(user: MeUser) {
    try {
        const existing = localStorage.getItem('sovereign_identity');
        const base = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
            'sovereign_identity',
            JSON.stringify({
                ...base,
                artistAlias: base.artistAlias || user.display_name,
                agentName: base.agentName || user.display_name,
                agentEmail: user.email || base.agentEmail || '',
            })
        );
    } catch {
        /* ignore */
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const [me, setMe] = useState<MePayload | null>(null);
    const [meError, setMeError] = useState<string | null>(null);

    const refreshMe = useCallback(async () => {
        const token = getStoredToken();
        if (!token) {
            setMe(null);
            setMeError(null);
            return;
        }
        try {
            const data = await apiJson<MePayload>('/api/me');
            setMe(data);
            setMeError(null);
            if (data.user) persistProfile(data.user);
        } catch (err) {
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                setStoredToken(null);
                setMe(null);
                setMeError(err.message);
                return;
            }
            setMeError(err instanceof Error ? err.message : 'Could not load session');
        }
    }, []);

    useEffect(() => {
        (async () => {
            await refreshMe();
            setReady(true);
        })();
    }, [refreshMe]);

    const login = useCallback(async (email: string, password: string) => {
        const data = await apiJson<any>('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        setStoredToken(data.token);
        setMe({
            user: data.user,
            usage: data.usage || {},
            resets_in_seconds: data.resets_in_seconds || 0,
            limits: data.limits || {},
        });
        persistProfile(data.user);
        setMeError(null);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const data = await apiJson<any>('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        setStoredToken(data.token);
        setMe({
            user: data.user,
            usage: data.usage || {},
            resets_in_seconds: data.resets_in_seconds || 0,
            limits: data.limits || {},
        });
        persistProfile(data.user);
        setMeError(null);
    }, []);

    const signOut = useCallback(async () => {
        try {
            await apiJson('/api/auth/logout', { method: 'POST' });
        } catch {
            /* ignore */
        }
        setStoredToken(null);
        setMe(null);
    }, []);

    const isSignedIn = Boolean(me?.user && getStoredToken());
    const value = useMemo<AuthState>(
        () => ({
            ready,
            authEnabled: true,
            isSignedIn,
            me,
            meError,
            waitlisted: false,
            canUseEngine: isSignedIn,
            email: me?.user?.email ?? null,
            displayName: me?.user?.display_name ?? null,
            imageUrl: null,
            refreshMe,
            login,
            register,
            signOut,
        }),
        [ready, isSignedIn, me, meError, refreshMe, login, register, signOut]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function isAuthEnabled() {
    return true;
}
