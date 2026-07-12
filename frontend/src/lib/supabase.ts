/** @deprecated Supabase auth removed — Clerk handles sign-in now. */
export function isAuthEnabled(): boolean {
    return Boolean((import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim());
}
