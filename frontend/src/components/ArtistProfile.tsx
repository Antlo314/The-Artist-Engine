import { useState, useRef } from 'react';
import { Upload, Save, CheckCircle } from 'lucide-react';
import { PageHeader, Panel, Field, Btn } from './ui/Shell';
import { apiJson } from '../lib/api';
import { downloadText, downloadJson } from '../lib/exportUtils';
import { useAuth } from '../lib/auth';

interface ArtistProfileProps {
    profile: any;
    setProfile: React.Dispatch<React.SetStateAction<any>>;
}

const inputCls = 'bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm focus:border-yellow-500/50 focus:outline-none transition-colors w-full min-h-[44px]';

export default function ArtistProfile({ profile, setProfile }: ArtistProfileProps) {
    const { email, displayName, me, signOut } = useAuth();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(localStorage.getItem('sovereign_avatar'));
    const [isSaved, setIsSaved] = useState(false);
    const [epk, setEpk] = useState<any | null>(null);
    const [epkBusy, setEpkBusy] = useState(false);
    const [epkErr, setEpkErr] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSave = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                view="profile"
                accent="#eab308"
                module="IDENTITY"
                title="Profile"
                desc="Artist identity used to personalize pitches and outreach."
            />

            {(email || me) && (
                <Panel title="Account" sub="Signed-in user" accent="#eab308">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm text-ink-50 truncate">{displayName || me?.user?.display_name || 'Member'}</p>
                            <p className="font-mono text-xs text-ink-400 truncate mt-0.5">{email || me?.user?.email}</p>
                            <p className="font-mono text-[10px] tracking-widest uppercase text-ember-400 mt-2">
                                {me?.user?.badge || (me?.user?.role === 'admin' ? 'Admin' : 'Member')}
                            </p>
                        </div>
                        <Btn variant="ghost" size="sm" onClick={() => signOut()}>Sign out</Btn>
                    </div>
                </Panel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT: Identity */}
                <div className="lg:col-span-7">
                    <Panel title="Identity" sub="Used to personalize pitches" accent="#eab308">
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Avatar */}
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
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="font-mono text-[10px] text-ink-50 tracking-widest uppercase">Change</span>
                                    </div>
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

                            {/* Fields */}
                            <div className="flex-1 space-y-4">
                                <Field label="Artist / project alias">
                                    <input
                                        type="text"
                                        value={profile.artistAlias}
                                        onChange={(e) => setProfile({ ...profile, artistAlias: e.target.value })}
                                        placeholder="Echovelocity"
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Manager name">
                                        <input
                                            type="text"
                                            value={profile.agentName}
                                            onChange={(e) => setProfile({ ...profile, agentName: e.target.value })}
                                            placeholder="Alex Chen"
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Primary phone">
                                        <input
                                            type="text"
                                            value={profile.agentPhone}
                                            onChange={(e) => setProfile({ ...profile, agentPhone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <Field label="Routing email">
                                    <input
                                        type="email"
                                        value={profile.agentEmail}
                                        onChange={(e) => setProfile({ ...profile, agentEmail: e.target.value })}
                                        placeholder="mgmt@echovelocity.com"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="Primary web / social link">
                                    <input
                                        type="text"
                                        value={profile.agentSocial}
                                        onChange={(e) => setProfile({ ...profile, agentSocial: e.target.value })}
                                        placeholder="https://instagram.com/artist"
                                        className={inputCls}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Home city">
                                        <input
                                            type="text"
                                            value={profile.homeCity || ''}
                                            onChange={(e) => setProfile({ ...profile, homeCity: e.target.value })}
                                            placeholder="Chicago"
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Primary genre">
                                        <input
                                            type="text"
                                            value={profile.primaryGenre || ''}
                                            onChange={(e) => setProfile({ ...profile, primaryGenre: e.target.value })}
                                            placeholder="Deep House"
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <span className="text-[11px] text-ink-700">Pre-fills your Find Gigs search.</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3 flex-wrap">
                            <Btn variant="accent" accent="#eab308" onClick={handleSave}>
                                {isSaved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save profile</>}
                            </Btn>
                            <span className="font-mono text-[10px] text-ink-700 tracking-widest uppercase">Saved automatically</span>
                        </div>
                    </Panel>
                </div>

                {/* RIGHT: Treasury + Roadmap */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <Panel title="Treasury (self-reported)" sub="Shown on your dashboard header. Not connected to a bank." accent="#eab308">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Fiat treasury (USD)">
                                <input
                                    type="text"
                                    value={profile.treasuryBalance || ''}
                                    onChange={(e) => setProfile({ ...profile, treasuryBalance: e.target.value })}
                                    placeholder="42500.00"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Crypto treasury (ETH)">
                                <input
                                    type="text"
                                    value={profile.cryptoBalance || ''}
                                    onChange={(e) => setProfile({ ...profile, cryptoBalance: e.target.value })}
                                    placeholder="14.50"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="On-chain payout address">
                                <input
                                    type="text"
                                    value={profile.cryptoAddress || ''}
                                    onChange={(e) => setProfile({ ...profile, cryptoAddress: e.target.value })}
                                    placeholder="0x..."
                                    className={`${inputCls} font-mono`}
                                />
                            </Field>
                        </div>
                    </Panel>

                    <Panel title="EPK pack (free)" sub="MusicBrainz + Cover Art Archive" accent="#eab308">
                        <p className="text-xs text-ink-400 mb-3 leading-relaxed">
                            Pull open metadata and cover-art URLs for your press kit. No paid APIs.
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
                                    {epk.artist.type || 'Artist'} · {epk.artist.country || '—'} · MB score {epk.artist.score ?? '—'}
                                </div>
                                {epk.artist.tags?.length > 0 && (
                                    <p className="text-xs text-ink-200">{(epk.artist.tags as string[]).join(' · ')}</p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(epk.releases || []).slice(0, 6).map((r: any) => (
                                        <div key={r.id} className="border border-white/10 rounded-lg overflow-hidden bg-ink-900/40">
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
                                                epk
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
                                                `# EPK — ${epk.artist?.name}`,
                                                `Source: MusicBrainz / Cover Art Archive`,
                                                `Country: ${epk.artist?.country || '—'}`,
                                                `Tags: ${(epk.artist?.tags || []).join(', ')}`,
                                                '',
                                                '## Releases',
                                                ...(epk.releases || []).map(
                                                    (r: any) => `- ${r.title} (${r.date || '?'}) ${r.musicbrainz_url || ''}`
                                                ),
                                                '',
                                                profile.agentEmail ? `Contact: ${profile.agentEmail}` : '',
                                                profile.agentSocial ? `Social: ${profile.agentSocial}` : '',
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

                    <Panel title="Coming soon" accent="#eab308">
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                <span className="text-sm text-ink-200 leading-relaxed">
                                    Outcome tracking — follow each pitch from sent to booked to paid.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                                <span className="text-sm text-ink-200 leading-relaxed">
                                    Artist payments — get paid out directly through the Engine.
                                </span>
                            </li>
                        </ul>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
