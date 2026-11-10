from typing import Dict, Any, List
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from base_skill import BaseSkill

class SemanticSearchSkill(BaseSkill):
    def __init__(self, config_path: str = None):
        cfg = config_path or os.path.join(os.path.dirname(__file__), "config.json")
        super().__init__("skill-semantic-search", cfg)

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input: {"query": str, "top_k": int}
        Output: {"results": List[Dict]}
        """
        query = payload.get("query", "")
        top_k = payload.get("top_k", 3)
        
        database = [
            {"anime_id": "a1b2c3d4-0001", "title": "Steins;Gate", "match_score": 0.94, "reason": "Viajes en el tiempo, comedia y drama"},
            {"anime_id": "a1b2c3d4-0002", "title": "Re:Zero", "match_score": 0.88, "reason": "Bucle temporal y fantasía oscura"},
            {"anime_id": "a1b2c3d4-0003", "title": "Erased (Boku dake ga Inai Machi)", "match_score": 0.85, "reason": "Viaje en el tiempo y suspenso"}
        ]
        
        return {
            "status": "success",
            "skill": self.skill_name,
            "query": query,
            "data": {
                "matches": database[:top_k]
            }
        }
