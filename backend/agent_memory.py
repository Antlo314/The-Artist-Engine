import asyncio
import os
import traceback
import json

from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")

gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    os.environ["LLM_API_KEY"] = gemini_key
    os.environ["LLM_PROVIDER"] = "gemini" # Cognee specific standard
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"

# Cognee is an OPTIONAL knowledge-graph subsystem. It is a heavy dependency and
# is NOT required for the core product (mastering, gig radar, legal). We import
# it lazily so a missing/broken cognee install can never take down the whole
# backend — memory endpoints degrade gracefully instead.
_cognee = None
_cognee_checked = False


def _get_cognee():
    """Lazily import cognee. Returns the module, or None if unavailable."""
    global _cognee, _cognee_checked
    if _cognee_checked:
        return _cognee
    _cognee_checked = True
    try:
        import cognee as _c
        _cognee = _c
        print("[MEMORY MATRIX] Cognee knowledge graph online.")
    except Exception as e:
        _cognee = None
        print(f"[MEMORY MATRIX] Cognee unavailable — memory subsystem disabled ({type(e).__name__}). "
              "Core engine (mastering / gig radar / legal) is unaffected.")
    return _cognee


def is_memory_available() -> bool:
    return _get_cognee() is not None


_UNAVAILABLE = {
    "status": "unavailable",
    "message": "Memory subsystem (cognee) is not installed in this environment. "
               "Core features are unaffected.",
}


class AgentMemory:
    """
    Sovereign IP Knowledge Engine (Cognee Wrapper).
    Handles ingesting complex IP rules and creating persistent
    graph connections so the Oracle never forgets.
    """

    @staticmethod
    async def add_document(text_data: str, doc_id: str = None):
        """Add text data directly to the memory engine."""
        cognee = _get_cognee()
        if cognee is None:
            return dict(_UNAVAILABLE)
        try:
            print(f"[MEMORY MATRIX] Ingesting document chunk. ID: {doc_id}")
            # cognee handles raw text ingestion directly
            await cognee.add(text_data)
            return {"status": "success", "message": "Document added to pipeline."}
        except Exception as e:
            traceback.print_exc()
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def cognify_data():
        """Process the ingested data into the graph matrix (cognify)."""
        cognee = _get_cognee()
        if cognee is None:
            return dict(_UNAVAILABLE)
        try:
            print("[MEMORY MATRIX] Cognifying data... Building graph connections.")
            await cognee.cognify()
            return {"status": "success", "message": "Memory matrix cognified."}
        except Exception as e:
            traceback.print_exc()
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def search_memory(query_text: str):
        """Perform a hybrid graph-vector search on the cognitive matrix."""
        cognee = _get_cognee()
        if cognee is None:
            return dict(_UNAVAILABLE)
        try:
            print(f"[MEMORY MATRIX] Searching memory for: '{query_text}'")
            results = await cognee.search(query_text)
            
            # Cognee returns a list of results. We format it into a string context
            # to be injected directly into the Gemini Oracle prompt.
            formatted_results = []
            for result in results:
                # Results can be complex objects, try to extract textual representation
                formatted_results.append(str(result))
                
            return {
                "status": "success", 
                "results": formatted_results
            }
        except Exception as e:
            traceback.print_exc()
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def clear_memory():
        """Wipe the entire memory matrix (Developer use only)"""
        cognee = _get_cognee()
        if cognee is None:
            return dict(_UNAVAILABLE)
        try:
            print("[MEMORY MATRIX] Wiping entire cognition matrix.")
            await cognee.prune.prune_system()
            return {"status": "success", "message": "Memory wiped."}
        except Exception as e:
             traceback.print_exc()
             return {"status": "error", "message": str(e)}
