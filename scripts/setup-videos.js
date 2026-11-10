const fs = require("fs");
const path = require("path");

const trailersDir = path.join(__dirname, "..", "apps", "web", "public", "videos", "trailers");
const episodesDir = path.join(__dirname, "..", "apps", "web", "public", "videos", "episodes");

fs.mkdirSync(trailersDir, { recursive: true });
fs.mkdirSync(episodesDir, { recursive: true });

const baseMp4 = "C:\\Windows\\SystemApps\\Microsoft.Windows.CloudExperienceHost_cw5n1h2txyewy\\media\\oobe-intro.mp4";
const baseWebms = [
  "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CoreAI_cw5n1h2txyewy\\DiscoveryOverlay\\Assets\\FirstRunExperience\\FirstRunExperiencePage1_DARK.webm",
  "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CoreAI_cw5n1h2txyewy\\DiscoveryOverlay\\Assets\\FirstRunExperience\\FirstRunExperiencePage2_DARK.webm",
  "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CoreAI_cw5n1h2txyewy\\DiscoveryOverlay\\Assets\\FirstRunExperience\\FirstRunExperiencePage3_DARK.webm",
  "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CoreAI_cw5n1h2txyewy\\DiscoveryOverlay\\Assets\\FirstRunExperience\\FREEdgeGestureAnimation_DARK.webm",
  "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CoreAI_cw5n1h2txyewy\\DiscoveryOverlay\\Assets\\TutorialMode\\TutorialModeUseAnytime_DARK.webm",
];

const trailerSlugs = [
  "dandadan-trailer",
  "solo-leveling-s2-trailer",
  "dragon-ball-daima-trailer",
  "blue-lock-s2-trailer",
  "one-piece-egghead-trailer",
  "steins-gate-trailer",
  "frieren-trailer",
  "fma-brotherhood-trailer",
  "attack-on-titan-trailer",
  "death-note-trailer",
  "demon-slayer-trailer",
  "one-punch-man-trailer",
  "violet-evergarden-trailer",
  "jujutsu-kaisen-trailer",
  "hunter-x-hunter-trailer",
];

const episodeSlugs = [
  "dandadan-ep1-preview",
  "dandadan-ep2-preview",
  "sololeveling-ep1-preview",
  "sololeveling-ep2-preview",
  "daima-ep1-preview",
  "daima-ep2-preview",
  "bluelock-ep1-preview",
  "bluelock-ep2-preview",
  "onepiece-ep1-preview",
  "onepiece-ep2-preview",
  "steinsgate-ep1-preview",
  "steinsgate-ep2-preview",
  "frieren-ep1-preview",
  "frieren-ep2-preview",
  "fma-ep1-preview",
  "fma-ep2-preview",
  "aot-ep1-preview",
  "aot-ep2-preview",
  "dn-ep1-preview",
  "dn-ep2-preview",
  "ds-ep1-preview",
  "ds-ep2-preview",
  "opm-ep1-preview",
  "opm-ep2-preview",
  "ve-ep1-preview",
  "ve-ep2-preview",
  "jjk-ep1-preview",
  "jjk-ep2-preview",
  "hxh-ep1-preview",
  "hxh-ep2-preview",
];

for (let i = 0; i < trailerSlugs.length; i++) {
  const destMp4 = path.join(trailersDir, `${trailerSlugs[i]}.mp4`);
  const destWebm = path.join(trailersDir, `${trailerSlugs[i]}.webm`);
  fs.copyFileSync(baseMp4, destMp4);
  fs.copyFileSync(baseWebms[i % baseWebms.length], destWebm);
}

for (let i = 0; i < episodeSlugs.length; i++) {
  const destMp4 = path.join(episodesDir, `${episodeSlugs[i]}.mp4`);
  const destWebm = path.join(episodesDir, `${episodeSlugs[i]}.webm`);
  fs.copyFileSync(baseMp4, destMp4);
  fs.copyFileSync(baseWebms[i % baseWebms.length], destWebm);
}

console.log(`Generated ${trailerSlugs.length} trailer videos and ${episodeSlugs.length} episode preview videos.`);
