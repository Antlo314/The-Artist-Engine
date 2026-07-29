/**
 * Plain-language guides for every screen in the Engine.
 * Rendered by <GuidePanel /> — the "How this works" tab available everywhere.
 * Rule: no jargon. Every sentence should make sense to a musician who has
 * never used music-industry software before.
 */

export type Guide = {
    id: string;
    title: string;
    tagline: string;
    accent: string;
    what: string;
    steps: { title: string; detail: string }[];
    tips: string[];
    faq: { q: string; a: string }[];
};

export const GUIDES: Record<string, Guide> = {
    home: {
        id: 'home',
        title: 'Home',
        tagline: 'Your numbers, your booking pipeline, and quick tools.',
        accent: 'var(--color-ember-500)',
        what: 'Home shows what you have actually done in the Engine — tracks mastered, venues found, pitches written, contracts checked. Every number starts at zero and only goes up when you really do something. Nothing here is fake or padded.',
        steps: [
            { title: 'Watch your pipeline', detail: 'When you find venues in Find Gigs, they land here as leads. Move each one along as things progress: found → pitched → talking → booked.' },
            { title: 'Use the quick actions', detail: 'The big buttons at the top jump straight to the most common jobs — finding gigs and checking a contract.' },
            { title: 'Check the activity feed', detail: 'The feed on the right is a diary of everything you have done, newest first. Clear it any time.' },
        ],
        tips: [
            'Your pipeline saves to your account when you are signed in, so it follows you across devices.',
            'You can export your whole pipeline as a spreadsheet (CSV) or a backup file (JSON) and bring it back later.',
            'The System tile tells you if the Engine and its AI are reachable right now.',
        ],
        faq: [
            { q: 'Why are my numbers all zero?', a: 'Because you have not run anything yet. Try Find Gigs or master a track in Studio — the numbers move the moment you do.' },
            { q: 'Where is my data stored?', a: 'On your device, and also in your account when you are signed in. Export a backup any time from the buttons at the top.' },
        ],
    },

    gigs: {
        id: 'gigs',
        title: 'Find Gigs',
        tagline: 'Search real venues that book your kind of music.',
        accent: 'var(--color-radar)',
        what: 'Tell the Engine your city, your genre, and how big a room you want to play. It searches live ticketing and touring data, then adds an estimate of what each venue might pay and who to talk to. A search takes about 8 seconds.',
        steps: [
            { title: 'Set your search', detail: 'City, genre, venue size, distance, and when you want to play. Your Profile city and genre fill in automatically.' },
            { title: 'Read the results', detail: 'Each card shows the venue, how it pays, how far ahead it books, and a contact if we found one. "Best odds" marks the venue most likely to say yes.' },
            { title: 'Write the pitch', detail: 'Press "Draft pitch" on a venue and the Engine writes a booking email, call script, or DM for you — using your name, your bio, and your links.' },
        ],
        tips: [
            'No results? Widen the distance, pick a bigger city nearby, or change the timeframe.',
            'The "Verified" filter keeps only venues we saw actively selling tickets.',
            'Export the whole list as a spreadsheet with one click — handy if someone else books for you.',
            'Every venue you find is saved as a lead on Home and in Roster, so nothing gets lost.',
        ],
        faq: [
            { q: 'Are these venues real?', a: 'Venues marked "Verified" or "Live" came from live ticketing data. Others are AI-researched from public information — double-check details before you travel.' },
            { q: 'What does the reputation number mean?', a: 'A rough 0–100 read on how established the venue looks based on public activity. It is a guide, not a verdict — tap it to see why.' },
            { q: 'What are the payout numbers?', a: 'Estimates based on room size and typical ticket prices — a starting point for your negotiation, not a promise.' },
        ],
    },

    studio: {
        id: 'studio',
        title: 'Studio',
        tagline: 'Make your mix loud, clean, and ready for streaming.',
        accent: 'var(--color-audio)',
        what: 'Upload a finished mix and the Studio masters it — meaning it balances the tone, evens out the volume, and brings it up to the loudness streaming services expect. You can also split a song into separate parts (vocals, drums, and more).',
        steps: [
            { title: 'Upload your mix', detail: 'A WAV file under 80 MB works best. This should be your final mix — not a demo with missing parts.' },
            { title: 'Get a read on it first', detail: 'The analysis pass listens to your track and tells you, in plain words, what it would change — before you commit.' },
            { title: 'Shape the sound', detail: 'The sliders are simple: more or less deep bass, sparkle, punch, stereo width, warmth. Leave everything in the middle for a neutral master.' },
            { title: 'Master and compare', detail: 'Press Master, wait about half a minute, then use the A/B player to flip between your original and the new master. Download when happy.' },
        ],
        tips: [
            'You can optionally upload a favorite commercial track as a reference — the Engine will aim your master at that sound (paid plans).',
            'The loudness target defaults to what Spotify and Apple Music like. You rarely need to change it.',
            '"Streaming ready" means your track sits in the loudness and peak range services accept without turning it down.',
            'Stem splitting gives you vocals / drums / bass / other as separate files — useful for remixes and live sets.',
        ],
        faq: [
            { q: 'Will mastering fix a bad mix?', a: 'No — mastering polishes a good mix. If instruments fight each other or vocals are buried, fix the mix first.' },
            { q: 'What loudness should I aim for?', a: 'Around −14 LUFS for streaming. The default target handles this — louder is not better, because services turn loud tracks down.' },
            { q: 'Why does my master sound different on my phone?', a: 'Every speaker is different. Check on two or three systems; the A/B player helps you hear what actually changed.' },
        ],
    },

    deals: {
        id: 'deals',
        title: 'Pitch & Deals',
        tagline: 'Write your outreach and weigh your offers, side by side.',
        accent: 'var(--color-shark)',
        what: 'This is your negotiation desk. Write a booking pitch for any venue — even one you found yourself. Paste in an offer to get a plain-word read on it. Or put two offers next to each other and see which treats you better.',
        steps: [
            { title: 'Write a pitch', detail: 'Pick a venue from your pipeline or type one in. Choose email, call script, or DM. The Engine drafts it in your manager’s voice with your links attached — edit anything before you send it.' },
            { title: 'Check one offer', detail: 'Paste the text of an offer or deal memo. The Engine flags terms that commonly hurt artists and explains each one in plain words.' },
            { title: 'Compare two offers', detail: 'Paste offer A and offer B. You get a side-by-side read with a plain suggestion of which one looks safer — and why.' },
        ],
        tips: [
            'Fill in your Profile first — pitches come out much stronger when they carry your bio, your city, and your streaming links.',
            'You can send a pitch three ways: open it in your mail app, download it as an email file, or just copy the text.',
            'The offer checker works without any AI as a baseline, so it always answers — even offline from paid services.',
        ],
        faq: [
            { q: 'Is this legal advice?', a: 'No. It is a fast, informed read to help you ask better questions. For anything you are about to sign, have a lawyer look at it.' },
            { q: 'Can I pitch a venue that is not in my pipeline?', a: 'Yes — choose "Type it in myself" and fill in the venue name and who you are writing to.' },
        ],
    },

    contracts: {
        id: 'contracts',
        title: 'Contracts',
        tagline: 'Know what a contract really says before you sign it.',
        accent: 'var(--color-zion)',
        what: 'Upload a contract (PDF, Word, or pasted text) and the Engine reads it clause by clause. It flags terms that commonly work against artists — like giving away your recordings forever, or paying the label back out of your share — and explains each one in plain words. There is also a dictionary of music-business terms, a royalty debt calculator, and a split sheet maker.',
        steps: [
            { title: 'Scan a contract', detail: 'Drop in the file or paste the text. In a few seconds you get a fairness score, a list of flagged clauses, and a suggested way to push back on each.' },
            { title: 'Read the flags', detail: 'Each flag says what the clause means for you and how risky it looks. Red flags deserve a conversation before you sign anything.' },
            { title: 'Use the extra tools', detail: 'The Dictionary explains terms like "recoupment" in plain words. The Advance calculator shows how long a label advance takes to pay back. Split Sheet records who wrote what so royalties go to the right people.' },
        ],
        tips: [
            'The quick check (no AI) is free and unlimited — it pattern-matches 25 known trouble clauses instantly.',
            'A low fairness score does not mean "walk away" — it means "negotiate these specific points."',
            'Make a split sheet the same day you write a song, while everyone still agrees.',
        ],
        faq: [
            { q: 'Is this legal advice?', a: 'No. It is a fast first read so you walk into a lawyer’s office — or a negotiation — knowing where to look. Never sign a major deal without a real lawyer.' },
            { q: 'What is the fairness score?', a: 'A 0–100 read of how artist-friendly the document looks based on the clauses found. Higher is friendlier.' },
            { q: 'Is my contract kept private?', a: 'Your document is processed to produce the analysis and is not published anywhere. Avoid uploading anything you are bound to keep confidential.' },
        ],
    },

    roster: {
        id: 'roster',
        title: 'Roster',
        tagline: 'Your contacts, your to-do list, and your press kit.',
        accent: 'var(--color-ember-500)',
        what: 'Roster is your address book and operations desk. Every venue you find lands here as a lead. Add your own contacts, keep a to-do list tied to specific venues, and build a press kit from your public releases.',
        steps: [
            { title: 'Work your leads', detail: 'Each lead moves through four stages: found → pitched → talking → booked. Keep them honest and the pipeline on Home stays honest too.' },
            { title: 'Add contacts yourself', detail: 'Booker you met at a show? Add them by hand with the "Add contact" button — not everything has to come from a search.' },
            { title: 'Keep a to-do list', detail: 'Add tasks like "follow up with The Echo on Friday." Tick them off as you go; they can be tied to a specific lead.' },
            { title: 'Build your press kit', detail: 'Type your artist name and the Engine pulls your public releases and cover art into a one-page press kit (EPK) you can share with bookers.' },
        ],
        tips: [
            'Your plan sets how many leads you can keep at once — archive dead ones to stay under the cap.',
            'Export everything as a backup file whenever you want; import it on another device to pick up where you left off.',
        ],
        faq: [
            { q: 'What is an EPK?', a: 'An electronic press kit — a one-pager with your bio, music, and photos that venues and press ask for. Roster builds the skeleton from your public release data.' },
            { q: 'My releases do not show up — why?', a: 'The press kit pulls from MusicBrainz, a free public music database. If your releases are not listed there yet, add them at musicbrainz.org (free) and try again.' },
        ],
    },

    plan: {
        id: 'plan',
        title: 'Plan & Credits',
        tagline: 'What you are on, what it includes, and your credits.',
        accent: 'var(--color-ember-500)',
        what: 'Your plan sets daily limits on the heavy tools (mastering, gig searches, contract scans) and unlocks extras like reference mastering. Credits are a top-up for busy weeks. Promo codes are redeemed here too.',
        steps: [
            { title: 'See where you stand', detail: 'This page shows your current plan, what is left of today’s allowance, and any credits or active promo.' },
            { title: 'Upgrade if you hit limits', detail: 'If you keep hitting the daily cap, the next plan up raises it. Upgrades take effect immediately.' },
            { title: 'Redeem a promo', detail: 'Have a code? Enter it here — it multiplies your limits for a while.' },
        ],
        tips: [
            'Daily limits reset every day — a "quota reached" message just means "come back tomorrow" (or upgrade).',
            'The quick contract check and most Roster tools are free and do not touch your quota.',
        ],
        faq: [
            { q: 'What happens when I hit a limit?', a: 'The tool tells you plainly and nothing is charged. You can wait for the daily reset, use credits, or upgrade.' },
        ],
    },

    profile: {
        id: 'profile',
        title: 'Profile',
        tagline: 'Who you are — used everywhere the Engine speaks for you.',
        accent: 'var(--color-ember-500)',
        what: 'Everything the Engine writes on your behalf — pitches, press kits — pulls from this page. The more you fill in, the better everything else works.',
        steps: [
            { title: 'Fill in the basics', detail: 'Artist name, city, genre, and a short bio. These feed straight into your pitches.' },
            { title: 'Add your links', detail: 'Spotify, Apple Music, YouTube, socials. Bookers click these before they answer you.' },
            { title: 'Name your manager', detail: 'Pitches are written in your manager’s voice. No manager? Use your own name — plenty of artists manage themselves.' },
        ],
        tips: [
            'Your home city and genre pre-fill every gig search.',
            'You can replay the welcome tour and all the tips from here if you dismissed them.',
        ],
        faq: [
            { q: 'Who sees my profile?', a: 'Only you — until you put it in a pitch or press kit that you choose to send.' },
        ],
    },

    admin: {
        id: 'admin',
        title: 'Admin',
        tagline: 'Manage users, plans, and credits.',
        accent: 'var(--color-ember-500)',
        what: 'Admin console for platform operators: look up users, adjust plans and credits, and leave account notes.',
        steps: [
            { title: 'Find a user', detail: 'Search by email or name, then open their row to see plan, usage, and notes.' },
            { title: 'Adjust plan or credits', detail: 'Changes apply immediately and are logged.' },
        ],
        tips: ['Only accounts with the admin role can see this page.'],
        faq: [],
    },
};

export function getGuide(id: string): Guide | null {
    return GUIDES[id] || null;
}
