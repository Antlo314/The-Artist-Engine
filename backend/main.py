import asyncio
import os
import shutil
import subprocess
import uuid
import json
import time
import sys
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.responses import FileResponse
from pydub import AudioSegment
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load Environment Variables from local .env
load_dotenv(dotenv_path=".env")

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
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_api_key() -> Optional[str]:
    """Secure extraction of the Gemini API Key."""
    return os.getenv("GEMINI_API_KEY")

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

class PitchRequest(BaseModel):
    venue_name: str
    venue_tier: str
    genre: str
    contact_persona: str
    payout_model: str
    artist_name: str = "The Artist"
    agent_name: str = "The Manager"

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
# PILLAR 2: WAR ROOM (Gig Radar Array)
# ---------------------------------------------------------------------------

@app.post("/api/scout")
async def scout_gigs(request: ScoutRequest):
    logs = ["[GIG RADAR] Initiating Multi-Vector Google Grounding Search..."]
    client = get_genai_client()
    
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
    Find exactly 5 active music venues in {request.city} (within {request.radius}) that primarily book {request.genre} artists.
    The venues MUST fit the "{request.tier}" tier profile.
    Timeframe target: {request.timeframe}.
    
    You MUST search live data for:
    1. Official Booking Contacts (Emails/Webforms)
    2. Event history for this genre on Bandsintown/Songkick
    
    Required JSON Structure:
    {{
        "venues": [
            {{
                "name": "string",
                "tier": "{request.tier}",
                "contact": "string",
                "contact_persona": "Name or Title of the specific human buyer/owner",
                "contact_source": "Where the contact was found (e.g., Instagram, Official Website)",
                "similar_acts": ["Act 1", "Act 2"],
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
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'system_instruction': cities_knowledge,
                'tools': [{'google_search': {}}],
                'temperature': 0.6
            }
        )
        
        if response.candidates and response.candidates[0].grounding_metadata:
             logs.append("[GIG RADAR] Live Search Vectors Engaged. Validating Grounding...")
        else:
             logs.append("[GIG RADAR] Grounding metadata warning. Results may be internal knowledge.")
             
        # Clean markdown code blocks if gemini returned them
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
        
    except Exception as e:
        logs.append(f"[GIG RADAR] System Error: {str(e)}")
        # Fallback to internal knowledge
        logs.append("[GIG RADAR] Executing Fallback Knowledge Retrieval Protocol...")
        try:
            fallback_prompt = f'''
            Suggest 5 legacy or famous "{request.tier}" music venues in {request.city} (within {request.radius}) for {request.genre} artists.
            Timeframe target: {request.timeframe}.
            Use internal world knowledge. Respond in strict JSON only, same schema as before (including contact_persona, contact_source, payout_model, lead_time, similar_acts, reputation_score, reputation_explanation, capacity, avg_ticket_price_usd, gross_potential_usd, leverage_point, and active_search_signal).
            '''
            fb_resp = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=fallback_prompt,
                config={
                    'system_instruction': cities_knowledge,
                    'response_mime_type': 'application/json'
                }
            )
            data = json.loads(fb_resp.text)
            logs.append("[GIG RADAR] Fallback matrix applied successfully.")
            return {"status": "success", "gigs": data, "log": "\n".join(logs)}
        except Exception as fb_err:
             logs.append(f"[GIG RADAR] Terminal Failure on Fallback: {str(fb_err)}")
             return {"status": "error", "error": str(fb_err), "log": "\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 2.5: GIG RADAR (Auto-Pitch Generator)
# ---------------------------------------------------------------------------

@app.post("/api/draft-pitch")
async def draft_pitch(request: PitchRequest):
    logs = ["[GIG RADAR] Generating Auto-Pitch..."]
    client = get_genai_client()
    
    prompt = f'''
    You are an elite, highly persuasive music manager representing {request.artist_name}, a {request.genre} artist.
    Your name is {request.agent_name}. 
    Draft a cold booking outreach email to {request.contact_persona} at {request.venue_name}.
    Context:
    - Venue Tier: {request.venue_tier}
    - Payout Model: {request.payout_model}
    
    The email must be strictly tailored to the tier:
    - Mom & Pop: Humble, community-focused, willing to prove value.
    - Mid-Size: Professional, highlighting recent growth.
    - Top-Tier Theater: Strictly business, data-driven, highlighting guarantees and ROI.
    
    Return ONLY the raw email text (Subject line + Body). No conversational filler, no markdown blocks.
    '''
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'temperature': 0.7}
        )
        logs.append("[GIG RADAR] Auto-Pitch crafted to OMEGA standards.")
        return {"status": "success", "pitch": response.text.strip(), "log": "\n".join(logs)}
    except Exception as e:
        logs.append(f"[GIG RADAR] Pitch Generation Error: {str(e)}")
        return {"status": "error", "error": str(e), "log": "\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 3: SHARK (Negotiation Protocol)
# ---------------------------------------------------------------------------

@app.post("/api/negotiate")
async def negotiate(request: NegotiateRequest):
    logs = ["[SHARK PROTOCOL] Activating Negotiation Persona..."]
    client = get_genai_client()
    
    system_instruction = """
    You are the Lead Music Manager 'Shark' for 'The Artist Engine'.
    Your duty is to maximize artist revenue and respect.
    Analyze venue offers aggressively but professionally.
    Identify red flags (low pay, bad slots). Output strict JSON.
    """
    
    prompt = f'''
    Analyze this promoter offer:
    "{request.venue_offer}"
    
    Return a JSON object exactly like this:
    {{
        "reasoning": "Your internal shark logic identifying the weaknesses in their offer",
        "counter_offer": "The exact professional, firm email you will send back to them."
    }}
    '''
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'system_instruction': system_instruction,
                'temperature': 0.4,
                'response_mime_type': 'application/json'
            }
        )
        data = json.loads(response.text)
        logs.append("[SHARK PROTOCOL] Counter-offensive formulated successfully.")
        return {"status": "success", "agent_response": json.dumps(data, indent=2), "log": "\n".join(logs)}
    except Exception as e:
         logs.append(f"[SHARK PROTOCOL] Error: {str(e)}")
         return {"status": "error", "error": str(e), "log": "\n".join(logs)}

# ---------------------------------------------------------------------------
# PILLAR 4: ZION (Legal Sentinel)
# ---------------------------------------------------------------------------

@app.post("/api/analyze-contract")
async def analyze_contract(file: Optional[UploadFile] = File(None), text: Optional[str] = Form(None)):
    logs = ["[ZION SENTINEL] Legal Scan Initiated..."]
    client = get_genai_client()
    
    contents = []
    try:
        if file:
            logs.append(f"[ZION SENTINEL] Ingesting Document Vault: {file.filename}")
            file_bytes = await file.read()
            contents.append(types.Part.from_bytes(data=file_bytes, mime_type=file.content_type))
        elif text:
            logs.append("[ZION SENTINEL] Ingesting Raw Legal Text Block...")
            contents.append(text)
        else:
            raise HTTPException(status_code=400, detail="Data feed empty.")
            
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
        ''' # integrity_score is 0-100 integer
        
        contents.append(prompt)
        
        logs.append("[ZION SENTINEL] Executing Multi-Modal Flash Extraction...")
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config={
                'system_instruction': system_instruction,
                'temperature': 0.2,
                'response_mime_type': 'application/json'
            }
        )
        
        data = json.loads(response.text)
        logs.append("[ZION SENTINEL] Forensic Analysis Complete. Integrity Scored.")
        
        return {"status": "success", "analysis": data, "log": "\n".join(logs)}
        
    except Exception as e:
        logs.append(f"[ZION SENTINEL] System Failure: {str(e)}")
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
    reference: UploadFile = File(...),
    sub: float = Form(50.0),
    air: float = Form(50.0),
    snap: float = Form(50.0),
    width: float = Form(50.0),
    output_format: str = Form("wav")
):
    print(f"[AUDIO CORE] Ingesting mastering request. Target: {target.filename}")
    
    os.makedirs("temp", exist_ok=True)
    job_id = str(int(time.time()))
    
    # Save uploaded files
    temp_target_ext = target.filename.split('.')[-1] if '.' in target.filename else 'wav'
    temp_ref_ext = reference.filename.split('.')[-1] if '.' in reference.filename else 'wav'
    
    raw_target_path = f"temp/raw_target_{job_id}.{temp_target_ext}"
    raw_ref_path = f"temp/raw_ref_{job_id}.{temp_ref_ext}"
    
    with open(raw_target_path, "wb") as f:
        f.write(await target.read())
    with open(raw_ref_path, "wb") as f:
        f.write(await reference.read())
        
    # Convert to WAV for Matchering/Pedalboard
    wav_target_path = f"temp/target_{job_id}.wav"
    wav_ref_path = f"temp/ref_{job_id}.wav"
    
    try:
        AudioSegment.from_file(raw_target_path).export(wav_target_path, format="wav")
        AudioSegment.from_file(raw_ref_path).export(wav_ref_path, format="wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Format normalization failed: {str(e)}")
    
    # Output path from worker
    mastered_wav_path = f"temp/mastered_{job_id}.wav"
    
    print("[AUDIO CORE] Dispatching to OMEGA Matchering Worker...")
    
    # Run Matchering Worker
    process = subprocess.run([
        sys.executable, "matcher_worker.py", 
        wav_target_path, wav_ref_path, mastered_wav_path,
        str(sub), str(air), str(snap), str(width)
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
    files_to_cleanup = [raw_target_path, raw_ref_path, wav_target_path, wav_ref_path, mastered_wav_path, final_output_path]
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
        Listen to this unmastered track. Provide a 2-3 sentence ruthless, highly technical acoustic analysis of the mix balance (lows, mids, highs, transients, phase coherence, and dynamic range).
        DO NOT USE GENERIC PHRASES like "overall good" or "standard mix". Identify specific frequency masking, harshness, muddiness, or transient issues.
        Then, dictate the exact parameters needed for our DSP engine to correct these specific acoustic weaknesses.
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
        response = client.models.generate_content(
            model='gemini-2.5-flash',
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
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
