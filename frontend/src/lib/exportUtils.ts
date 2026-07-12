/** Client-side CSV / JSON / .eml helpers — free, no server required. */

export function downloadText(filename: string, content: string, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
    downloadText(filename, JSON.stringify(data, null, 2), 'application/json');
}

export function toCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return '';
    const keys = Array.from(
        rows.reduce((set, r) => {
            Object.keys(r).forEach((k) => set.add(k));
            return set;
        }, new Set<string>())
    );
    const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    downloadText(filename, toCsv(rows), 'text/csv');
}

/** Build RFC822 .eml for offline mail clients */
export function buildEml(opts: {
    to?: string;
    subject?: string;
    body: string;
    from?: string;
}): string {
    const to = opts.to || 'booking@venue.example';
    const subject = opts.subject || 'Booking inquiry';
    const from = opts.from || 'artist@thesourceengine.com';
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        opts.body,
    ].join('\r\n');
}

export function downloadEml(filename: string, opts: Parameters<typeof buildEml>[0]) {
    downloadText(filename, buildEml(opts), 'message/rfc822');
}

export function openMailto(opts: { to?: string; subject?: string; body: string }) {
    const params = new URLSearchParams();
    if (opts.subject) params.set('subject', opts.subject);
    params.set('body', opts.body.slice(0, 1800)); // keep URL reasonable
    const to = opts.to || '';
    window.location.href = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

const PITCH_CACHE_KEY = 'source_pitch_cache_v1';

export function cachePitch(entry: { venue: string; body: string; outreach?: string }) {
    try {
        const raw = localStorage.getItem(PITCH_CACHE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const next = [{ ...entry, ts: Date.now() }, ...list].slice(0, 30);
        localStorage.setItem(PITCH_CACHE_KEY, JSON.stringify(next));
    } catch {
        /* ignore */
    }
}

export function loadPitchCache(): Array<{ venue: string; body: string; outreach?: string; ts: number }> {
    try {
        return JSON.parse(localStorage.getItem(PITCH_CACHE_KEY) || '[]');
    } catch {
        return [];
    }
}
