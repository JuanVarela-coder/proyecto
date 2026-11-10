# Platform-X Anime - Catálogo de Skills Modulares de IA

Este paquete contiene la implementación modular de las 5 **Skills de Inteligencia Artificial** para la plataforma **Platform-X Anime (IA & Streaming)**.

## 📦 Estructura del Proyecto

```
platform-x-ai-skills/
├── README.md
├── requirements.txt
├── base_skill.py
├── config.json
├── skills/
│   ├── ingest_metadata/       # Extractor y estandarizador de metadatos (Input: Texto/URL -> Output: JSON)
│   ├── detect_intro_outro/    # Analizador de audio/video para Openings/Endings (Input: Video -> Output: Timestamps)
│   ├── auto_subtitle_sync/    # Transcriptor y generador de subtítulos WebVTT (Input: Audio -> Output: .vtt)
│   ├── semantic_search/       # Búsqueda semántica con embeddings (Input: Query -> Output: List[IDs])
│   └── content_moderation/    # Moderador de comentarios y spoilers (Input: Texto -> Output: Estado/Tagged)
└── examples/
    └── run_all_skills_demo.py # Script de prueba y demostración del orquestador
```

## 🛠️ Skills Incluidas

| Skill Name | Categoría | Input | Output | Agente Consumidor |
|---|---|---|---|---|
| `skill-ingest-metadata` | Ingesta | Texto / URL de sinopsis | JSON (Título, Géneros, Año, Cast) | Content Curator Agent |
| `skill-detect-intro-outro` | Audio/Video | Archivo MP4 / HLS (.m3u8) | `{ "intro_start_sec": int, "intro_end_sec": int }` | Content Curator Agent |
| `skill-auto-subtitle-sync` | Procesamiento | Audio (JP) + Idioma destino | Archivo WebVTT (`.vtt`) sincronizado | Content Curator Agent |
| `skill-semantic-search` | Búsqueda | Query en lenguaje natural | Lista ordenada de `anime_id` relevantes | Otaku Copilot Agent |
| `skill-content-moderation` | Comunidad | Texto del comentario | `{ "status": "approved"|"blocked"|"tagged_spoiler", "cleaned_text": str }` | Community Governance Agent |

## 🚀 Uso Rápido

1. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecutar la demo del orquestador de skills:
   ```bash
   python examples/run_all_skills_demo.py
   ```
