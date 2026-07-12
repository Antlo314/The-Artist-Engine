import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    ClerkProvider,
    useAuth as useClerkAuth,
    useUser,
    SignedIn,
    SignedOut,
} from '@clerk/clerk-react';
import { setTokenGetter, apiJson, ApiError } from './api';

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
    isSignedIn: boolean;
    me: MePayload | null;
    meError: string | null;
    waitlisted: boolean;
    canUseEngine: boolean;
    email: string | null;
    displayName: string | null;
    imageUrl: string | null;
    refreshMe: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const publishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || '';

export function isAuthEnabled(): boolean {
    return Boolean(publishableKey);
}

function AuthBridge({ children }: { children: ReactNode }) {
    const authEnabled = isAuthEnabled();
    const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
    const { user } = useUser();
    const [me, setMe] = useState<MePayload | null>(null);
    const [meError, setMeError] = useState<string | null>(null);
    const [waitlisted, setWaitlisted] = useState(false);

    // Register token getter for apiFetch
    useEffect(() => {
        if (!authEnabled) {
            setTokenGetter(null);
            return;
        }
        setTokenGetter(async () => {
            try {
                return (await getToken()) || null;
            } catch {
                return null;
            }
        });
        return () => setTokenGetter(null);
    }, [authEnabled, getToken]);

    const refreshMe = useCallback(async () => {
        if (!authEnabled || !isSignedIn) {
            setMe(null);
            setWaitlisted(false);
            setMeError(null);
            return;
        }
        try {
            const data = await apiJson<MePayload>('/api/me');
            setMe(data);
            setWaitlisted(false);
            setMeError(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                const code = (err.payload as any)?.error;
                if (code === 'not_founding_member') {
                    setWaitlisted(true);
                    setMe(null);
                    setMeError(err.message);
                    return;
                }
            }
            // Backend may still be open / cold — still allow engine if Clerk session exists
            // and no allowlist rejection.
            if (err instanceof ApiError && err.status === 401) {
                setMeError(err.message);
            } else {
                // Soft: signed-in users can use app; meters fill when /api/me works
                setMeError(err instanceof Error ? err.message : 'Could not load usage');
            }
            setMe(null);
        }
    }, [authEnabled, isSignedIn]);

    useEffect(() => {
        if (!isLoaded) return;
        refreshMe();
    }, [isLoaded, isSignedIn, refreshMe]);

    // Persist lightweight profile for Studio pitches when Clerk has identity
    useEffect(() => {
        if (!user) return;
        try {
            const existing = localStorage.getItem('sovereign_identity');
            const base = existing ? JSON.parse(existing) : {};
            const email = user.primaryEmailAddress?.emailAddress || '';
            const name = user.fullName || user.firstName || base.artistAlias || 'Artist';
            localStorage.setItem(
                'sovereign_identity',
                JSON.stringify({
                    ...base,
                    artistAlias: base.artistAlias || name,
                    agentName: base.agentName || name,
                    agentEmail: base.agentEmail || email,
                })
            );
            if (user.imageUrl) {
                localStorage.setItem('sovereign_avatar', user.imageUrl);
            }
        } catch {
            /* ignore */
        }
    }, [user]);

    const ready = !authEnabled || isLoaded;
    const canUseEngine =
        !authEnabled || (Boolean(isSignedIn) && !waitlisted);

    const value = useMemo<AuthState>(
        () => ({
            ready,
            authEnabled,
            isSignedIn: Boolean(isSignedIn),
            me,
            meError,
            waitlisted,
            canUseEngine,
            email: user?.primaryEmailAddress?.emailAddress ?? null,
            displayName: user?.fullName || user?.firstName || null,
            imageUrl: user?.imageUrl ?? null,
            refreshMe,
        }),
        [
            ready,
            authEnabled,
            isSignedIn,
            me,
            meError,
            waitlisted,
            canUseEngine,
            user,
            refreshMe,
        ]
    );

    // expose signOut via window for badge? FoundingBadge uses Clerk UserButton instead
    void signOut;

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    if (!publishableKey) {
        // Open mode — no Clerk key
        const openValue: AuthState = {
            ready: true,
            authEnabled: false,
            isSignedIn: false,
            me: null,
            meError: null,
            waitlisted: false,
            canUseEngine: true,
            email: null,
            displayName: null,
            imageUrl: null,
            refreshMe: async () => {},
        };
        return <AuthCtx.Provider value={openValue}>{children}</AuthCtx.Provider>;
    }

    return (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
            <AuthBridge>{children}</AuthBridge>
        </ClerkProvider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export { SignedIn, SignedOut };
