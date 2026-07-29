/**
 * First-visit tour state — localStorage only, no backend.
 * Keys under engine_tour_v1 so we can version-reset later.
 */

const STORAGE_KEY = 'engine_tour_v1';

export type TourId = 'welcome' | 'studio' | 'radar' | 'legal' | 'profile' | 'deals' | 'roster';

export type TourMap = Partial<Record<TourId, boolean>>;

function readMap(): TourMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeMap(map: TourMap) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        /* quota / private mode */
    }
}

export function hasSeenTour(id: TourId): boolean {
    return Boolean(readMap()[id]);
}

/**
 * Should a per-screen tour open right now?
 * No — if the user has not finished the welcome tour yet. Otherwise two
 * dialogs stack on top of each other on a brand-new account.
 */
export function shouldOpenViewTour(id: TourId): boolean {
    return hasSeenTour('welcome') && !hasSeenTour(id);
}

export function markTourSeen(id: TourId) {
    const map = readMap();
    map[id] = true;
    writeMap(map);
}

export function resetAllTours() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

/** Coach prompts (dismissible tips) — separate key so tours can reset independently */
const COACH_KEY = 'engine_coach_v1';

export function hasDismissedCoach(id: string): boolean {
    try {
        const raw = localStorage.getItem(COACH_KEY);
        if (!raw) return false;
        const map = JSON.parse(raw);
        return Boolean(map?.[id]);
    } catch {
        return false;
    }
}

export function dismissCoach(id: string) {
    try {
        const raw = localStorage.getItem(COACH_KEY);
        const map = raw ? JSON.parse(raw) : {};
        map[id] = true;
        localStorage.setItem(COACH_KEY, JSON.stringify(map));
    } catch {
        /* ignore */
    }
}

export function resetAllCoaches() {
    try {
        localStorage.removeItem(COACH_KEY);
    } catch {
        /* ignore */
    }
}

export function resetOnboarding() {
    resetAllTours();
    resetAllCoaches();
}
