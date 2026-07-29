import { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

const INSTALL_DISMISSED = 'engine_install_dismissed_v1';

/**
 * Phone-only affordances:
 *  - "Add to home screen" — turns the Engine into a real app icon, so it opens
 *    full-screen without browser chrome.
 *  - An offline strip, so a failed search reads as "no signal" rather than
 *    "the app is broken".
 */
export default function MobileExtras() {
    const [deferred, setDeferred] = useState<any>(null);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return localStorage.getItem(INSTALL_DISMISSED) === '1';
        } catch {
            return false;
        }
    });
    const [offline, setOffline] = useState(() =>
        typeof navigator !== 'undefined' ? !navigator.onLine : false
    );

    useEffect(() => {
        const onPrompt = (e: Event) => {
            e.preventDefault();
            setDeferred(e);
        };
        const goOffline = () => setOffline(true);
        const goOnline = () => setOffline(false);
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        try {
            await deferred.userChoice;
        } catch {
            /* user dismissed the native sheet */
        }
        setDeferred(null);
    };

    const hideInstall = () => {
        try {
            localStorage.setItem(INSTALL_DISMISSED, '1');
        } catch {
            /* private mode */
        }
        setDismissed(true);
    };

    if (offline) {
        return (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 mb-4">
                <WifiOff size={15} className="text-amber-400 shrink-0" />
                <p className="text-[12px] text-ink-200 leading-snug">
                    You're offline. Your contacts and notes are still here — searches and mastering need a connection.
                </p>
            </div>
        );
    }

    if (!deferred || dismissed) return null;

    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-ember-500/15 border border-ember-500/30 flex items-center justify-center shrink-0">
                <Download size={15} className="text-ember-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-50 font-medium leading-tight">Keep this on your home screen</p>
                <p className="text-[11px] text-ink-400 mt-0.5 leading-snug">
                    Opens full-screen like an app — handy at a venue.
                </p>
            </div>
            <button
                type="button"
                onClick={install}
                className="shrink-0 rounded-full bg-ember-600 text-white text-[12px] font-medium px-3.5 py-2 min-h-[38px]"
            >
                Add
            </button>
            <button
                type="button"
                onClick={hideInstall}
                aria-label="Not now"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-500"
            >
                <X size={14} />
            </button>
        </div>
    );
}
