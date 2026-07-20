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
    plan_id?: string;
    auth_provider?: string;
};

export type PlanSnapshot = {
    id: string;
    name: string;
    monthly_credits?: number;
    max_lead_count?: number;
    max_scout_cities?: number;
    features?: Record<string, unknown>;
    concurrent_masters?: number;
    max_track_minutes?: number;
};

export type CreditsSnapshot = {
    balance: number;
    period_grant?: number;
    period_key?: string | null;
};

export type PromoSnapshot = {
    code: string;
    multiplier: number;
    expires_at?: string | null;
} | null;

export type MePayload = {
    user: MeUser;
    usage: Record<string, UsageBucket>;
    resets_in_seconds: number;
    limits: Record<string, number>;
    credits?: CreditsSnapshot;
    promo?: PromoSnapshot;
    plan?: PlanSnapshot;
    plan_id?: string;
    credit_costs?: Record<string, number>;
    profile?: Record<string, any>;
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
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithSupabaseToken: (accessToken: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

function persistProfile(user: MeUser, profile?: Record<string, any> | null) {
    try {
        const existing = localStorage.getItem('sovereign_identity');
        const base = existing ? JSON.parse(existing) : {};
        const p = profile || {};
        localStorage.setItem(
            'sovereign_identity',
            JSON.stringify({
                ...base,
                ...p,
                artistAlias: p.artistAlias || p.artist_alias || base.artistAlias || user.display_name,
                agentName: p.agentName || p.agent_name || base.agentName || user.display_name,
                agentEmail: p.agentEmail || p.agent_email || user.email || base.agentEmail || '',
                homeCity: p.homeCity || p.home_city || base.homeCity || '',
                primaryGenre: p.primaryGenre || p.primary_genre || base.primaryGenre || '',
                oneLiner: p.oneLiner || p.one_liner || base.oneLiner || '',
                bio: p.bio || base.bio || '',
            })
        );
        if (p.avatar_url || p.avatarUrl) {
            localStorage.setItem('sovereign_avatar', p.avatar_url || p.avatarUrl);
        }
    } catch {
        /* ignore */
    }
}

function normalizeMe(data: any): MePayload {
    return {
        user: data.user,
        usage: data.usage || {},
        resets_in_seconds: data.resets_in_seconds || 0,
        limits: data.limits || {},
        credits: data.credits || { balance: 0 },
        promo: data.promo ?? null,
        plan: data.plan,
        plan_id: data.plan_id || data.user?.plan_id || 'spark',
        credit_costs: data.credit_costs,
        profile: data.profile,
    };
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
            setMe(normalizeMe(data));
            setMeError(null);
            if (data.user) persistProfile(data.user, data.profile);
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
        setMe(normalizeMe(data));
        persistProfile(data.user, data.profile);
        setMeError(null);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const data = await apiJson<any>('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        setStoredToken(data.token);
        setMe(normalizeMe(data));
        persistProfile(data.user, data.profile);
        setMeError(null);
    }, []);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const data = await apiJson<any>('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
        });
        setStoredToken(data.token);
        setMe(normalizeMe(data));
        persistProfile(data.user, data.profile);
        setMeError(null);
    }, []);

    const loginWithSupabaseToken = useCallback(async (accessToken: string) => {
        const data = await apiJson<any>('/api/auth/supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
        });
        setStoredToken(data.token);
        setMe(normalizeMe(data));
        persistProfile(data.user, data.profile);
        setMeError(null);
    }, []);

    const signOut = useCallback(async () => {
        try {
            await apiJson('/api/auth/logout', { method: 'POST' });
        } catch {
            /* ignore */
        }
        try {
            const { signOutSupabase } = await import('./supabase');
            await signOutSupabase();
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
            loginWithGoogle,
            loginWithSupabaseToken,
            signOut,
        }),
        [ready, isSignedIn, me, meError, refreshMe, login, register, loginWithGoogle, loginWithSupabaseToken, signOut]
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
