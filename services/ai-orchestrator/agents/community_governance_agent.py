"""
Community Governance Agent for Platform-X Anime.
Real-time comments moderation:
1. Detects toxic/offensive speech (Action: blocked).
2. Detects unmarked spoilers and wraps them in <spoiler> tags (Action: tagged_spoiler).
3. Approves clean comments (Action: approved).
"""

from typing import Dict, Any, Optional
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from skills.content_moderation.skill import ContentModerationSkill

class CommunityGovernanceAgent:
    def __init__(self):
        self.moderation_skill = ContentModerationSkill()

    def moderate_comment(self, comment_text: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates and sanitizes comments:
        Input:
            comment_text: Content submitted by user
            user_id: ID of author
        Output:
            {
                "status": "approved" | "blocked" | "tagged_spoiler",
                "processed_text": str,
                "reason": Optional[str],
                "badge": str
            }
        """
        result = self.moderation_skill.execute({
            "comment_text": comment_text,
            "user_id": user_id or "anonymous"
        })

        data = result.get("data", {})
        action = data.get("action", "approved")
        processed_text = data.get("processed_text", comment_text)
        reason = data.get("reason", "")

        badges = {
            "approved": "Limpio",
            "tagged_spoiler": "Spoiler Oculto ⚠️",
            "blocked": "Bloqueado 🚫"
        }

        return {
            "agent": "CommunityGovernanceAgent",
            "status": action,
            "processed_text": processed_text,
            "badge": badges.get(action, "Revisión"),
            "reason": reason or ("Spoiler etiquetado automáticamente" if action == "tagged_spoiler" else "Comentario aprobado")
        }
