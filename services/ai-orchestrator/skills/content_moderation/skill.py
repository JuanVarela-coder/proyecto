from typing import Dict, Any
import re
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from base_skill import BaseSkill

class ContentModerationSkill(BaseSkill):
    def __init__(self, config_path: str = None):
        cfg = config_path or os.path.join(os.path.dirname(__file__), "config.json")
        super().__init__("skill-content-moderation", cfg)

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input: {"comment_text": str, "user_id": str}
        Output: {"action": "approved" | "blocked" | "tagged_spoiler", "processed_text": str}
        """
        text = payload.get("comment_text", "")
        
        spoiler_keywords = ["muere", "final", "villano es", "traidor", "se muere"]
        profanity = ["insulto_feo", "palabrota"]
        
        action = "approved"
        processed_text = text
        
        for p in profanity:
            if p in text.lower():
                return {
                    "status": "success",
                    "skill": self.skill_name,
                    "data": {
                        "action": "blocked",
                        "reason": "Lenguaje ofensivo detectado",
                        "processed_text": None
                    }
                }
                
        for key in spoiler_keywords:
            if key in text.lower() and "<spoiler>" not in text:
                action = "tagged_spoiler"
                processed_text = f"<spoiler>{text}</spoiler>"
                break
                
        return {
            "status": "success",
            "skill": self.skill_name,
            "data": {
                "action": action,
                "processed_text": processed_text
            }
        }
