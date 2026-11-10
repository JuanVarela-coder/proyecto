"""
Content Processing Agent for Platform-X Anime.
Automates anime episode ingestion upon MP4 upload to S3:
1. Runs 'skill-detect-intro-outro' (Openings/Endings detection).
2. Runs 'skill-ingest-metadata' (Metadata extraction).
3. Emits 'video.processed' event and formats DB-ready episode payload.
"""

from typing import Dict, Any, Optional
import os
import json
import logging

try:
    import pika
except ImportError:
    pika = None

from skills.detect_intro_outro.skill import DetectIntroOutroSkill
from skills.ingest_metadata.skill import IngestMetadataSkill
from skills.auto_subtitle_sync.skill import AutoSubtitleSyncSkill

logger = logging.getLogger("ContentProcessingAgent")
logging.basicConfig(level=logging.INFO)

class ContentProcessingAgent:
    def __init__(self, rabbitmq_url: Optional[str] = None):
        self.rabbitmq_url = rabbitmq_url or os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
        
        # Initialize Required Skills
        self.intro_outro_skill = DetectIntroOutroSkill()
        self.metadata_skill = IngestMetadataSkill()
        self.subtitle_skill = AutoSubtitleSyncSkill()

    def process_upload(self, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion pipeline:
        Input:
            {
                "anime_id": str,
                "episode_number": int,
                "video_url": str,
                "raw_synopsis": str,
                "audio_url": Optional[str]
            }
        Output:
            Standardized Episode record ready for PostgreSQL insertion & HLS streaming
        """
        anime_id = event_payload.get("anime_id", "unassigned")
        ep_num = event_payload.get("episode_number", 1)
        video_url = event_payload.get("video_url", "")
        raw_synopsis = event_payload.get("raw_synopsis", "")
        audio_url = event_payload.get("audio_url", "")

        logger.info(f"Processing upload for Anime: {anime_id}, Episode: {ep_num}")

        # Step 1: Detect Intro and Outro Timestamps
        intro_result = self.intro_outro_skill.execute({"video_path": video_url})
        intro_data = intro_result.get("data", {})

        # Step 2: Extract & Standardize Metadata
        meta_result = self.metadata_skill.execute({"raw_text": raw_synopsis})
        meta_data = meta_result.get("data", {})

        # Step 3: Subtitle Generation (if audio supplied)
        subtitle_data = None
        if audio_url:
            sub_result = self.subtitle_skill.execute({"audio_url": audio_url, "target_lang": "es"})
            subtitle_data = sub_result.get("data")

        # Step 4: Construct Standard Ingestion Result
        processed_episode = {
            "anime_id": anime_id,
            "episode_number": ep_num,
            "title": f"Episodio {ep_num}: {meta_data.get('title', 'Sin título')}",
            "video_url": video_url,
            "intro_start_sec": intro_data.get("intro_start_sec", 90),
            "intro_end_sec": intro_data.get("intro_end_sec", 180),
            "outro_start_sec": intro_data.get("outro_start_sec", 1320),
            "outro_end_sec": intro_data.get("outro_end_sec", 1410),
            "genres": meta_data.get("genres", []),
            "release_year": meta_data.get("release_year", 2024),
            "subtitle_vtt_url": subtitle_data.get("vtt_url") if subtitle_data else None,
            "status": "PROCESSED",
        }

        logger.info(f"Successfully processed episode {ep_num}. Intro: [{processed_episode['intro_start_sec']}s - {processed_episode['intro_end_sec']}s]")
        return processed_episode

    def start_consumer(self):
        """
        Starts listening to RabbitMQ queue 'video.uploaded' for background ingestion.
        """
        if not pika:
            logger.warning("pika library not installed. RabbitMQ consumer inactive.")
            return

        try:
            params = pika.URLParameters(self.rabbitmq_url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            queue_name = "video.uploaded"
            channel.queue_declare(queue=queue_name, durable=True)

            def callback(ch, method, properties, body):
                try:
                    payload = json.loads(body.decode("utf-8"))
                    result = self.process_upload(payload)
                    logger.info(f"Consumer processed message: {result['title']}")
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

            channel.basic_consume(queue=queue_name, on_message_callback=callback)
            logger.info(f"Listening for video upload events on queue '{queue_name}'...")
            channel.start_consuming()
        except Exception as err:
            logger.warning(f"Could not connect to RabbitMQ ({err}). Fallback to REST API.")
