import json
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from skills.ingest_metadata.skill import IngestMetadataSkill
from skills.detect_intro_outro.skill import DetectIntroOutroSkill
from skills.auto_subtitle_sync.skill import AutoSubtitleSyncSkill
from skills.semantic_search.skill import SemanticSearchSkill
from skills.content_moderation.skill import ContentModerationSkill

def run_orchestrator_demo():
    print("============================================================")
    print("🤖 Platform-X AI Skills Orchestrator Demo")
    print("============================================================")

    s1 = IngestMetadataSkill()
    res1 = s1.execute({"raw_text": "Steins;Gate es un anime sobre un cientifico loco."})
    print("\n[1] Skill Ingest Metadata Output:")
    print(json.dumps(res1, indent=2, ensure_ascii=False))

    s2 = DetectIntroOutroSkill()
    res2 = s2.execute({"video_path": "/s3/bucket/animes/steins_gate_ep01.mp4"})
    print("\n[2] Skill Detect Intro/Outro Output:")
    print(json.dumps(res2, indent=2, ensure_ascii=False))

    s3 = AutoSubtitleSyncSkill()
    res3 = s3.execute({"audio_url": "/s3/bucket/audio/ep01.wav", "target_lang": "es"})
    print("\n[3] Skill Auto Subtitle Sync Output:")
    print(json.dumps(res3, indent=2, ensure_ascii=False))

    s4 = SemanticSearchSkill()
    res4 = s4.execute({"query": "Quiero un anime corto de viajes en el tiempo pero con comedia", "top_k": 2})
    print("\n[4] Skill Semantic Search Output:")
    print(json.dumps(res4, indent=2, ensure_ascii=False))

    s5 = ContentModerationSkill()
    res5 = s5.execute({"comment_text": "No puedo creer que el protagonista muere al final del episodio!!"})
    print("\n[5] Skill Content Moderation Output:")
    print(json.dumps(res5, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    run_orchestrator_demo()
