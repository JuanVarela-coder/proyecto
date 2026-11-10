import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Default real-world PostgreSQL pool
const realPool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  user: process.env.POSTGRES_USER || "platformx",
  password: process.env.POSTGRES_PASSWORD || "platformx_secret_pass",
  database: process.env.POSTGRES_DB || "platformx_anime",
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1500,
});

realPool.on("error", (err) => {
  // Graceful log without crashing process
  console.warn("[PostgreSQL Warning]", err.message);
});

const memoryAnimes = [
  { id: "airing-01", title: "Dandadan", synopsis: "Una chica creyente en fantasmas y un chico creyente en extraterrestres se involucran en lo paranormal juntos.", genres: ["Acción", "Comedia", "Sobrenatural", "Romance"], release_year: 2024, cover_image_url: "/covers/dandadan.jpg", trailer_url: "/videos/trailers/dandadan-trailer.mp4", trailer_youtube_id: "0XJxfbN36Uw", official_source: "Crunchyroll / MBS / Science SARU Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "airing-02", title: "Solo Leveling Season 2", synopsis: "Sung Jin-Woo continúa su ascenso como el cazador más poderoso de la historia, enfrentando amenazas aún mayores.", genres: ["Acción", "Aventura", "Fantasía"], release_year: 2025, cover_image_url: "/covers/solo-leveling-s2.jpg", trailer_url: "/videos/trailers/solo-leveling-s2-trailer.mp4", trailer_youtube_id: "4P79C81z6Cg", official_source: "Aniplex / Crunchyroll / A-1 Pictures Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "airing-03", title: "Dragon Ball Daima", synopsis: "Goku y sus amigos son convertidos en niños por la magia de un villano y deben aventurarse al mundo de los Demonios.", genres: ["Acción", "Aventura", "Comedia", "Artes marciales"], release_year: 2024, cover_image_url: "/covers/dragon-ball-daima.jpg", trailer_url: "/videos/trailers/dragon-ball-daima-trailer.mp4", trailer_youtube_id: "0wMBz2xdI_s", official_source: "Toei Animation / Dragon Ball Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "airing-04", title: "Blue Lock Season 2", synopsis: "Isagi y los delanteros de Blue Lock compiten en el partido definitivo contra la Selección Sub-20 de Japón.", genres: ["Deportes", "Drama", "Psicológico"], release_year: 2024, cover_image_url: "/covers/blue-lock-s2.jpg", trailer_url: "/videos/trailers/blue-lock-s2-trailer.mp4", trailer_youtube_id: "g9gB5OCtIT4", official_source: "Bandai Namco Filmworks / EMOTION Label Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "upcoming-01", title: "One Piece - Egghead Arc (2025)", synopsis: "Luffy y su tripulación llegan a la Isla del Futuro del Dr. Vegapunk, con secretos que cambiarán el mundo.", genres: ["Acción", "Aventura", "Comedia", "Fantasía"], release_year: 2025, cover_image_url: "/covers/one-piece.jpg", trailer_url: "/videos/trailers/one-piece-egghead-trailer.mp4", trailer_youtube_id: "V_u5JNg_V70", official_source: "ONE PIECE Official YouTube Channel / Toei Animation", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", title: "Steins;Gate", synopsis: "Un grupo de amigos en Akihabara descubre cómo enviar mensajes de texto al pasado usando un microondas modificado.", genres: ["Ciencia Ficción", "Suspenso", "Psicológico", "Viajes en el tiempo"], release_year: 2011, cover_image_url: "/covers/steins-gate.svg", trailer_url: "/videos/trailers/steins-gate-trailer.mp4", trailer_youtube_id: "uMYhjVwp0Fk", official_source: "Kadokawa / White Fox / Crunchyroll Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", title: "Frieren: Beyond Journey's End", synopsis: "La elfa maga Frieren emprende un viaje para comprender a la humanidad tras la muerte del héroe Himmel.", genres: ["Fantasía", "Aventura", "Drama", "Recuentos de la vida"], release_year: 2023, cover_image_url: "/covers/frieren.jpg", trailer_url: "/videos/trailers/frieren-trailer.mp4", trailer_youtube_id: "vrMTnVo_Lf4", official_source: "TOHO animation / Madhouse Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "fma-id", title: "Fullmetal Alchemist: Brotherhood", synopsis: "Dos hermanos alquimistas sacrifican lo más preciado para revivir a su madre.", genres: ["Acción", "Aventura", "Fantasía", "Drama", "Militar"], release_year: 2009, cover_image_url: "/covers/fma-brotherhood.jpg", trailer_url: "/videos/trailers/fma-brotherhood-trailer.mp4", trailer_youtube_id: "22tIu2gJ_bI", official_source: "Aniplex / Bones Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "aot-id", title: "Attack on Titan", synopsis: "La humanidad sobrevive dentro de muros enormes que los protegen de los titanes.", genres: ["Acción", "Drama", "Terror", "Militar", "Sobrenatural"], release_year: 2013, cover_image_url: "/covers/attack-on-titan.jpg", trailer_url: "/videos/trailers/attack-on-titan-trailer.mp4", trailer_youtube_id: "MGRm4IzK1SQ", official_source: "Pony Canyon / Wit Studio / Crunchyroll Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "dn-id", title: "Death Note", synopsis: "Un brillante estudiante encuentra un cuaderno sobrenatural capaz de matar a quien sea escrito en él.", genres: ["Suspenso", "Psicológico", "Sobrenatural", "Thriller"], release_year: 2006, cover_image_url: "/covers/death-note.jpg", trailer_url: "/videos/trailers/death-note-trailer.mp4", trailer_youtube_id: "NlJZ-YgAt-c", official_source: "VAP / Madhouse / Netflix Anime Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ds-id", title: "Demon Slayer", synopsis: "Un joven cuya familia es masacrada por demonios se convierte en cazador para salvar a su hermana.", genres: ["Acción", "Sobrenatural", "Fantasía histórica", "Drama"], release_year: 2019, cover_image_url: "/covers/demon-slayer.jpg", trailer_url: "/videos/trailers/demon-slayer-trailer.mp4", trailer_youtube_id: "VQGCKyvzIM4", official_source: "Aniplex / ufotable Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "opm-id", title: "One Punch Man", synopsis: "Un héroe que puede derrotar a cualquier enemigo de un solo golpe busca el sentido de su existencia.", genres: ["Acción", "Comedia", "Superhéroes", "Parodia", "Sci-Fi"], release_year: 2015, cover_image_url: "/covers/one-punch-man.svg", trailer_url: "/videos/trailers/one-punch-man-trailer.mp4", trailer_youtube_id: "Poo5lqoWSGw", official_source: "Bandai Namco / Madhouse / VIZ Media Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "ve-id", title: "Violet Evergarden", synopsis: "Una ex soldado aprende el verdadero significado de 'te amo' mientras escribe cartas.", genres: ["Drama", "Romance", "Fantasía", "Vida cotidiana"], release_year: 2018, cover_image_url: "/covers/violet-evergarden.jpg", trailer_url: "/videos/trailers/violet-evergarden-trailer.mp4", trailer_youtube_id: "0C5F3wI2yF8", official_source: "Kyoto Animation (KyoAni Channel) / Netflix Anime", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "jjk-id", title: "Jujutsu Kaisen", synopsis: "Un estudiante de preparatoria ingiere un dedo maldito y entra al mundo de los hechiceros.", genres: ["Acción", "Sobrenatural", "Escuela", "Horror"], release_year: 2020, cover_image_url: "/covers/jujutsu-kaisen.jpg", trailer_url: "/videos/trailers/jujutsu-kaisen-trailer.mp4", trailer_youtube_id: "4b7Z8d22Odw", official_source: "TOHO animation / MAPPA / Crunchyroll Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "hxh-id", title: "Hunter x Hunter (2011)", synopsis: "Gon Freecss descubre que su padre es un Hunter de élite y decide seguir sus pasos.", genres: ["Acción", "Aventura", "Fantasía", "Shonen"], release_year: 2011, cover_image_url: "/covers/hunter-x-hunter.jpg", trailer_url: "/videos/trailers/hunter-x-hunter-trailer.mp4", trailer_youtube_id: "d6kBeJjTGnY", official_source: "VAP / Madhouse / VIZ Media Official", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const memoryEpisodes = [
  { id: "dandadan-ep1", anime_id: "airing-01", episode_number: 1, title: "Así es como inicia el amor, ¿no?", synopsis: "Momo Ayase y Ken Takakura hacen una apuesta para demostrar si existen los fantasmas o los extraterrestres, enfrentándose a la Turbo Abuela y a los alienígenas Serpo.", video_url: "/videos/episodes/dandadan-ep1-preview.mp4", preview_video_url: "/videos/episodes/dandadan-ep1-preview.webm", youtube_preview_id: "0XJxfbN36Uw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "dandadan-ep2", anime_id: "airing-01", episode_number: 2, title: "Eso es un extraterrestre, ¿verdad?", synopsis: "Momo lleva a Okarun al santuario de su abuela para contener la maldición de la Turbo Abuela, pero un monstruo espacial gigante los acorrala.", video_url: "/videos/episodes/dandadan-ep2-preview.mp4", preview_video_url: "/videos/episodes/dandadan-ep2-preview.webm", youtube_preview_id: "0XJxfbN36Uw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "sololeveling-ep1", anime_id: "airing-02", episode_number: 1, title: "No estás en el rango E, ¿verdad?", synopsis: "Sung Jin-Woo acompaña a Han Song-yi a una incursión del Gremio Tigre Blanco que se transforma en un peligroso Portal Rojo helado.", video_url: "/videos/episodes/sololeveling-ep1-preview.mp4", preview_video_url: "/videos/episodes/sololeveling-ep1-preview.webm", youtube_preview_id: "4P79C81z6Cg", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "sololeveling-ep2", anime_id: "airing-02", episode_number: 2, title: "Supongo que no estás consciente", synopsis: "Atrapados en el Portal Rojo, Jin-Woo protege a los cazadores novatos y despliega a su ejército de sombras contra Baruka y los Elfos de Hielo.", video_url: "/videos/episodes/sololeveling-ep2-preview.mp4", preview_video_url: "/videos/episodes/sololeveling-ep2-preview.webm", youtube_preview_id: "4P79C81z6Cg", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "daima-ep1", anime_id: "airing-03", episode_number: 1, title: "La conspiración", synopsis: "El Rey Gomah del Reino de los Demonios usa las Esferas del Dragón de la Tierra para convertir a Goku y a todos sus amigos en niños.", video_url: "/videos/episodes/daima-ep1-preview.mp4", preview_video_url: "/videos/episodes/daima-ep1-preview.webm", youtube_preview_id: "0wMBz2xdI_s", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 620, outro_end_sec: 653, duration_sec: 653, created_at: new Date().toISOString() },
  { id: "daima-ep2", anime_id: "airing-03", episode_number: 2, title: "Glorio", synopsis: "Goku recupera su Báculo Sagrado y parte hacia el Reino de los Demonios junto al Supremo Kaiosama y el misterioso piloto Glorio.", video_url: "/videos/episodes/daima-ep2-preview.mp4", preview_video_url: "/videos/episodes/daima-ep2-preview.webm", youtube_preview_id: "0wMBz2xdI_s", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "bluelock-ep1", anime_id: "airing-04", episode_number: 1, title: "Prueba de selección", synopsis: "Jinpachi Ego anuncia el partido contra la Selección Sub-20 de Japón y revela al Top 6 que liderará los equipos de prueba.", video_url: "/videos/episodes/bluelock-ep1-preview.mp4", preview_video_url: "/videos/episodes/bluelock-ep1-preview.webm", youtube_preview_id: "g9gB5OCtIT4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 12, outro_end_sec: 15, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "bluelock-ep2", anime_id: "airing-04", episode_number: 2, title: "El asesino y el ninja", synopsis: "Isagi se enfrenta en el primer partido de selección a Karasu y Otoya mientras intenta coexistir y superar a Rin Itoshi y Shidou.", video_url: "/videos/episodes/bluelock-ep2-preview.mp4", preview_video_url: "/videos/episodes/bluelock-ep2-preview.webm", youtube_preview_id: "g9gB5OCtIT4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "onepiece-ep1", anime_id: "upcoming-01", episode_number: 1, title: "¡Un nuevo capítulo! Los caminos de Luffy y Sabo", synopsis: "Mientras el mundo tiembla por las noticias sobre Sabo y Lulusia, los Sombrero de Paja rescatan a Jewelry Bonney cerca de Egghead.", video_url: "/videos/episodes/onepiece-ep1-preview.mp4", preview_video_url: "/videos/episodes/onepiece-ep1-preview.webm", youtube_preview_id: "V_u5JNg_V70", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "onepiece-ep2", anime_id: "upcoming-01", episode_number: 2, title: "¡Una nueva isla! La isla del futuro Egghead", synopsis: "Un tiburón mecánico ataca al Sunny y aparece Lilith, una de las satélites del Dr. Vegapunk, dando inicio a la aventura en Egghead.", video_url: "/videos/episodes/onepiece-ep2-preview.mp4", preview_video_url: "/videos/episodes/onepiece-ep2-preview.webm", youtube_preview_id: "V_u5JNg_V70", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f", anime_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", episode_number: 1, title: "Prólogo del Principio y el Fin", synopsis: "Okabe encuentra apuñalada a Kurisu Makise en Radio Kaikan y al enviar un mensaje de texto a Daru salta accidentalmente a otra línea de universo.", video_url: "/videos/episodes/steinsgate-ep1-preview.mp4", preview_video_url: "/videos/episodes/steinsgate-ep1-preview.webm", youtube_preview_id: "uMYhjVwp0Fk", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9012", anime_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", episode_number: 2, title: "Paranoia Espaciotemporal", synopsis: "Okabe descubre que Kurisu está viva y juntos presencian los experimentos temporales del Teléfono Microondas en el laboratorio.", video_url: "/videos/episodes/steinsgate-ep2-preview.mp4", preview_video_url: "/videos/episodes/steinsgate-ep2-preview.webm", youtube_preview_id: "uMYhjVwp0Fk", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 620, outro_end_sec: 653, duration_sec: 653, created_at: new Date().toISOString() },
  { id: "d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90", anime_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", episode_number: 1, title: "El Fin del Viaje", synopsis: "Cincuenta años después de derrotar al Rey Demonio, Frieren se reúne con un anciano Himmel para ver la lluvia de meteoros antes de su muerte.", video_url: "/videos/episodes/frieren-ep1-preview.mp4", preview_video_url: "/videos/episodes/frieren-ep1-preview.webm", youtube_preview_id: "vrMTnVo_Lf4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "fr-ep2", anime_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", episode_number: 2, title: "No tenía por qué ser magia...", synopsis: "Frieren acepta entrenar a la pequeña huérfana Fern por petición de Heiter y la acompaña hasta que su viejo amigo parte en paz.", video_url: "/videos/episodes/frieren-ep2-preview.mp4", preview_video_url: "/videos/episodes/frieren-ep2-preview.webm", youtube_preview_id: "vrMTnVo_Lf4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "fma-ep1", anime_id: "fma-id", episode_number: 1, title: "El alquimista de acero", synopsis: "Edward y Alphonse Elric combaten en Ciudad Central contra Isaac McDougal, el Alquimista de Hielo, quien intenta destruir el cuartel general.", video_url: "/videos/episodes/fma-ep1-preview.mp4", preview_video_url: "/videos/episodes/fma-ep1-preview.webm", youtube_preview_id: "22tIu2gJ_bI", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "fma-ep2", anime_id: "fma-id", episode_number: 2, title: "El primer día", synopsis: "Se revela el pasado de los hermanos Elric, su fallida transmutación humana para revivir a su madre y el juramento de recuperar sus cuerpos.", video_url: "/videos/episodes/fma-ep2-preview.mp4", preview_video_url: "/videos/episodes/fma-ep2-preview.webm", youtube_preview_id: "22tIu2gJ_bI", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "aot-ep1", anime_id: "aot-id", episode_number: 1, title: "Para ti, dentro de dos mil años", synopsis: "Tras cien años de paz detrás de las murallas, el Titán Colosal aparece frente al distrito Shiganshina y destruye la puerta exterior.", video_url: "/videos/episodes/aot-ep1-preview.mp4", preview_video_url: "/videos/episodes/aot-ep1-preview.webm", youtube_preview_id: "MGRm4IzK1SQ", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "aot-ep2", anime_id: "aot-id", episode_number: 2, title: "Aquel día", synopsis: "Los Titanes invaden Shiganshina, el Titán Acorazado derriba la Muralla María y Eren jura aniquilar a todos los Titanes.", video_url: "/videos/episodes/aot-ep2-preview.mp4", preview_video_url: "/videos/episodes/aot-ep2-preview.webm", youtube_preview_id: "MGRm4IzK1SQ", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "dn-ep1", anime_id: "dn-id", episode_number: 1, title: "Renacimiento", synopsis: "Light Yagami encuentra la Death Note del Shinigami Ryuk y decide purgar el mundo de criminales bajo el nombre de Kira.", video_url: "/videos/episodes/dn-ep1-preview.mp4", preview_video_url: "/videos/episodes/dn-ep1-preview.webm", youtube_preview_id: "NlJZ-YgAt-c", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 620, outro_end_sec: 653, duration_sec: 653, created_at: new Date().toISOString() },
  { id: "dn-ep2", anime_id: "dn-id", episode_number: 2, title: "Confrontación", synopsis: "El detective L tiende una trampa televisiva en vivo en la región de Kanto y descubre que Kira se encuentra en Japón.", video_url: "/videos/episodes/dn-ep2-preview.mp4", preview_video_url: "/videos/episodes/dn-ep2-preview.webm", youtube_preview_id: "NlJZ-YgAt-c", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "ds-ep1", anime_id: "ds-id", episode_number: 1, title: "Crueldad", synopsis: "Tanjiro Kamado encuentra a su familia masacrada y a su hermana Nezuko convertida en demonio, cruzando caminos con Giyu Tomioka.", video_url: "/videos/episodes/ds-ep1-preview.mp4", preview_video_url: "/videos/episodes/ds-ep1-preview.webm", youtube_preview_id: "VQGCKyvzIM4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "ds-ep2", anime_id: "ds-id", episode_number: 2, title: "El instructor Sakonji Urokodaki", synopsis: "Tanjiro viaja con Nezuko hacia el monte Sagiri y supera la prueba de determinación de Sakonji Urokodaki.", video_url: "/videos/episodes/ds-ep2-preview.mp4", preview_video_url: "/videos/episodes/ds-ep2-preview.webm", youtube_preview_id: "VQGCKyvzIM4", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "opm-ep1", anime_id: "opm-id", episode_number: 1, title: "El hombre más fuerte", synopsis: "Saitama derrota a cualquier monstruo de un solo golpe pero sufre una crisis existencial por no encontrar un rival que lo emocione.", video_url: "/videos/episodes/opm-ep1-preview.mp4", preview_video_url: "/videos/episodes/opm-ep1-preview.webm", youtube_preview_id: "Poo5lqoWSGw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "opm-ep2", anime_id: "opm-id", episode_number: 2, title: "El cíborg solitario", synopsis: "El cíborg Genos conoce a Saitama durante el ataque de Mosquito Girl y le pide convertirse en su discípulo.", video_url: "/videos/episodes/opm-ep2-preview.mp4", preview_video_url: "/videos/episodes/opm-ep2-preview.webm", youtube_preview_id: "Poo5lqoWSGw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 620, outro_end_sec: 653, duration_sec: 653, created_at: new Date().toISOString() },
  { id: "ve-ep1", anime_id: "ve-id", episode_number: 1, title: "«Te amo» y las muñecas de memoria automática", synopsis: "Terminada la guerra, Violet Evergarden ingresa a la Compañía Postal CH para entender las últimas palabras del Mayor Gilbert.", video_url: "/videos/episodes/ve-ep1-preview.mp4", preview_video_url: "/videos/episodes/ve-ep1-preview.webm", youtube_preview_id: "0C5F3wI2yF8", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "ve-ep2", anime_id: "ve-id", episode_number: 2, title: "Nunca volverá", synopsis: "Violet inicia su entrenamiento como Muñeca de Memoria Automática, enfrentándose a su dificultad para plasmar sentimientos humanos.", video_url: "/videos/episodes/ve-ep2-preview.mp4", preview_video_url: "/videos/episodes/ve-ep2-preview.webm", youtube_preview_id: "0C5F3wI2yF8", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "jjk-ep1", anime_id: "jjk-id", episode_number: 1, title: "Ryomen Sukuna", synopsis: "Yuji Itadori se traga el dedo maldito de Ryomen Sukuna para salvar a Megumi Fushiguro y a sus amigos de una maldición.", video_url: "/videos/episodes/jjk-ep1-preview.mp4", preview_video_url: "/videos/episodes/jjk-ep1-preview.webm", youtube_preview_id: "4b7Z8d22Odw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 700, outro_end_sec: 734, duration_sec: 734, created_at: new Date().toISOString() },
  { id: "jjk-ep2", anime_id: "jjk-id", episode_number: 2, title: "Por mí mismo", synopsis: "Satoru Gojo lleva a Yuji ante el director Yaga en el Colegio Técnico de Magia Metropolitana de Tokio para decidir su destino.", video_url: "/videos/episodes/jjk-ep2-preview.mp4", preview_video_url: "/videos/episodes/jjk-ep2-preview.webm", youtube_preview_id: "4b7Z8d22Odw", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
  { id: "hxh-ep1", anime_id: "hxh-id", episode_number: 1, title: "Partida × Y × Amigos", synopsis: "Gon Freecss parte de Isla Ballena hacia el Examen de Cazador para encontrar a su padre Ging, conociendo a Kurapika y Leorio.", video_url: "/videos/episodes/hxh-ep1-preview.mp4", preview_video_url: "/videos/episodes/hxh-ep1-preview.webm", youtube_preview_id: "d6kBeJjTGnY", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 560, outro_end_sec: 596, duration_sec: 596, created_at: new Date().toISOString() },
  { id: "hxh-ep2", anime_id: "hxh-id", episode_number: 2, title: "Prueba × De × Los Exámenes", synopsis: "Gon, Kurapika y Leorio enfrentan el acertijo sin respuesta de la anciana y las bestias Kiriko rumbo al lugar del examen.", video_url: "/videos/episodes/hxh-ep2-preview.mp4", preview_video_url: "/videos/episodes/hxh-ep2-preview.webm", youtube_preview_id: "d6kBeJjTGnY", intro_start_sec: 5, intro_end_sec: 25, outro_start_sec: 850, outro_end_sec: 888, duration_sec: 888, created_at: new Date().toISOString() },
];

interface MemoryHistory {
  user_id: string;
  episode_id: string;
  stopped_at_sec: number;
  completed: boolean;
  updated_at: string;
}

const memoryWatchHistory: MemoryHistory[] = [];

let hasLoggedFallback = false;

// Safe query executor with transparent zero-config in-memory fallback
async function executeQuery(text: string, params: any[] = []): Promise<{ rows: any[] }> {
  try {
    const res = await realPool.query(text, params);
    return res;
  } catch (err: any) {
    if (!hasLoggedFallback) {
      console.log("[Platform-X Database] PostgreSQL offline. Using built-in local store (15 animes, 30 episodes with trailers & previews seeded).");
      hasLoggedFallback = true;
    }

    const cleanQuery = text.trim().toLowerCase();

    // 1. List all animes
    if (cleanQuery.includes("from animes") && !cleanQuery.includes("where id =")) {
      return { rows: [...memoryAnimes] };
    }

    // 2. Single anime by id
    if (cleanQuery.includes("from animes") && cleanQuery.includes("where id =")) {
      const animeId = params[0];
      const match = memoryAnimes.filter((a) => a.id === animeId);
      return { rows: match };
    }

    // 3. Episodes by anime_id
    if (cleanQuery.includes("from episodes") && cleanQuery.includes("where anime_id =")) {
      const animeId = params[0];
      const episodes = memoryEpisodes.filter((e) => e.anime_id === animeId);
      return { rows: episodes };
    }

    // 4. Single episode with joined anime_title
    if (cleanQuery.includes("from episodes") && cleanQuery.includes("join animes") && cleanQuery.includes("where e.id =")) {
      const epId = params[0];
      const ep = memoryEpisodes.find((e) => e.id === epId);
      if (!ep) return { rows: [] };
      const anime = memoryAnimes.find((a) => a.id === ep.anime_id);
      return { rows: [{ ...ep, anime_title: anime?.title || "Anime" }] };
    }

    // 5. Watch history insert / upsert
    if (cleanQuery.includes("insert into watch_history")) {
      const [userId, episodeId, stoppedAtSec, completed] = params;
      const existingIdx = memoryWatchHistory.findIndex(
        (w) => w.user_id === userId && w.episode_id === episodeId
      );
      const record: MemoryHistory = {
        user_id: userId,
        episode_id: episodeId,
        stopped_at_sec: Number(stoppedAtSec),
        completed: Boolean(completed),
        updated_at: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        memoryWatchHistory[existingIdx] = record;
      } else {
        memoryWatchHistory.push(record);
      }
      return { rows: [record] };
    }

    // 6. Watch history select by user_id
    if (cleanQuery.includes("from watch_history") && cleanQuery.includes("where wh.user_id =")) {
      const userId = params[0];
      const userHistory = memoryWatchHistory
        .filter((w) => w.user_id === userId)
        .map((wh) => {
          const ep = memoryEpisodes.find((e) => e.id === wh.episode_id);
          const anime = ep ? memoryAnimes.find((a) => a.id === ep.anime_id) : null;
          return {
            ...wh,
            episode_number: ep?.episode_number || 1,
            episode_title: ep?.title || "Episodio",
            duration_sec: ep?.duration_sec || 1400,
            anime_id: anime?.id || "",
            anime_title: anime?.title || "",
            cover_image_url: anime?.cover_image_url || "",
          };
        });
      return { rows: userHistory };
    }

    return { rows: [] };
  }
}

export const pool = {
  query: executeQuery,
  on: realPool.on.bind(realPool),
  end: realPool.end.bind(realPool),
};
