import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
    return Boolean(url && anon);
}

export function getSupabase(): SupabaseClient | null {
    if (!isSupabaseConfigured()) return null;
    if (!client) {
        client = createClient(url, anon, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    }
    return client;
}

/** Start Google OAuth via Supabase (redirects away). */
export async function signInWithGoogleSupabase(): Promise<void> {
    const sb = getSupabase();
    if (!sb) {
        throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) throw error;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
}

export async function signOutSupabase(): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
}
