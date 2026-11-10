"""
Base class interface for all Platform-X AI Skills.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict
import json
import os

class BaseSkill(ABC):
    def __init__(self, skill_name: str, config_path: str = None):
        self.skill_name = skill_name
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        if config_path and os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the skill with structured input payload and returns structured output.
        """
        pass
