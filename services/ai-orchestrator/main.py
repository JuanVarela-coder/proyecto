from typing import Dict, Any, List, Optional
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from skills.ingest_metadata.skill import IngestMetadataSkill
from skills.detect_intro_outro.skill import DetectIntroOutroSkill
from skills.auto_subtitle_sync.skill import AutoSubtitleSyncSkill
from skills.semantic_search.skill import SemanticSearchSkill
from skills.content_moderation.skill import ContentModerationSkill

from agents.content_processing_agent import ContentProcessingAgent
from agents.otaku_copilot_agent import OtakuCopilotAgent
from agents.community_governance_agent import CommunityGovernanceAgent

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

# Initialize skills
skills = {
    "ingest-metadata": IngestMetadataSkill(),
    "detect-intro-outro": DetectIntroOutroSkill(),
    "auto-subtitle-sync": AutoSubtitleSyncSkill(),
    "semantic-search": SemanticSearchSkill(),
    "content-moderation": ContentModerationSkill(),
}

# Initialize Agents (Fase 2 y 3)
content_agent = ContentProcessingAgent()
otaku_copilot_agent = OtakuCopilotAgent()
governance_agent = CommunityGovernanceAgent()


def get_health_payload() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "ai-orchestrator",
        "loaded_skills": list(skills.keys()),
        "active_agents": ["ContentProcessingAgent", "OtakuCopilotAgent", "CommunityGovernanceAgent"]
    }


def dispatch_post(path: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if path == "/skills/ingest-metadata":
        return skills["ingest-metadata"].execute(payload)
    if path == "/skills/detect-intro-outro":
        return skills["detect-intro-outro"].execute(payload)
    if path == "/skills/auto-subtitle-sync":
        return skills["auto-subtitle-sync"].execute(payload)
    if path == "/skills/semantic-search":
        return skills["semantic-search"].execute(payload)
    if path == "/skills/content-moderation":
        return skills["content-moderation"].execute(payload)
    if path == "/agents/process-content":
        result = content_agent.process_upload(payload)
        return {"success": True, "agent": "ContentProcessingAgent", "data": result}
    if path == "/agents/otaku-copilot":
        result = otaku_copilot_agent.chat(
            user_query=payload.get("query", ""),
            user_history=payload.get("user_history")
        )
        return {"success": True, "data": result}
    if path == "/agents/moderate-comment":
        result = governance_agent.moderate_comment(
            comment_text=payload.get("comment_text", ""),
            user_id=payload.get("user_id", "anonymous")
        )
        return {"success": True, "data": result}
    return None


if HAS_FASTAPI:
    app = FastAPI(
        title="Platform-X AI Orchestrator",
        description="Microservice orchestrator for AI agents and modular skills",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Request Models ---
    class IngestMetadataRequest(BaseModel):
        raw_text: Optional[str] = Field(None, description="Synopsis or description text")
        url: Optional[str] = Field(None, description="URL to scrape metadata from")

    class DetectIntroOutroRequest(BaseModel):
        video_path: str = Field(..., description="Path or S3 URL to video file")

    class AutoSubtitleSyncRequest(BaseModel):
        audio_url: str = Field(..., description="URL to extracted Japanese audio")
        target_lang: str = Field("es", description="Target language (es, en, etc.)")

    class SemanticSearchRequest(BaseModel):
        query: str = Field(..., description="Emotional or thematic user query")
        top_k: int = Field(5, ge=1, le=50)

    class ContentModerationRequest(BaseModel):
        comment_text: str = Field(..., description="User comment to moderate")

    class ContentProcessingAgentRequest(BaseModel):
        anime_id: str = Field(..., description="Target Anime UUID")
        episode_number: int = Field(..., ge=1)
        video_url: str = Field(..., description="S3 or local video path")
        raw_synopsis: Optional[str] = Field("", description="Raw synopsis / text")
        audio_url: Optional[str] = Field(None, description="Audio track URL if separated")

    class OtakuCopilotRequest(BaseModel):
        query: str = Field(..., description="Conversational query or emotional description")
        user_history: Optional[List[Dict[str, Any]]] = Field(None, description="Recent user watch history")

    class ModerateCommentRequest(BaseModel):
        comment_text: str = Field(..., description="Raw comment submitted by user")
        user_id: Optional[str] = Field("anonymous", description="User ID of author")

    # --- Endpoints ---
    @app.get("/health")
    def health():
        return get_health_payload()

    # Modular Skills Endpoints
    @app.post("/skills/ingest-metadata")
    def run_ingest_metadata(req: IngestMetadataRequest):
        return skills["ingest-metadata"].execute(req.model_dump())

    @app.post("/skills/detect-intro-outro")
    def run_detect_intro_outro(req: DetectIntroOutroRequest):
        return skills["detect-intro-outro"].execute(req.model_dump())

    @app.post("/skills/auto-subtitle-sync")
    def run_auto_subtitle_sync(req: AutoSubtitleSyncRequest):
        return skills["auto-subtitle-sync"].execute(req.model_dump())

    @app.post("/skills/semantic-search")
    def run_semantic_search(req: SemanticSearchRequest):
        return skills["semantic-search"].execute(req.model_dump())

    @app.post("/skills/content-moderation")
    def run_content_moderation(req: ContentModerationRequest):
        return skills["content-moderation"].execute(req.model_dump())

    # Intelligent Agents Endpoints (Fases 2 y 3)
    @app.post("/agents/process-content")
    def trigger_content_processing(req: ContentProcessingAgentRequest):
        """Content Processing Agent: Ingestion, Intro/Outro timestamps & Metadata"""
        result = content_agent.process_upload(req.model_dump())
        return {"success": True, "agent": "ContentProcessingAgent", "data": result}

    @app.post("/agents/otaku-copilot")
    def trigger_otaku_copilot(req: OtakuCopilotRequest):
        """Otaku Copilot: Conversational assistant with semantic vector recommendations"""
        result = otaku_copilot_agent.chat(user_query=req.query, user_history=req.user_history)
        return {"success": True, "data": result}

    @app.post("/agents/moderate-comment")
    def trigger_moderate_comment(req: ModerateCommentRequest):
        """Community Governance Agent: Real-time comment moderation and spoiler tagging"""
        result = governance_agent.moderate_comment(comment_text=req.comment_text, user_id=req.user_id)
        return {"success": True, "data": result}


class FallbackHTTPHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: Dict[str, Any]):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, get_health_payload())
        else:
            self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        res = dispatch_post(self.path, payload)
        if res is not None:
            self._send_json(200, res)
        else:
            self._send_json(404, {"error": f"Endpoint {self.path} not found"})


if __name__ == "__main__":
    try:
        if not HAS_FASTAPI:
            raise ImportError("FastAPI not installed")
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        port = int(os.getenv("PORT", "8000"))
        print(f"[Platform-X AI Orchestrator] Running on http://localhost:{port} (Standard HTTP mode)")
        server = HTTPServer(("0.0.0.0", port), FallbackHTTPHandler)
        server.serve_forever()
