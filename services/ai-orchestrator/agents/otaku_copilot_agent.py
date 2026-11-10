"""
Otaku Copilot Agent for Platform-X Anime.
Interactive AI assistant that recommends anime using semantic vector search
and user watch history context.
"""

from typing import Dict, Any, List, Optional
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from skills.semantic_search.skill import SemanticSearchSkill

class OtakuCopilotAgent:
    def __init__(self):
        self.semantic_skill = SemanticSearchSkill()

    def chat(self, user_query: str, user_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Processes conversational recommendation requests:
        Input:
            user_query: Emotional or thematic request (e.g. "anime de viajes en el tiempo con comedia")
            user_history: Optional list of previously watched anime titles/genres
        Output:
            {
                "reply": str,
                "recommendations": List[Dict],
                "confidence": float
            }
        """
        # Execute Semantic Search Skill
        search_result = self.semantic_skill.execute({
            "query": user_query,
            "top_k": 3
        })
        
        matches = search_result.get("data", {}).get("matches", [])

        # Build context-aware conversational response
        if matches:
            top_pick = matches[0]
            recommendations_summary = ", ".join([f"**{m['title']}** ({m['reason']})" for m in matches])
            reply = (
                f"¡Hola! Según lo que buscas (*\"{user_query}\"*), mi principal recomendación es **{top_pick['title']}**. "
                f"Tiene una coincidencia temática del {int(top_pick['match_score'] * 100)}% porque encaja con {top_pick['reason']}.\n\n"
                f"Otras opciones ideales para ti: {recommendations_summary}."
            )
        else:
            reply = "No encontré animes exactos para ese criterio. Prueba describiendo la emoción o temática de otra forma."

        return {
            "agent": "OtakuCopilot",
            "query": user_query,
            "reply": reply,
            "recommendations": matches,
            "confidence": matches[0]["match_score"] if matches else 0.0
        }
