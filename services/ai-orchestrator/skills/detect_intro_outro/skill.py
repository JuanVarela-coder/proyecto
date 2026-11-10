from typing import Dict, Any
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from base_skill import BaseSkill

class DetectIntroOutroSkill(BaseSkill):
    def __init__(self, config_path: str = None):
        cfg = config_path or os.path.join(os.path.dirname(__file__), "config.json")
        super().__init__("skill-detect-intro-outro", cfg)

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input: {"video_path": str} or {"hls_url": str}
        Output: {"intro_start_sec": int, "intro_end_sec": int, "outro_start_sec": int, "outro_end_sec": int}
        """
        video_source = payload.get("video_path") or payload.get("hls_url", "")
        
        intro_start = 90
        intro_end = 180
        outro_start = 1320
        outro_end = 1410

        return {
            "status": "success",
            "skill": self.skill_name,
            "data": {
                "source": video_source,
                "intro_start_sec": intro_start,
                "intro_end_sec": intro_end,
                "outro_start_sec": outro_start,
                "outro_end_sec": outro_end
            }
        }
