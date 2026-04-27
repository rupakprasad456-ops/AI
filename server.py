# server.py
"""
MCP Server for Pests and Schemes with LangSmith Observability
Run with: python server.py
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

# ================= LANGSMITH SETUP =================
try:
    from langsmith import traceable
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    def traceable(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

# Enable LangSmith tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"

# ================= ENV VARIABLES =================
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY", "")
LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "pest-scheme-mcp-server")

# 
GLOBAL_API_KEY = os.getenv("API_KEY", "")

# ================= SAMPLE DATA =================
PESTS = [
    {"id": "1", "name": "Aphid", "category": "Insect", "damage": "Sucks sap from plants", "treatment": "Insecticidal soap"},
    {"id": "2", "name": "Whitefly", "category": "Insect", "damage": "Yellowing leaves", "treatment": "Yellow sticky traps"},
    {"id": "3", "name": "Spider Mite", "category": "Arachnid", "damage": "Webbing on plants", "treatment": "Neem oil"},
]

SCHEMES = [
    {"id": "1", "name": "PM-KISAN", "type": "Central", "benefit": "₹6000/year", "eligibility": "Small farmers"},
    {"id": "2", "name": "PMFBY", "type": "Central", "benefit": "Crop insurance", "eligibility": "All farmers"},
]

# ================= FASTAPI APP =================
app = FastAPI(title="Pest & Scheme MCP Server", version="1.0.0")

# ================= REQUEST MODELS =================
class PestSearchRequest(BaseModel):
    search: Optional[str] = None
    category: Optional[str] = None

class SchemeSearchRequest(BaseModel):
    search: Optional[str] = None
    type: Optional[str] = None

class ApiKeyRequest(BaseModel):
    api_key: str

# ================= TOOLS =================

@traceable(name="get_pests")
def get_pests(search: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
    result = list(PESTS)

    if search:
        s = search.lower()
        result = [p for p in result if s in p["name"].lower()]

    if category:
        c = category.lower()
        result = [p for p in result if p["category"].lower() == c]

    return {"success": True, "count": len(result), "data": result}


@traceable(name="get_schemes")
def get_schemes(search: Optional[str] = None, type: Optional[str] = None) -> Dict[str, Any]:
    result = list(SCHEMES)

    if search:
        s = search.lower()
        result = [sch for sch in result if s in sch["name"].lower()]

    if type:
        t = type.lower()
        result = [sch for sch in result if sch["type"].lower() == t]

    return {"success": True, "count": len(result), "data": result}



@traceable(name="set_api_key")
def set_api_key(new_key: str) -> Dict[str, Any]:
    global GLOBAL_API_KEY
    GLOBAL_API_KEY = new_key
    return {"success": True, "message": "API key set successfully"}


@traceable(name="get_api_key")
def get_api_key() -> Dict[str, Any]:
    return {
        "success": True,
        "configured": bool(GLOBAL_API_KEY),
        "message": "Configured" if GLOBAL_API_KEY else "Not set"
    }

# ================= ENDPOINTS =================

@app.get("/")
def root():
    return {
        "name": "Pest & Scheme MCP Server",
        "status": "running",
        "langsmith_enabled": bool(LANGCHAIN_API_KEY)
    }

@app.post("/tools/get_pests")
def api_get_pests(req: PestSearchRequest):
    return get_pests(req.search, req.category)

@app.post("/tools/get_schemes")
def api_get_schemes(req: SchemeSearchRequest):
    return get_schemes(req.search, req.type)

@app.post("/tools/set_api_key")
def api_set_api_key(req: ApiKeyRequest):
    return set_api_key(req.api_key)

@app.get("/tools/get_api_key")
def api_get_api_key():
    return get_api_key()

@app.get("/health")
def health():
    return {"status": "healthy"}

# ================= RUN =================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Running on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)