import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isAuthEnabled } from './supabase';
import { apiJson, ApiError } from './api';

export type UsageBucket = { used: number; limit: number; remaining: number };

export type MePayload = {
    user: {
        id: string;
        email: string;
        display_name: string;
        avatar_url: string;
        role: string;
        status: string;
        badge: string;
    };
    usage: Record<string, UsageBucket>;
    resets_in_seconds: number;
    limits: Record<string, number>;
};

type AuthState = {
    ready: boolean;
    authEnabled: boolean;
    session: Session | null;
    user: User | null;
    me: MePayload | null;
    meError: string | null;
    waitlisted: boolean;
    /** True when signed in + founding (or auth off for local dev). */
    canUseEngine: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshMe: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const authEnabled = isAuthEnabled();
    const [ready, setReady] = useState(!authEnabled);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [me, setMe] = useState<MePayload | null>(null);
    const [meError, setMeError] = useState<string | null>(null);
    const [waitlisted, setWaitlisted] = useState(false);

    const refreshMe = useCallback(async () => {
        if (!authEnabled) {
            setMe(null);
            setWaitlisted(false);
            setMeError(null);
            return;
        }
        if (!session?.access_token) {
            setMe(null);
            setWaitlisted(false);
            return;
        }
        try {
            const data = await apiJson<MePayload>('/api/me');
            setMe(data);
            setWaitlisted(false);
            setMeError(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                const code = err.payload?.error;
                if (code === 'not_founding_member') {
                    setWaitlisted(true);
                    setMe(null);
                    setMeError(err.message);
                    return;
                }
            }
            setMe(null);
            setMeError(err instanceof Error ? err.message : 'Could not load founding profile');
        }
    }, [authEnabled, session?.access_token]);

    useEffect(() => {
        if (!authEnabled) {
            setReady(true);
            return;
        }
        const sb = getSupabase()!;
        let mounted = true;

        sb.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setReady(true);
        });

        const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
            setSession(next);
            setUser(next?.user ?? null);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [authEnabled]);

    useEffect(() => {
        if (!ready) return;
        refreshMe();
    }, [ready, session?.access_token, refreshMe]);

    const signInWithGoogle = useCallback(async () => {
        const sb = getSupabase();
        if (!sb) throw new Error('Auth is not configured (missing VITE_SUPABASE_URL).');
        const redirectTo = `${window.location.origin}/engine`;
        const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
        });
        if (error) throw error;
    }, []);

    const signOut = useCallback(async () => {
        const sb = getSupabase();
        if (sb) await sb.auth.signOut();
        setMe(null);
        setWaitlisted(false);
        setMeError(null);
    }, []);

    const canUseEngine = !authEnabled || (!!session && !waitlisted && !!me);

    const value = useMemo<AuthState>(
        () => ({
            ready,
            authEnabled,
            session,
            user,
            me,
            meError,
            waitlisted,
            canUseEngine,
            signInWithGoogle,
            signOut,
            refreshMe,
        }),
        [
            ready,
            authEnabled,
            session,
            user,
            me,
            meError,
            waitlisted,
            canUseEngine,
            signInWithGoogle,
            signOut,
            refreshMe,
        ]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
