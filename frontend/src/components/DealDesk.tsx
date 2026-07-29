/**
 * Pitch & Deals — the negotiation desk.
 * Three jobs, one place:
 *   1. Write a pitch (email / call script / DM) for any venue.
 *   2. Check one offer for terms that commonly hurt artists.
 *   3. Compare two offers side by side.
 */
import { useMemo, useState } from 'react';
import { Send, Scale, Copy, Download, FileSearch, CheckCircle2, Handshake } from 'lucide-react';
import LoadingProgressBar from './LoadingProgressBar';
import { useEngine } from '../lib/engineState';
import { apiFetch, apiJson } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Panel, Field, Btn, Segmented, StepHint, inputCls, EmptyState } from './ui/Shell';
import { openMailto, downloadEml, cachePitch } from '../lib/exportUtils';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import HelpTip from './ui/HelpTip';
import { shouldOpenViewTour } from '../lib/onboarding';

const ACCENT = 'var(--color-shark)';

type Tab = 'pitch' | 'check' | 'compare';
type Outreach = 'email' | 'call_script' | 'dm';

const TAB_OPTIONS: { value: Tab; label: string }[] = [
    { value: 'pitch', label: 'Write a pitch' },
    { value: 'check', label: 'Check an offer' },
    { value: 'compare', label: 'Compare two offers' },
];

const OUTREACH_OPTIONS: { value: Outreach; label: string }[] = [
    { value: 'email', label: 'Email' },
    { value: 'call_script', label: 'Call script' },
    { value: 'dm', label: 'DM' },
];

export default function DealDesk({ profile }: { profile: any }) {
    const { state, record } = useEngine();
    const { refreshMe } = useAuth();
    const [tab, setTab] = useState<Tab>('pitch');
    const [showTour, setShowTour] = useState(() => shouldOpenViewTour('deals'));

    return (
        <div className="space-y-4 md:space-y-8">
            <PageHeader
                view="radar"
                accent={ACCENT}
                module="YOUR NEGOTIATION DESK"
                title="Pitch & Deals"
                desc="Write your outreach, understand your offers, and pick the better deal — in plain words."
            />

            <StepHint
                steps={['Pick a job below', 'Fill in the details', 'Copy, send, or decide']}
                accent={ACCENT}
            />

            <Segmented options={TAB_OPTIONS} value={tab} onChange={setTab} accent="var(--color-ember-500)" />

            {tab === 'pitch' && <PitchTab profile={profile} pipeline={state.pipeline} record={record} refreshMe={refreshMe} />}
            {tab === 'check' && <CheckTab record={record} refreshMe={refreshMe} />}
            {tab === 'compare' && <CompareTab />}

            <Walkthrough
                tourId="deals"
                open={showTour}
                accent="var(--color-ember-500)"
                onClose={() => setShowTour(false)}
                primaryLabel="Start writing"
                steps={[
                    {
                        title: 'Your negotiation desk',
                        body: 'Everything about asking for the gig and judging the terms lives here — three jobs, three tabs.',
                        bullets: ['Write a pitch — email, call script, or DM', 'Check an offer — plain-word risk read', 'Compare two offers — side by side'],
                    },
                    {
                        title: 'Pitches use your Profile',
                        body: 'Your name, bio, city, and streaming links are woven into every draft. The fuller your Profile, the stronger the pitch.',
                        bullets: ['Everything is editable before you send', 'Send by mail app, .eml file, or copy'],
                    },
                    {
                        title: 'Offers in plain words',
                        body: 'Paste any offer text and get a fairness read with each risky term explained — plus a suggested way to push back.',
                        bullets: ['A fast first read, not legal advice', 'For big deals, bring a real lawyer'],
                    },
                ]}
            />
        </div>
    );
}

/* ============================ Tab 1: Write a pitch ============================ */

function PitchTab({
    profile,
    pipeline,
    record,
    refreshMe,
}: {
    profile: any;
    pipeline: any[];
    record: any;
    refreshMe: () => void;
}) {
    const venues = useMemo(
        () => pipeline.filter((l) => l.stage !== 'dead' && l.stage !== 'booked'),
        [pipeline]
    );
    const [venueChoice, setVenueChoice] = useState<string>('__manual__');
    const [manualVenue, setManualVenue] = useState('');
    const [contactName, setContactName] = useState('');
    const [sendTo, setSendTo] = useState('');
    const [outreach, setOutreach] = useState<Outreach>('email');
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const chosenLead = venues.find((v) => v.id === venueChoice);
    const venueName = chosenLead?.venueName || manualVenue.trim();

    const handleDraft = async () => {
        if (!venueName) {
            setErr('Give the venue a name first.');
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const response = await apiFetch('/api/draft-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_name: venueName,
                    venue_tier: 'Independent venue',
                    genre: profile?.primaryGenre || 'music',
                    contact_persona: contactName.trim() || 'Booking team',
                    payout_model: chosenLead?.payoutModel || 'Standard',
                    artist_name: profile?.artistAlias || 'The Artist',
                    agent_name: profile?.agentName || profile?.artistAlias || 'The Manager',
                    agent_email: profile?.agentEmail || null,
                    agent_phone: profile?.agentPhone || null,
                    agent_social: profile?.agentSocial || null,
                    home_city: profile?.homeCity || null,
                    primary_genre: profile?.primaryGenre || null,
                    artist_bio: profile?.bio || profile?.oneLiner || null,
                    streaming_links: profile?.spotifyUrl || profile?.appleUrl || profile?.youtubeUrl || null,
                    outreach_type: outreach,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = data?.detail;
                throw new Error(
                    typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail || `Status ${response.status}`
                );
            }
            if (data.status !== 'success') throw new Error(data.error || 'Drafting failed');
            let pitch = data.pitch || '';
            const extras: string[] = [];
            if (profile?.bio || profile?.oneLiner) extras.push(`About: ${profile.bio || profile.oneLiner}`);
            if (profile?.spotifyUrl) extras.push(`Spotify: ${profile.spotifyUrl}`);
            if (profile?.appleUrl) extras.push(`Apple Music: ${profile.appleUrl}`);
            if (profile?.youtubeUrl) extras.push(`YouTube: ${profile.youtubeUrl}`);
            if (extras.length) pitch = `${pitch}\n\n—\n${extras.join('\n')}`;
            setDraft(pitch);
            refreshMe();
        } catch (e: any) {
            setErr(e?.message || 'Drafting failed — is the Engine online?');
        } finally {
            setBusy(false);
        }
    };

    const finishSend = (mode: 'mailto' | 'eml' | 'copy') => {
        const subject = `Booking inquiry — ${profile?.artistAlias || 'Artist'} × ${venueName}`;
        const to = sendTo.includes('@') ? sendTo : '';
        cachePitch({ venue: venueName, body: draft, outreach });
        if (mode === 'mailto') openMailto({ to, subject, body: draft });
        else if (mode === 'eml') {
            downloadEml(`pitch-${venueName.replace(/\s+/g, '_')}.eml`, {
                to,
                subject,
                body: draft,
                from: profile?.agentEmail,
            });
        } else {
            navigator.clipboard?.writeText(draft).catch(() => null);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        }
        record.pitch(venueName, outreach);
    };

    return (
        <div className="space-y-4">
            <CoachPrompt id="deals-pitch-tip" accent="var(--color-ember-400)" title="Stronger pitches">
                Fill in your Profile (bio, city, links) before drafting — the Engine weaves it all into the message so
                bookers can hear your music in one click.
            </CoachPrompt>

            <Panel title="Who are you pitching?" sub="Pick a venue you found, or type one in" accent={ACCENT}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <Field label="Venue" hint={venues.length ? 'Venues from your searches appear here.' : 'Find venues in Find Gigs, or just type one in.'}>
                        <select
                            value={venueChoice}
                            onChange={(e) => setVenueChoice(e.target.value)}
                            className={`${inputCls()} min-h-[44px]`}
                        >
                            <option value="__manual__">Type it in myself…</option>
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.venueName} {v.city ? `— ${v.city}` : ''}
                                </option>
                            ))}
                        </select>
                    </Field>
                    {venueChoice === '__manual__' && (
                        <Field label="Venue name">
                            <input
                                type="text"
                                value={manualVenue}
                                onChange={(e) => setManualVenue(e.target.value)}
                                placeholder="The Echo Room"
                                className={`${inputCls()} min-h-[44px]`}
                            />
                        </Field>
                    )}
                    <Field label="Who you're writing to" hint="A name if you have one — otherwise we address the booking team.">
                        <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Sam, talent buyer"
                            className={`${inputCls()} min-h-[44px]`}
                        />
                    </Field>
                    <Field label="Their email / phone / handle (optional)">
                        <input
                            type="text"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            placeholder="booking@venue.com"
                            className={`${inputCls()} min-h-[44px]`}
                        />
                    </Field>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Segmented options={OUTREACH_OPTIONS} value={outreach} onChange={setOutreach} accent="var(--color-ember-500)" />
                    <HelpTip text="Email is a full booking message. Call script gives you talking points for a phone call. DM is a short version for social media." />
                </div>

                <div className="mt-4 flex md:justify-end">
                    <Btn variant="accent" accent="var(--color-ember-500)" onClick={handleDraft} disabled={busy} className="w-full md:w-auto min-h-[48px]">
                        <Send size={15} /> {busy ? 'Writing…' : draft ? 'Write it again' : 'Write my pitch'}
                    </Btn>
                </div>
            </Panel>

            {err && (
                <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>
            )}

            {busy && (
                <div className="w-full max-w-lg mx-auto py-10 px-4">
                    <LoadingProgressBar
                        active={busy}
                        message="Writing your pitch"
                        subMessage="Usually takes a couple of seconds."
                        colorClass="orange"
                        estimatedDurationMs={2000}
                        speedLabel="~2s"
                    />
                </div>
            )}

            {draft && !busy && (
                <Panel
                    title="Your draft"
                    sub="Edit anything — then send it your way"
                    accent={ACCENT}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Btn variant="ghost" size="sm" onClick={() => finishSend('copy')}>
                                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                            </Btn>
                            <Btn variant="ghost" size="sm" onClick={() => finishSend('eml')}>
                                <Download size={13} /> Email file
                            </Btn>
                            <Btn variant="accent" size="sm" accent="var(--color-ember-500)" onClick={() => finishSend('mailto')}>
                                <Send size={13} /> Open in mail
                            </Btn>
                        </div>
                    }
                >
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full h-80 bg-ink-900/50 rounded-lg border border-white/10 text-ink-200 text-sm p-4 outline-none resize-none custom-scrollbar leading-relaxed"
                    />
                </Panel>
            )}
        </div>
    );
}

/* ============================ Tab 2: Check one offer ============================ */

function CheckTab({ record, refreshMe }: { record: any; refreshMe: () => void }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any | null>(null);

    const runCheck = async () => {
        if (!text.trim()) {
            setErr('Paste the offer text first.');
            return;
        }
        setBusy(true);
        setErr(null);
        setAnalysis(null);
        try {
            const formData = new FormData();
            formData.append('text', text);
            formData.append('scan_type', 'offer');
            const response = await apiFetch('/api/analyze-contract', { method: 'POST', body: formData });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = data?.detail;
                throw new Error(
                    typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail || `Status ${response.status}`
                );
            }
            setAnalysis(data.analysis || null);
            const flags = Array.isArray(data.analysis?.red_flags) ? data.analysis.red_flags.length : 0;
            record.scan(flags, data.analysis?.integrity_score);
            refreshMe();
        } catch (e: any) {
            setErr(e?.message || 'Check failed — is the Engine online?');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <Panel title="Paste the offer" sub="Deal memos, booking offers, emails with terms — any text works" accent={ACCENT}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={'Paste the offer text here.\n\nExample: "Artist agrees to perform for door split of 70/30 after expenses…"'}
                    className={`${inputCls()} min-h-[160px]`}
                />
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[11px] text-ink-400">A fast, informed read — not legal advice.</p>
                    <Btn variant="accent" accent="var(--color-ember-500)" onClick={runCheck} disabled={busy} className="min-h-[44px]">
                        <FileSearch size={15} /> {busy ? 'Reading…' : 'Check this offer'}
                    </Btn>
                </div>
            </Panel>

            {err && <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}

            {busy && (
                <div className="w-full max-w-lg mx-auto py-10 px-4">
                    <LoadingProgressBar
                        active={busy}
                        message="Reading the offer"
                        subMessage="Flagging terms that commonly hurt artists."
                        colorClass="orange"
                        estimatedDurationMs={4000}
                        speedLabel="~4s"
                    />
                </div>
            )}

            {analysis && !busy && (
                <div className="space-y-4">
                    <Panel title={`Fairness score: ${analysis.integrity_score ?? '—'}/100`} sub="Higher means more artist-friendly" accent={ACCENT}>
                        {analysis.summary && <p className="text-sm text-ink-200 leading-relaxed">{analysis.summary}</p>}
                    </Panel>

                    {Array.isArray(analysis.red_flags) && analysis.red_flags.length > 0 && (
                        <Panel title={`${analysis.red_flags.length} thing${analysis.red_flags.length === 1 ? '' : 's'} to push back on`} accent="var(--color-ember-500)">
                            <div className="space-y-4">
                                {analysis.red_flags.map((flag: any, idx: number) => (
                                    <div key={idx} className="border border-white/10 border-l-4 border-l-red-500 rounded-lg p-4 bg-white/[0.02]">
                                        {flag.clause && (
                                            <p className="text-xs text-ink-400 italic mb-2">“…{flag.clause}…”</p>
                                        )}
                                        {flag.risk && (
                                            <p className="text-sm text-red-400 font-medium mb-1">What it means for you: {flag.risk}</p>
                                        )}
                                        {flag.fix && (
                                            <p className="text-sm text-emerald-400 mt-2">How to push back: {flag.fix}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {analysis.shark_rebuttal && (
                        <Panel
                            title="Your reply, drafted"
                            sub="A firm, polite way to raise these points"
                            accent={ACCENT}
                            actions={
                                <Btn variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(analysis.shark_rebuttal).catch(() => null)}>
                                    <Copy size={12} /> Copy
                                </Btn>
                            }
                        >
                            <div className="text-sm text-ink-200 leading-relaxed whitespace-pre-wrap bg-ink-900 p-4 rounded-lg border border-white/10">
                                {analysis.shark_rebuttal}
                            </div>
                        </Panel>
                    )}
                </div>
            )}

            {!analysis && !busy && !err && (
                <EmptyState
                    icon={<Handshake size={36} />}
                    title="No offer checked yet"
                    hint="Paste any offer above and the Engine reads it clause by clause."
                />
            )}
        </div>
    );
}

/* ============================ Tab 3: Compare two offers ============================ */

function CompareTab() {
    const [offerA, setOfferA] = useState('');
    const [offerB, setOfferB] = useState('');
    const [compare, setCompare] = useState<any | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const runCompare = async () => {
        if (!offerA.trim() || !offerB.trim()) {
            setErr('Paste both offers first.');
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const data = await apiJson('/api/free/offer-compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_a: offerA, offer_b: offerB }),
            });
            setCompare(data);
        } catch (e: any) {
            setErr(e?.message || 'Compare failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <Panel title="Two offers, side by side" sub="Free — works even without AI" accent={ACCENT}>
                <div className="flex items-center gap-2 mb-3 text-ink-400">
                    <Scale size={14} />
                    <span className="text-[11px]">Paste each offer's text. You get a fairness read on both, and a plain suggestion.</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Offer A">
                        <textarea
                            value={offerA}
                            onChange={(e) => setOfferA(e.target.value)}
                            className={`${inputCls()} min-h-[130px]`}
                            placeholder="Paste the first offer here"
                        />
                    </Field>
                    <Field label="Offer B">
                        <textarea
                            value={offerB}
                            onChange={(e) => setOfferB(e.target.value)}
                            className={`${inputCls()} min-h-[130px]`}
                            placeholder="Paste the second offer here"
                        />
                    </Field>
                </div>
                <div className="mt-3 flex md:justify-end">
                    <Btn variant="accent" accent="var(--color-ember-500)" onClick={runCompare} disabled={busy} className="w-full md:w-auto min-h-[44px]">
                        {busy ? 'Comparing…' : 'Which is better?'}
                    </Btn>
                </div>
            </Panel>

            {err && <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}

            {compare && (
                <Panel title="The verdict" accent={ACCENT}>
                    <div className="space-y-3 text-sm">
                        <p className="text-ink-50 font-medium">{compare.winner_hint}</p>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[['A', compare.offer_a], ['B', compare.offer_b]].map(([label, offer]: any) => (
                                <div key={label} className="border border-white/10 rounded-lg p-3">
                                    <div className="text-[11px] uppercase tracking-wide text-ink-400 mb-1">Offer {label} fairness</div>
                                    <div className="text-2xl font-display text-ink-50">{offer?.integrity_hint ?? '—'}<span className="text-sm text-ink-400">/100</span></div>
                                    <div className="text-xs text-ink-400 mt-1">
                                        {offer?.linter?.counts?.total ?? 0} risky term{(offer?.linter?.counts?.total ?? 0) === 1 ? '' : 's'} spotted
                                    </div>
                                </div>
                            ))}
                        </div>
                        {compare.ai_compare && (
                            <div className="border border-white/10 rounded-lg p-3 bg-white/[0.03]">
                                <p className="text-ink-200 text-xs leading-relaxed mb-2">{compare.ai_compare.reason}</p>
                                <p className="text-[12px] font-medium text-ember-500">Leaning: Offer {compare.ai_compare.prefer}</p>
                            </div>
                        )}
                        <p className="text-[10px] text-ink-400 leading-relaxed">{compare.disclaimer}</p>
                    </div>
                </Panel>
            )}
        </div>
    );
}
