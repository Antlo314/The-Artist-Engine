import { useMemo, useState, useRef, useEffect } from 'react';
import { Upload, Save, CheckCircle, RotateCcw } from 'lucide-react';
import { PageHeader, Panel, Field, Btn } from './ui/Shell';
import { apiJson } from '../lib/api';
import { downloadText, downloadJson } from '../lib/exportUtils';
import { useAuth } from '../lib/auth';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import { hasSeenTour, resetOnboarding } from '../lib/onboarding';

interface ArtistProfileProps {
    profile: any;
    setProfile: React.Dispatch<React.SetStateAction<any>>;
}

const inputCls =
    'bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm focus:border-yellow-500/50 focus:outline-none transition-colors w-full min-h-[44px]';

function completenessScore(profile: any, hasAvatar: boolean): { pct: number; missing: string[] } {
    const checks: { key: string; ok: boolean; label: string }[] = [
        { key: 'alias', ok: Boolean(profile.artistAlias?.trim()), label: 'Artist alias' },
        { key: 'city', ok: Boolean(profile.homeCity?.trim()), label: 'Home city' },
        { key: 'genre', ok: Boolean(profile.primaryGenre?.trim()), label: 'Primary genre' },
        { key: 'email', ok: Boolean(profile.agentEmail?.trim()), label: 'Routing email' },
        { key: 'social', ok: Boolean(profile.agentSocial?.trim()), label: 'Social link' },
        { key: 'bio', ok: Boolean((profile.bio || profile.oneLiner || '').trim()), label: 'Bio / one-liner' },
        {
            key: 'stream',
            ok: Boolean(profile.spotifyUrl || profile.appleUrl || profile.youtubeUrl),
            label: 'Streaming link',
        },
        { key: 'avatar', ok: hasAvatar, label: 'Avatar' },
    ];
    const done = checks.filter((c) => c.ok).length;
    return {
        pct: Math.round((done / checks.length) * 100),
        missing: checks.filter((c) => !c.ok).map((c) => c.label),
    };
}

export default function ArtistProfile({ profile, setProfile }: ArtistProfileProps) {
    const { email, displayName, me, signOut, refreshMe } = useAuth();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(localStorage.getItem('sovereign_avatar'));
    const [isSaved, setIsSaved] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);
    const [epk, setEpk] = useState<any | null>(null);
    const [epkBusy, setEpkBusy] = useState(false);
    const [epkErr, setEpkErr] = useState<string | null>(null);
    const [showProfileTour, setShowProfileTour] = useState(() => !hasSeenTour('profile'));
    const [tourResetNote, setTourResetNote] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stats = me?.profile?.stats || {};

    // Hydrate from server profile when available
    useEffect(() => {
        const p = me?.profile;
        if (!p) return;
        setProfile((prev: any) => ({
            ...prev,
            artistAlias: p.artistAlias || p.artist_alias || prev.artistAlias,
            oneLiner: p.oneLiner || p.one_liner || prev.oneLiner,
            bio: p.bio || prev.bio,
            homeCity: p.homeCity || p.home_city || prev.homeCity,
            primaryGenre: p.primaryGenre || p.primary_genre || prev.primaryGenre,
            targetMarkets: p.targetMarkets || p.target_markets || prev.targetMarkets,
            agentName: p.agentName || p.agent_name || prev.agentName,
            agentEmail: p.agentEmail || p.agent_email || prev.agentEmail || email || '',
            agentPhone: p.agentPhone || p.agent_phone || prev.agentPhone,
            agentSocial: p.agentSocial || p.agent_social || prev.agentSocial,
            spotifyUrl: p.spotifyUrl || p.spotify_url || prev.spotifyUrl,
            appleUrl: p.appleUrl || p.apple_url || prev.appleUrl,
            youtubeUrl: p.youtubeUrl || p.youtube_url || prev.youtubeUrl,
            otherUrl: p.otherUrl || p.other_url || prev.otherUrl,
        }));
        if (p.avatar_url || p.avatarUrl) {
            setAvatarPreview(p.avatar_url || p.avatarUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me?.profile?.updated_at, email]);

    const score = useMemo(
        () => completenessScore(profile, Boolean(avatarPreview)),
        [profile, avatarPreview]
    );

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                localStorage.setItem('sovereign_avatar', base64String);
                setAvatarPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaveErr(null);
        try {
            await apiJson('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artist_alias: profile.artistAlias,
                    one_liner: profile.oneLiner,
                    bio: profile.bio,
                    home_city: profile.homeCity,
                    primary_genre: profile.primaryGenre,
                    target_markets: profile.targetMarkets,
                    agent_name: profile.agentName,
                    agent_email: profile.agentEmail,
                    agent_phone: profile.agentPhone,
                    agent_social: profile.agentSocial,
                    spotify_url: profile.spotifyUrl,
                    apple_url: profile.appleUrl,
                    youtube_url: profile.youtubeUrl,
                    other_url: profile.otherUrl,
                    avatar_url: avatarPreview || '',
                    onboarding_done: true,
                }),
            });
            await refreshMe();
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (e: any) {
            setSaveErr(e?.message || 'Could not save profile to server');
            // still mark local save
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }
    };

    const setField = (key: string, value: string) => setProfile({ ...profile, [key]: value });

    return (
        <div className="space-y-6">
            <PageHeader
                view="profile"
                accent="#eab308"
                module="IDENTITY"
                title="Profile"
                desc="Powers Find Gigs defaults, pitch footers, and your free EPK pack."
            />
            <CoachPrompt id="profile-power-tip" accent="#eab308" title="Profile tip">
                Fill alias, city, genre, bio, and one streaming link — pitch drafts and scouts get smarter. Saved to your
                account (server profile), not just this browser.
            </CoachPrompt>

            {me?.profile?.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        ['Masters', stats.masters_total],
                        ['Scouts', stats.scouts_total],
                        ['Pitches', stats.pitches_total],
                        ['Open leads', stats.leads_open],
                    ].map(([label, val]) => (
                        <div key={String(label)} className="glass-obsidian border border-white/10 rounded-xl p-3">
                            <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">{label}</p>
                            <p className="font-display text-xl tabular-nums mt-0.5">{Number(val) || 0}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Completeness */}
            <Panel title="Profile power" sub={`${score.pct}% ready for stronger pitches`} accent="#eab308" sheen>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="3"
                                strokeDasharray={`${score.pct}, 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-ink-50">
                            {score.pct}%
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-ink-200 leading-relaxed">
                            {score.pct >= 75
                                ? 'Strong profile — pitches will include your proof links.'
                                : 'Add the missing pieces below to unlock better outreach defaults.'}
                        </p>
                        {score.missing.length > 0 && (
                            <p className="font-mono text-[10px] text-ink-500 tracking-wide mt-2">
                                Missing: {score.missing.join(' · ')}
                            </p>
                        )}
                    </div>
                </div>
            </Panel>

            {(email || me) && (
                <Panel title="Account" sub="Signed-in user" accent="#eab308">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm text-ink-50 truncate">
                                {displayName || me?.user?.display_name || 'Member'}
                            </p>
                            <p className="font-mono text-xs text-ink-400 truncate mt-0.5">
                                {email || me?.user?.email}
                            </p>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-ember-400 mt-2">
                                {me?.user?.badge || (me?.user?.role === 'admin' ? 'Admin' : 'Member')}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Btn
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    resetOnboarding();
                                    setTourResetNote(true);
                                    setTimeout(() => setTourResetNote(false), 4000);
                                }}
                            >
                                <RotateCcw size={14} /> Replay tours
                            </Btn>
                            <Btn variant="ghost" size="sm" onClick={() => signOut()}>
                                Sign out
                            </Btn>
                        </div>
                    </div>
                    {tourResetNote && (
                        <p className="mt-2 text-xs text-emerald-400">
                            Tours reset — open any pillar (or refresh) to see walkthroughs again.
                        </p>
                    )}
                </Panel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <Panel title="Identity" sub="Used to personalize pitches & scouts" accent="#eab308" sheen>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div
                                    className="relative w-28 h-28 rounded-full border-2 border-dashed border-yellow-500/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-yellow-500/70 transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Artist avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-yellow-500/50 group-hover:text-yellow-400 transition-colors">
                                            <Upload size={22} />
                                            <span className="font-mono text-[9px] tracking-widest uppercase">Upload</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <span className="font-mono text-[9px] text-ink-700 tracking-widest uppercase">Avatar</span>
                            </div>

                            <div className="flex-1 space-y-4">
                                <Field label="Artist / project alias">
                                    <input
                                        type="text"
                                        value={profile.artistAlias || ''}
                                        onChange={(e) => setField('artistAlias', e.target.value)}
                                        placeholder="Echovelocity"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="One-liner / bio" hint="Appended to pitch drafts">
                                    <textarea
                                        value={profile.bio || profile.oneLiner || ''}
                                        onChange={(e) => setField('bio', e.target.value)}
                                        placeholder="Chicago deep-house act · 50k monthly listeners · sold-out 400-cap rooms"
                                        rows={3}
                                        className={`${inputCls} min-h-[88px] resize-y`}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Manager name">
                                        <input
                                            type="text"
                                            value={profile.agentName || ''}
                                            onChange={(e) => setField('agentName', e.target.value)}
                                            placeholder="Alex Chen"
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Primary phone">
                                        <input
                                            type="text"
                                            value={profile.agentPhone || ''}
                                            onChange={(e) => setField('agentPhone', e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <Field label="Routing email">
                                    <input
                                        type="email"
                                        value={profile.agentEmail || ''}
                                        onChange={(e) => setField('agentEmail', e.target.value)}
                                        placeholder="mgmt@echovelocity.com"
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Home city">
                                        <input
                                            type="text"
                                            value={profile.homeCity || ''}
                                            onChange={(e) => setField('homeCity', e.target.value)}
                                            placeholder="Chicago"
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Primary genre">
                                        <input
                                            type="text"
                                            value={profile.primaryGenre || ''}
                                            onChange={(e) => setField('primaryGenre', e.target.value)}
                                            placeholder="Deep House"
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <Field label="Target markets" hint="Optional — comma-separated cities">
                                    <input
                                        type="text"
                                        value={profile.targetMarkets || ''}
                                        onChange={(e) => setField('targetMarkets', e.target.value)}
                                        placeholder="Chicago, Detroit, NYC"
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3 flex-wrap">
                            <Btn variant="accent" accent="#eab308" onClick={handleSave}>
                                {saveErr && <span className="text-xs text-amber-400 mr-2">{saveErr}</span>}
                                {isSaved ? (
                                    <>
                                        <CheckCircle size={14} /> Saved
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} /> Save profile
                                    </>
                                )}
                            </Btn>
                            <span className="font-mono text-[10px] text-ink-700 tracking-widest uppercase">
                                Auto-saves to this browser
                            </span>
                        </div>
                    </Panel>

                    <Panel title="Links & proof" sub="Injected into pitch footers" accent="#eab308">
                        <div className="space-y-4">
                            <Field label="Primary web / social">
                                <input
                                    type="text"
                                    value={profile.agentSocial || ''}
                                    onChange={(e) => setField('agentSocial', e.target.value)}
                                    placeholder="https://instagram.com/artist"
                                    className={inputCls}
                                />
                            </Field>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Spotify">
                                    <input
                                        type="url"
                                        value={profile.spotifyUrl || ''}
                                        onChange={(e) => setField('spotifyUrl', e.target.value)}
                                        placeholder="https://open.spotify.com/artist/…"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="Apple Music">
                                    <input
                                        type="url"
                                        value={profile.appleUrl || ''}
                                        onChange={(e) => setField('appleUrl', e.target.value)}
                                        placeholder="https://music.apple.com/…"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="YouTube">
                                    <input
                                        type="url"
                                        value={profile.youtubeUrl || ''}
                                        onChange={(e) => setField('youtubeUrl', e.target.value)}
                                        placeholder="https://youtube.com/@…"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="SoundCloud / other">
                                    <input
                                        type="url"
                                        value={profile.otherUrl || ''}
                                        onChange={(e) => setField('otherUrl', e.target.value)}
                                        placeholder="https://…"
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                        </div>
                    </Panel>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <Panel
                        title="Business notes"
                        sub="Private notes on this device — not a bank connection"
                        accent="#eab308"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Working capital note (USD)">
                                <input
                                    type="text"
                                    value={profile.treasuryBalance || ''}
                                    onChange={(e) => setField('treasuryBalance', e.target.value)}
                                    placeholder="Optional"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Crypto note (ETH)">
                                <input
                                    type="text"
                                    value={profile.cryptoBalance || ''}
                                    onChange={(e) => setField('cryptoBalance', e.target.value)}
                                    placeholder="Optional"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Payout address (self-reported)">
                                <input
                                    type="text"
                                    value={profile.cryptoAddress || ''}
                                    onChange={(e) => setField('cryptoAddress', e.target.value)}
                                    placeholder="0x…"
                                    className={`${inputCls} font-mono`}
                                />
                            </Field>
                        </div>
                    </Panel>

                    <Panel title="EPK pack (free)" sub="MusicBrainz + Cover Art Archive + your bio" accent="#eab308" sheen>
                        <p className="text-xs text-ink-400 mb-3 leading-relaxed">
                            Pull open metadata and cover-art URLs, then export with your identity fields.
                        </p>
                        <Btn
                            variant="accent"
                            accent="#eab308"
                            disabled={epkBusy || !(profile.artistAlias || '').trim()}
                            onClick={async () => {
                                setEpkBusy(true);
                                setEpkErr(null);
                                try {
                                    const q = encodeURIComponent(profile.artistAlias || profile.agentName || '');
                                    const data = await apiJson(`/api/epk?q=${q}`);
                                    setEpk(data);
                                    try {
                                        localStorage.setItem('source_epk_cache', JSON.stringify(data));
                                    } catch {
                                        /* ignore */
                                    }
                                } catch (e: any) {
                                    setEpkErr(e?.message || 'EPK fetch failed');
                                } finally {
                                    setEpkBusy(false);
                                }
                            }}
                        >
                            {epkBusy ? 'Fetching…' : 'Build EPK from MusicBrainz'}
                        </Btn>
                        {epkErr && <p className="text-sm text-red-400 mt-2">{epkErr}</p>}
                        {epk?.artist && (
                            <div className="mt-4 space-y-3">
                                <div className="text-sm text-ink-50 font-medium">{epk.artist.name}</div>
                                <div className="font-mono text-[10px] text-ink-400 uppercase tracking-widest">
                                    {epk.artist.type || 'Artist'} · {epk.artist.country || '—'} · MB score{' '}
                                    {epk.artist.score ?? '—'}
                                </div>
                                {(profile.bio || profile.oneLiner) && (
                                    <p className="text-xs text-ink-200 leading-relaxed border-l-2 border-yellow-500/40 pl-2">
                                        {profile.bio || profile.oneLiner}
                                    </p>
                                )}
                                {epk.artist.tags?.length > 0 && (
                                    <p className="text-xs text-ink-200">{(epk.artist.tags as string[]).join(' · ')}</p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(epk.releases || []).slice(0, 6).map((r: any) => (
                                        <div
                                            key={r.id}
                                            className="border border-white/10 rounded-lg overflow-hidden bg-ink-900/40"
                                        >
                                            {r.cover_art_url && (
                                                <img
                                                    src={r.cover_art_url}
                                                    alt={r.title}
                                                    className="w-full aspect-square object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <div className="p-2">
                                                <div className="text-[11px] text-ink-50 truncate">{r.title}</div>
                                                <div className="font-mono text-[9px] text-ink-400">{r.date || ''}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Btn
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            downloadJson(
                                                `epk-${(epk.artist?.name || 'artist').replace(/\s+/g, '_')}.json`,
                                                {
                                                    ...epk,
                                                    identity: {
                                                        alias: profile.artistAlias,
                                                        bio: profile.bio || profile.oneLiner,
                                                        email: profile.agentEmail,
                                                        social: profile.agentSocial,
                                                        spotify: profile.spotifyUrl,
                                                        apple: profile.appleUrl,
                                                        youtube: profile.youtubeUrl,
                                                        city: profile.homeCity,
                                                        genre: profile.primaryGenre,
                                                    },
                                                }
                                            )
                                        }
                                    >
                                        Download JSON
                                    </Btn>
                                    <Btn
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const lines = [
                                                `# EPK — ${epk.artist?.name || profile.artistAlias}`,
                                                `Source: MusicBrainz / Cover Art Archive + Artist Engine profile`,
                                                `Country: ${epk.artist?.country || '—'}`,
                                                `Tags: ${(epk.artist?.tags || []).join(', ')}`,
                                                profile.bio || profile.oneLiner
                                                    ? `\n## Bio\n${profile.bio || profile.oneLiner}`
                                                    : '',
                                                '',
                                                '## Links',
                                                profile.spotifyUrl ? `- Spotify: ${profile.spotifyUrl}` : '',
                                                profile.appleUrl ? `- Apple: ${profile.appleUrl}` : '',
                                                profile.youtubeUrl ? `- YouTube: ${profile.youtubeUrl}` : '',
                                                profile.agentSocial ? `- Social: ${profile.agentSocial}` : '',
                                                '',
                                                '## Releases',
                                                ...(epk.releases || []).map(
                                                    (r: any) =>
                                                        `- ${r.title} (${r.date || '?'}) ${r.musicbrainz_url || ''}`
                                                ),
                                                '',
                                                profile.agentEmail ? `Contact: ${profile.agentEmail}` : '',
                                            ];
                                            downloadText(
                                                `epk-${(epk.artist?.name || 'artist').replace(/\s+/g, '_')}.md`,
                                                lines.filter(Boolean).join('\n')
                                            );
                                        }}
                                    >
                                        Download Markdown
                                    </Btn>
                                </div>
                                {epk.license_note && (
                                    <p className="text-[10px] text-ink-400 leading-relaxed">{epk.license_note}</p>
                                )}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Coming soon (not free yet)" accent="#8a8a93">
                        <p className="text-xs text-ink-400 mb-3 leading-relaxed">
                            Investor honesty: these need paid partners or compliance. They are not demo-faked.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Outcome tracking across email inbox + CRM automations',
                                'Bank / instant artist payouts',
                                'Streaming & social analytics suites (paid data)',
                                'E-sign + versioned contract vault',
                                'PRO registration automation + DSP one-click distro',
                            ].map((t) => (
                                <li key={t} className="flex gap-3">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ink-400 shrink-0" />
                                    <span className="text-sm text-ink-400 leading-relaxed">{t}</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            </div>

            <Walkthrough
                tourId="profile"
                open={showProfileTour}
                accent="#eab308"
                onClose={() => setShowProfileTour(false)}
                primaryLabel="Fill my profile"
                steps={[
                    {
                        title: 'Identity feeds the Engine',
                        body: 'Alias, city, and genre pre-fill Find Gigs. Manager contact lands in pitch headers.',
                        bullets: ['Saved only in this browser for now', 'Avatar is optional but helps completeness'],
                    },
                    {
                        title: 'Bio + links = proof',
                        body: 'Your one-liner and Spotify/Apple/IG links are appended to draft pitches automatically.',
                        bullets: ['Aim for 75%+ profile power', 'Export EPK with MusicBrainz metadata'],
                    },
                    {
                        title: 'Replay tours anytime',
                        body: 'Use Replay tours under Account to re-show welcome and pillar walkthroughs for demos.',
                    },
                ]}
            />
        </div>
    );
}
