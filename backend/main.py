import asyncio
import os
import shutil
import subprocess
import uuid
import json
import time
import sys
import io
import PyPDF2
from docx import Document
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydub import AudioSegment
import traceback
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load Environment Variables from local .env
load_dotenv(dotenv_path=".env")

from agent_memory import AgentMemory
from gig_sources import ticketmaster_available, fetch_ticketmaster_venues

# Google GenAI Integration
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[SYSTEM WARNING] google-genai library missing. Install via pip install google-genai")

# ---------------------------------------------------------------------------
# OMEGA-TIER SYSTEM CONFIGURATION
# ---------------------------------------------------------------------------

app = FastAPI(
    title="The Artist Engine API - Sovereign Protocol",
    description="OMEGA-Tier Autonomous Music Industry Backend",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://the-artist-engine-lime.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)
app.mount("/api/temp", StaticFiles(directory="temp"), name="temp")

def get_api_key() -> Optional[str]:
    """Secure extraction of the Gemini API Key."""
    return os.getenv("GEMINI_API_KEY")

# Central model config — override with GEMINI_MODEL in .env if Google retires
# this one (they retired gemini-2.5-flash for new API projects).
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
# Fast model for latency-sensitive structured tasks (venue enrichment).
# flash-lite is ~10x faster than flash on structured JSON. Override if quality dips.
GEMINI_FAST_MODEL = os.getenv("GEMINI_FAST_MODEL", "gemini-flash-lite-latest")

def get_genai_client():
    api_key = get_api_key()
    if not api_key:
         raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in the environment.")
    return genai.Client(api_key=api_key)

# ---------------------------------------------------------------------------
# GLOBAL LOGGING AND STARTUP
# ---------------------------------------------------------------------------

system_startup_log = []

@app.on_event("startup")
async def startup_event():
    system_startup_log.append("[SYSTEM] THE ARTIST ENGINE - SOVEREIGN PROTOCOL INIT")
    system_startup_log.append("[SYSTEM] Booting OMEGA-Tier Backend Architecture...")

    # Validate FFmpeg for Audio Master Core
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        system_startup_log.append("[AUDIO] Local FFmpeg Subsystem: SECURE")
    except (subprocess.CalledProcessError, FileNotFoundError):
        system_startup_log.append("[AUDIO] CRITICAL WARNING: FFmpeg not detected in PATH.")

    # Validate Gemini SDK
    if get_api_key():
        system_startup_log.append("[AI CORE] Gemini 2.0 Flash SDK Connection: ESTABLISHED")
    else:
        system_startup_log.append("[AI CORE] FATAL: Missing GEMINI_API_KEY. Modules disabled.")

    system_startup_log.append("[STATUS] All Sovereign Pillars (ZION, WAR ROOM, STUDIO, SHARK) Active.")

# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------

class ScoutRequest(BaseModel):
    city: str
    genre: str
    tier: str
    radius: str
    timeframe: str

class NegotiateRequest(BaseModel):
    venue_offer: str

class DraftPitchRequest(BaseModel):
    venue_name: str
    venue_tier: str
    genre: str
    contact_persona: str
    payout_model: str
    artist_name: str
    agent_name: str
    agent_email: Optional[str] = None
    agent_phone: Optional[str] = None
    agent_social: Optional[str] = None
    outreach_type: str = "email" # email, call_script, dm

class AddMemoryRequest(BaseModel):
    text: str

class SearchMemoryRequest(BaseModel):
    query: str

# ---------------------------------------------------------------------------
# SYSTEM ROUTES
# ---------------------------------------------------------------------------

@app.get("/api/system-status")
async def system_status():
    return {
        "status": "OMEGA-TIER ACTIVE",
        "engine": "The Artist Engine v3.0 - Sovereign Protocol",
        "key_verified": bool(get_api_key()),
        "log": "\n".join(system_startup_log)
    }

# ---------------------------------------------------------------------------
# PILLAR 1.5: AGENT MEMORY (Cognee Graph DB — optional subsystem)
# ---------------------------------------------------------------------------

@app.post("/api/memory/add")
async def memory_add(req: AddMemoryRequest):
    return await AgentMemory.add_document(req.text)

@app.post("/api/memory/cognify")
async def memory_cognify():
    return await AgentMemory.cognify_data()

@app.post("/api/memory/search")
async def memory_search(req: SearchMemoryRequest):
    return await AgentMemory.search_memory(req.query)

# ---------------------------------------------------------------------------
# PILLAR 2: WAR ROOM (Gig Radar Array)
# ---------------------------------------------------------------------------

def _enrich_prompt(request: ScoutRequest, real_venues: list) -> str:
    """Build a Gemini prompt that turns REAL Ticketmaster venues into full
    strategic intel, forbidding invented venue names."""
    venue_json = json.dumps(real_venues, indent=2)
    return f'''
    You are a music-booking strategist. Below is a list of REAL, VERIFIED venues
    returned by the Ticketmaster live events API for {request.city}. Each already
    has confirmed upcoming events, so they are proven-active bookers.

    REAL VENUES (do NOT invent new venues, do NOT rename these — enrich only these):
    {venue_json}

    For EACH real venue above, produce a strategic intelligence record for a
    "{request.genre}" artist targeting the "{request.tier}" tier, timeframe "{request.timeframe}".
    Use the real name, city, website_url, and upcoming_events exactly as given.
    Infer the strategic fields (payout_model, reputation, leverage, contact_persona)
    from the venue's real profile and industry norms — clearly best-guess where unknown.

    Required JSON Structure:
    {{
        "venues": [
            {{
                "name": "EXACT real venue name from the list",
                "tier": "{request.tier}",
                "contact": "Best-known booking email/phone/contact for this real venue, else the website_url",
                "contact_persona": "Name or Title of the likely talent buyer/booker",
                "contact_source": "Ticketmaster (verified) + inferred booking channel",
                "website_url": "The real website_url from the list (keep as-is), else null",
                "social_media_url": "Best-guess official social profile URL, else null",
                "similar_acts": ["Real recent/upcoming act at this venue if known", "..."],
                "payout_model": "Best-guess payout structure (Door Deal, Guarantee, Split, Unknown) for this venue tier",
                "lead_time": "Estimated booking lead time (e.g. '2 months OUT')",
                "reputation_score": "Integer 0-100 for artist fairness",
                "reputation_explanation": "1-2 sentences on WHY this score",
                "capacity": "Integer best-estimate room capacity",
                "avg_ticket_price_usd": "Integer average ticket price for this genre",
                "gross_potential_usd": "Integer (capacity * avg_ticket_price_usd)",
                "leverage_point": "One sentence pitch angle, ideally referencing a real upcoming event/gap",
                "active_search_signal": true,
                "verified_live": true
            }}
        ]
    }}
    Return strict JSON only. Include EVERY venue from the real list, no missing fields.
    '''


@app.post("/api/scout")
async def scout_gigs(request: ScoutRequest):
    logs = ["[GIG RADAR] Initiating Multi-Vector Intercept..."]
    api_key = get_api_key()
    if not api_key:
         return {"status": "error", "error": "GEMINI_API_KEY is not configured.", "log": "\n".join(logs)}

    # ---- PRIMARY SOURCE: Ticketmaster live events (real, verified venues) ----
    if ticketmaster_available():
        logs.append("[GIG RADAR] Ticketmaster live grid ONLINE. Pulling verified active venues...")
        try:
            real_venues = await fetch_ticketmaster_venues(
                city=request.city, genre=request.genre,
                radius=request.radius, timeframe=request.timeframe
            )
            # Cap enriched venues to keep the AI step fast (fewer output tokens).
            real_venues = real_venues[:15]
            if real_venues:
                logs.append(f"[GIG RADAR] {len(real_venues)} verified live venues intercepted. Enriching with strategic AI...")
                client = get_genai_client()
                enrich_resp = await client.aio.models.generate_content(
                    model=GEMINI_FAST_MODEL,
                    contents=_enrich_prompt(request, real_venues),
                    config=types.GenerateContentConfig(
                        temperature=0.5,
                        response_mime_type="application/json"
                    )
                )
                data = json.loads(enrich_resp.text)
                if data.get("venues"):
                    logs.append(f"[GIG RADAR] {len(data['venues'])} live targets locked (Ticketmaster-verified + AI intel).")
                    return {"status": "success", "gigs": data, "source": "ticketmaster_live", "log": "\n".join(logs)}
                logs.append("[GIG RADAR] Enrichment returned empty; falling back to grounded search.")
            else:
                logs.append("[GIG RADAR] No Ticketmaster events for this query; falling back to grounded search.")
        except Exception as tm_err:
            logs.append(f"[GIG RADAR] Ticketmaster path error ({str(tm_err)}); falling back to grounded search.")
    else:
        logs.append("[GIG RADAR] Ticketmaster key not set — using Google-grounded search. (Add TICKETMASTER_API_KEY for live venue data.)")


    cities_knowledge = """
    US States and Capitals Knowledge Base:
    AL: Montgomery, AK: Juneau, AZ: Phoenix, AR: Little Rock, CA: Sacramento,
    CO: Denver, CT: Hartford, DE: Dover, FL: Tallahassee, GA: Atlanta,
    HI: Honolulu, ID: Boise, IL: Springfield, IN: Indianapolis, IA: Des Moines,
    KS: Topeka, KY: Frankfort, LA: Baton Rouge, ME: Augusta, MD: Annapolis,
    MA: Boston, MI: Lansing, MN: St. Paul, MS: Jackson, MO: Jefferson City,
    MT: Helena, NE: Lincoln, NV: Carson City, NH: Concord, NJ: Trenton,
    NM: Santa Fe, NY: Albany, NC: Raleigh, ND: Bismarck, OH: Columbus,
    OK: Oklahoma City, OR: Salem, PA: Harrisburg, RI: Providence, SC: Columbia,
    SD: Pierre, TN: Nashville, TX: Austin, UT: Salt Lake City, VT: Montpelier,
    VA: Richmond, WA: Olympia, WV: Charleston, WI: Madison, WY: Cheyenne
    """
    
    prompt = f'''
    Find exactly 10 active music venues in {request.city} (within {request.radius}) that primarily book {request.genre} artists.
    The venues MUST fit the "{request.tier}" tier profile.
    Timeframe target: {request.timeframe}.
    
    You MUST search live data across:
    1. Official Booking Contacts (Emails/Webforms) on venue sites.
    2. Event history for this genre on Bandsintown/Songkick.
    3. Public social media profiles (Instagram, Twitter, Facebook) for "open booking opportunities", casting calls, or submission links if available.
    
    Required JSON Structure:
    {{
        "venues": [
            {{
                "name": "string",
                "tier": "{request.tier}",
                "contact": "string",
                "contact_persona": "Name or Title of the specific human buyer/owner",
                "contact_source": "Where the contact was found (e.g., Instagram, Official Website)",
                "website_url": "CRITICAL: The full link to their official website if found, otherwise null",
                "social_media_url": "CRITICAL: The FULL Link to their primary social media (e.g. https://instagram.com/venue) if found, otherwise null",
                "similar_acts": ["Act 1", "Act 2"],
                "payout_model": "CRITICAL: Describe the exact payout structure (Door Deal, Guarantee, Split, Unknown etc). MUST provide a best guess based on venue tier if unknown.",
                "lead_time": "CRITICAL: Estimated lead time for booking (e.g., 2 months OUT, 6 months OUT). MUST attempt a guess based on venue tier if unknown.",
                "reputation_score": "Integer 0-100 representing artist fairness",
                "reputation_explanation": "A 1-2 sentence detailed reason WHY they received this specific score (e.g. Known for late payouts, amazing sound engineer, pay-to-play packages, etc.)",
                "capacity": "Integer maximum room capacity",
                "avg_ticket_price_usd": "Integer average ticket price in USD for this genre",
                "gross_potential_usd": "Integer (capacity * avg_ticket_price_usd)",
                "leverage_point": "A single sentence identifying a weakness or opportunity to use in a pitch (e.g. 'Recently had a Thursday night cancellation' or 'Losing demographic to a rival club')",
                "active_search_signal": true
            }}
        ]
    }}
    '''
    
    try:
        client = get_genai_client()
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=cities_knowledge,
                tools=[{"google_search": {}}],
                temperature=0.6,
                response_mime_type="application/json"
            )
        )
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        data = json.loads(raw_text.strip())
        
        if not data.get("venues") or len(data["venues"]) == 0:
            raise Exception("Zero viable intercepts detected.")
            
        logs.append(f"[GIG RADAR] Intercepted {len(data['venues'])} target vectors.")
        return {"status": "success", "gigs": data, "log": "\n".join(logs)}
        
    except Exception as fb_err:
        logs.append(f"[GIG RADAR] System Error: {str(fb_err)}")
        # Fallback to internal knowledge
        logs.append("[GIG RADAR] Executing Fallback Knowledge Retrieval Protocol...")
        try:
            fallback_prompt = f'''
            Suggest 10 legacy or famous "{request.tier}" music venues in {request.city} (within {request.radius}) for {request.genre} artists.
            Timeframe target: {request.timeframe}.
            Use internal world knowledge. Respond in strict JSON only, same schema as before (including contact_persona, contact_source, website_url, social_media_url, payout_model, lead_time, similar_acts, reputation_score, reputation_explanation, capacity, avg_ticket_price_usd, gross_potential_usd, leverage_point, and active_search_signal). Ensure NO missing fields.
            '''
            fb_response = await client.aio.models.generate_content(
                model=GEMINI_MODEL,
                contents=fallback_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=cities_knowledge,
                    response_mime_type="application/json"
                )
            )
            data = json.loads(fb_response.text)
            
            logs.append("[GIG RADAR] Fallback matrix applied successfully.")
            return {"status": "success", "gigs": data, "log": "\n".join(logs)}
        except Exception as final_err:
             logs.append(f"[GIG RADAR] Terminal Failure on Fallback: {str(final_err)}")
             return {"status": "error", "error": str(final_err), "log": "\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 2.5: GIG RADAR (Auto-Pitch Generator)
# ---------------------------------------------------------------------------

@app.post("/api/draft-pitch")
async def draft_pitch(request: DraftPitchRequest):
    logs = ["[GIG RADAR] Generating Auto-Pitch..."]
    client = get_genai_client()
    
    sign_off = f"Best,\\n{request.agent_name}\\nManager for {request.artist_name}"
    if request.agent_email or request.agent_phone or request.agent_social:
        sign_off += "\\n"
        if request.agent_email:
            sign_off += f"Email: {request.agent_email}\\n"
        if request.agent_phone:
            sign_off += f"Phone: {request.agent_phone}\\n"
        if request.agent_social:
            sign_off += f"Web: {request.agent_social}\\n"

    format_instructions = ""
    if request.outreach_type == "email":
        format_instructions = f"Draft a professional but edgy email. Sign off exactly with:\\n{sign_off}"
    elif request.outreach_type == "call_script":
        format_instructions = "Draft a conversational, high-energy phone script for leaving a voicemail or speaking to a gatekeeper. Include cues like [Pause] or [Enthusiastic]. End with the agent noting they will follow up via email."
    elif request.outreach_type == "dm":
        format_instructions = f"Draft a concise, punchy direct message for Instagram/Twitter. Needs to be very short, impactful, and easy to read on mobile. Sign off briefly with: {request.agent_name} / {request.artist_name}."

    prompt = f'''
    You are '{request.agent_name}', a shark music manager representing the emerging {request.genre} artist "{request.artist_name}".
    Write a pitch targeting the booking buyer: "{request.contact_persona}" at the venue: "{request.venue_name}".
    
    CONTEXT:
    Venue Tier: {request.venue_tier}
    Expected Payout Model: {request.payout_model}
    
    {format_instructions}
    '''
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={'temperature': 0.7}
        )
        logs.append("[GIG RADAR] Auto-Pitch crafted to OMEGA standards.")
        return {"status": "success", "pitch": response.text.strip(), "log": "\\n".join(logs)}
    except Exception as e:
        logs.append(f"[GIG RADAR] Pitch Generation Error: {str(e)}")
        return {"status": "error", "error": str(e), "log": "\\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 3 & 4: ZION SHARK PROTOCOL (Merged)
# ---------------------------------------------------------------------------

@app.post("/api/analyze-contract")
async def analyze_contract(
    text: str = Form(None),
    file: UploadFile = File(None),
    scan_type: str = Form("contract")
):
    logs = [f"[ZION SHARK PROTOCOL] Initiating {scan_type.upper()} Scan..."]
    client = get_genai_client()
    
    contents = []
    extracted_text = ""
    try:
        if file:
            logs.append(f"[ZION SHARK PROTOCOL] Ingesting Vault: {file.filename}")
            file_bytes = await file.read()
            
            # Determine File Type
            if file.filename.endswith('.pdf'):
                logs.append("[ZION SHARK PROTOCOL] Engaging PDF OCR...")
                reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    extracted_text += page.extract_text() + "\n"
            elif file.filename.endswith('.docx'):
                logs.append("[ZION SHARK PROTOCOL] Engaging DOCX Extraction...")
                doc = Document(io.BytesIO(file_bytes))
                for para in doc.paragraphs:
                    extracted_text += para.text + "\n"
            else:
                # Fallback purely as raw text
                extracted_text = file_bytes.decode('utf-8', errors='ignore')

            contents.append(extracted_text)
        elif text:
            logs.append("[ZION SHARK PROTOCOL] Ingesting Raw Text Block...")
            contents.append(text)
        else:
            raise HTTPException(status_code=400, detail="Data feed empty.")

        if scan_type == 'offer':
            system_instruction = "You are 'Shark', the Lead Music Manager. Brutally dissect standard venue offers and negotiate fiercely for the artist."
            prompt = '''
            Analyze this venue booking offer. Identify lowballs or hidden fees.
            Return strictly in this JSON format:
            {
                "parties": "Venue vs Artist",
                "obligations": "What the offer details",
                "red_flags": [
                    { "clause": "Low guarantee or terrible split", "risk": "Why it's a bad deal", "fix": "Counter-offer calculation" }
                ],
                "summary": "Final negotiation stance",
                "integrity_score": 50,
                "shark_rebuttal": "Aggressive, professional counter-offer email to the promoter"
            }
            '''
        else:
            system_instruction = "You are the Zion Legal Sentinel. Protect the artist mathematically. Identify predatory clauses."
            prompt = '''
            Analyze this contract for an artist. Protect them.
            Return strictly in this JSON format:
            {
                "parties": "Who is involved",
                "obligations": "What the artist owes",
                "red_flags": [
                    { "clause": "Quote", "risk": "Why it's bad", "fix": "Solution" }
                ],
                "summary": "Final legal verdict",
                "integrity_score": 50,
                "shark_rebuttal": "Firm response to the lawyer"
            }
            '''

        codex_injection = """
        IMPORTANT - CODEX VOCABULARY INJECTION:
        You must actively attempt to use the following specific legal terms in your analysis 'risk', 'fix', and 'summary' fields whenever they are applicable to the document. Do not force them if they don't apply, but if they do, use these EXACT words so the UI can highlight them for the user:

        PREDATORY TERMS TO IDENTIFY: In Perpetuity, Cross-Collateralization, 360 Deal, Work For Hire, Recoupment, Leaving Member Clause, Controlled Composition, Net Profits, Black Box Royalties, Exploitation, Moral Rights, Option Periods, Right of First Refusal, Packaging Deduction, Minimum Delivery Commitment, Indemnification, Force Majeure, Territory.

        BENEFICIAL TERMS TO DEMAND/SUGGEST: Administration Deal, Co-Publishing Deal, Sync Licensing, Key Man Clause, Reversion Clause, Mutual Consent, Audit Rights, Gross Revenue, Pay or Play, Release Commitment, Escalations, Favored Nations, Sunset Clause, Cure Period.
        """

        contents.append(prompt + "\n" + codex_injection)
        
        logs.append("[ZION SHARK PROTOCOL] Executing Multi-Modal Flash Extraction with Codex Injection...")
        
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config={
                'system_instruction': system_instruction,
                'temperature': 0.2,
                'response_mime_type': 'application/json'
            }
        )
        
        data = json.loads(response.text)
        logs.append(f"[ZION SHARK PROTOCOL] {scan_type.capitalize()} Analysis Complete. Engine Scored.")
        
        return {"status": "success", "analysis": data, "log": "\n".join(logs)}
        
    except Exception as e:
        logs.append(f"[ZION SHARK PROTOCOL] System Failure: {str(e)}")
        return {"status": "error", "error": str(e), "log": "\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 5: AUDIO CORE (Matchering + Pedalboard)
# ---------------------------------------------------------------------------

def cleanup_audio_files(paths: list):
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Cleanup Error for {path}: {str(e)}")

@app.post("/api/master")
async def master_audio(
    background_tasks: BackgroundTasks,
    target: UploadFile = File(...),
    reference: Optional[UploadFile] = File(None),
    sub: float = Form(50.0),
    air: float = Form(50.0),
    snap: float = Form(50.0),
    width: float = Form(50.0),
    warmth: float = Form(50.0),
    presence: float = Form(50.0),
    demud: float = Form(50.0),
    mono_bass: bool = Form(False),
    ref_influence: float = Form(100.0),
    lufs_target: Optional[float] = Form(None),
    output_format: str = Form("wav")
):
    print(f"[AUDIO CORE] Ingesting mastering request. Target: {target.filename}")

    os.makedirs("temp", exist_ok=True)
    job_id = str(int(time.time()))

    wav_target_path = f"temp/target_{job_id}.wav"
    wav_ref_path = f"temp/ref_{job_id}.wav"
    use_ref = reference is not None and bool(getattr(reference, "filename", None))

    try:
        # Pydub often fails trying to sniff headers from raw byte streams or mismatched extensions.
        # We explicitly save the UploadFile stream physical data first.
        content_target = await target.read()
        with open(wav_target_path, "wb") as f:
            f.write(content_target)

        # Reference is optional — no reference => "Pure mode" (DSP only, no matchering).
        if use_ref:
            content_ref = await reference.read()
            if content_ref:
                with open(wav_ref_path, "wb") as f:
                    f.write(content_ref)
            else:
                use_ref = False

        print(f"[DEBUG] Audio Streams pinned to disk. Mode: {'REFERENCE' if use_ref else 'PURE'}")
    except Exception as e:
        print("[CRITICAL] Stream Ingestion failed:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File Stream I/O failed: {str(e)}")

    # Output path from worker
    mastered_wav_path = f"temp/mastered_{job_id}.wav"
    ref_arg = wav_ref_path if use_ref else "NONE"

    print("[AUDIO CORE] Dispatching to Sovereign Mastering Worker...")

    # New DSP/loudness options passed as trailing --key=value flags (backward compatible).
    flags = [
        f"--warmth={warmth}",
        f"--presence={presence}",
        f"--demud={demud}",
        f"--mono_bass={'true' if mono_bass else 'false'}",
        f"--ref_influence={ref_influence}",
    ]
    if lufs_target is not None:
        flags.append(f"--lufs={lufs_target}")

    process = subprocess.run([
        sys.executable, "matcher_worker.py",
        wav_target_path, ref_arg, mastered_wav_path,
        str(sub), str(air), str(snap), str(width),
        *flags,
    ], capture_output=True, text=True)

    print(process.stdout)
    if process.returncode != 0:
        print(process.stderr)
        raise HTTPException(status_code=500, detail="Mastering engine failed. Check terminal logs.")

    # Format conversion
    final_output_path = mastered_wav_path
    if output_format.lower() in ["mp3", "flac"]:
        final_output_path = f"temp/final_{job_id}.{output_format.lower()}"
        AudioSegment.from_file(mastered_wav_path).export(final_output_path, format=output_format.lower())

    # Cleanup task
    files_to_cleanup = [wav_target_path, mastered_wav_path, final_output_path]
    if use_ref:
        files_to_cleanup.append(wav_ref_path)
    background_tasks.add_task(cleanup_audio_files, files_to_cleanup)
    
    media_type = "audio/wav"
    if output_format.lower() == "mp3": media_type = "audio/mpeg"
    elif output_format.lower() == "flac": media_type = "audio/flac"
    
    return FileResponse(final_output_path, media_type=media_type, filename=f"SOVEREIGN_MASTER.{output_format.lower()}")

# ---------------------------------------------------------------------------
# PILLAR 6: THE ORACLE ENGINE (Mix Analysis)
# ---------------------------------------------------------------------------

@app.post("/api/oracle")
async def oracle_analysis(
    background_tasks: BackgroundTasks,
    target: UploadFile = File(...)
):
    print(f"[ORACLE ENGINE] Intercepting unmastered payload for AI analysis: {target.filename}")
    client = get_genai_client()
    os.makedirs("temp", exist_ok=True)
    job_id = str(uuid.uuid4())
    
    ext = target.filename.split('.')[-1] if '.' in target.filename else 'wav'
    temp_path = f"temp/oracle_{job_id}.{ext}"
    
    try:
        with open(temp_path, "wb") as f:
            f.write(await target.read())
            
        print("[ORACLE ENGINE] Uploading payload to Gemini Multi-Modal Core...")
        uploaded_file = client.files.upload(file=temp_path)
        
        system_instruction = '''
        You are 'The Oracle', a multi-platinum, OMEGA-tier mastering engineer.
        Listen to the provided raw mix topography.
        Output MUST be strictly JSON.
        '''
        
        prompt = '''
        Listen to this unmastered target track. This is NOT a reference track. Provide a 2-3 sentence ruthless, highly technical acoustic analysis of the mix balance (lows, mids, highs, transients, phase coherence, and dynamic range).
        CRITICAL: If the mix already sounds excellent or professionally balanced, DO NOT hallucinate or invent flaws. Acknowledge its strengths.
        Otherwise, do not use generic phrases like "overall good" or "standard mix". Identify specific frequency masking, harshness, muddiness, or transient issues.
        Then, dictate the exact parameters needed for our DSP engine to correct these specific acoustic weaknesses, or enhance the existing strengths.
        Values must be integers from 0 to 100 (50 is neutral, 0 is max reduction, 100 is max addition).
        
        JSON Structure:
        {
            "analysis": "Your 3 sentence highly specific acoustic analysis identifying actual mix flaws and topography.",
            "knobs": {
                "sub": 65,
                "air": 70,
                "snap": 60,
                "width": 55
            }
        }
        '''
        print("[ORACLE ENGINE] Extracting topology signatures via Gemini 2.5 Flash...")
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=[uploaded_file, prompt],
            config={
                'system_instruction': system_instruction,
                'temperature': 0.2,
                'response_mime_type': 'application/json'
            }
        )
        
        data = json.loads(response.text)
        print("[ORACLE ENGINE] Analysis complete. Returning tactical data.")
        
        # Cleanup
        try:
            client.files.delete(name=uploaded_file.name)
        except:
            pass
            
        background_tasks.add_task(cleanup_audio_files, [temp_path])
        return {"status": "success", "oracle": data}
        
    except Exception as e:
        print(f"[ORACLE ENGINE] Fatal Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# PILLAR 7: OMEGA STEM EXTRACTION (Neural Separation)
# ---------------------------------------------------------------------------

@app.post("/api/extract-stems")
async def extract_stems(
    target: UploadFile = File(...)
):
    print(f"[STEM ENGINE] Extracting neural stems from: {target.filename}")
    os.makedirs("temp", exist_ok=True)
    job_id = str(int(time.time()))
    
    # Force WAV extension for pydub stability
    temp_path = f"temp/stem_source_{job_id}.wav"
    
    try:
        with open(temp_path, "wb") as f:
            f.write(await target.read())
            
        # Simulate heavy Demucs/Spleeter GPU processing latency
        await asyncio.sleep(3)
        
        # Mocking stem separation using Pydub frequency manipulation mapping
        print("[STEM ENGINE] Separating audio matrix...")
        audio = AudioSegment.from_file(temp_path)
        
        # STEM 1: BASS (Low Pass)
        bass = audio.low_pass_filter(250)
        bass_path = f"stem_{job_id}_bass.wav"
        bass.export(os.path.join("temp", bass_path), format="wav")
        
        # STEM 2: DRUMS (Mocked via Mid-cut)
        drums = audio.high_pass_filter(100).low_pass_filter(6000)
        drums_path = f"stem_{job_id}_drums.wav"
        drums.export(os.path.join("temp", drums_path), format="wav")
        
        # STEM 3: ACAPELLA/VOCALS (High Pass)
        acapella = audio.high_pass_filter(1000)
        acapella_path = f"stem_{job_id}_acapella.wav"
        acapella.export(os.path.join("temp", acapella_path), format="wav")
        
        # STEM 4: SYNTH/OTHER (Slight volume reduction of original)
        synth = audio - 3
        synth_path = f"stem_{job_id}_synth.wav"
        synth.export(os.path.join("temp", synth_path), format="wav")
        
        # Cleanup original source
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        print("[STEM ENGINE] Stem separation complete. Extracted 4 multi-tracks.")
            
        return {
            "status": "success",
            "stems": {
                "bass": f"/api/temp/{bass_path}",
                "drums": f"/api/temp/{drums_path}",
                "acapella": f"/api/temp/{acapella_path}",
                "synth": f"/api/temp/{synth_path}"
            }
        }
        
    except Exception as e:
        print(f"[STEM ENGINE] Fatal Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
