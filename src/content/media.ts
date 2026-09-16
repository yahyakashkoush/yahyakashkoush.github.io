/**
 * The single source of truth for media. No component picks an asset itself.
 *
 * Two namespaces that must never mix:
 *
 *   projectMedia   /media/work/**      real product evidence. Screenshots only.
 *   cinematic      /media/video/**     the prepared narrative footage, plus
 *                  /media/portrait/**  its poster frames.
 *
 * Personal photography is never used as project evidence, and a project never
 * borrows another project's assets. A project with no screenshots has
 * `preview: null` and an empty gallery, and the UI renders type instead of
 * reaching for a stand-in image.
 *
 * Every width/height below was read from the file header by
 * `node scripts/audit-media.mjs`, not estimated. They differ per file, which is
 * why they are recorded individually: the screenshots are low resolution and
 * must never be rendered above their intrinsic width.
 */

/* Projects ---------------------------------------------------------------- */

export type ProjectShot = {
  src: string;
  /** Intrinsic pixel size. Rendering must never exceed `width`. */
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Drives the rendering strategy: phone shots get a narrower plate. */
  kind: "desktop" | "mobile";
  /** Surfaced in the audit; the asset is still used as-is. */
  needsCleanExport?: boolean;
};

export type ProjectMedia = {
  /** Hover/preview art. `null` means this project has no real visual evidence. */
  preview: ProjectShot | null;
  gallery: ProjectShot[];
};

const wkeyoneShots = {
  landing: {
    src: "/media/work/wkeyone/landing.png",
    width: 929,
    height: 639,
    alt: "WKEYONE marketing site, Arabic right-to-left, with a revenue chart and a live WhatsApp conversation",
    caption: "Marketing site",
    kind: "desktop",
  },
  dashboard: {
    src: "/media/work/wkeyone/dashboard.png",
    width: 1361,
    height: 645,
    alt: "WKEYONE control panel showing WhatsApp connection status and a six-step activation checklist",
    caption: "Control panel and activation",
    kind: "desktop",
  },
  assistant: {
    src: "/media/work/wkeyone/assistant.png",
    width: 1364,
    height: 646,
    alt: "WKEYONE automated replies screen, configuring the assistant persona and welcome message",
    caption: "Assistant configuration",
    kind: "desktop",
  },
} satisfies Record<string, ProjectShot>;

const laiShots = {
  chat: {
    src: "/media/work/lai/chat.png",
    width: 562,
    height: 1108,
    alt: "LAI chat screen on iPhone with the Gemini provider active and a token counter",
    caption: "Conversation, Gemini active",
    kind: "mobile",
    needsCleanExport: true,
  },
  modelSettings: {
    src: "/media/work/lai/model-settings.png",
    width: 614,
    height: 1128,
    alt: "LAI settings sheet offering gemini, mistral and openRouter as the AI model, plus a dark mode toggle",
    caption: "Provider switching",
    kind: "mobile",
    needsCleanExport: true,
  },
  conversations: {
    src: "/media/work/lai/conversations.png",
    width: 584,
    height: 1138,
    alt: "LAI conversations list with four saved chats and refresh, clear and new actions",
    caption: "Conversation history",
    kind: "mobile",
    needsCleanExport: true,
  },
} satisfies Record<string, ProjectShot>;

export const projectMedia: Record<string, ProjectMedia> = {
  // Preview is the provider-switching sheet: it states the project's whole
  // premise (one interface, several AI providers) in a single frame.
  lai: {
    preview: laiShots.modelSettings,
    gallery: [laiShots.chat, laiShots.modelSettings, laiShots.conversations],
  },
  // Preview is the marketing site: the most recognisable WKEYONE frame, and the
  // only one that still reads at thumbnail size.
  wkeyone: {
    preview: wkeyoneShots.landing,
    gallery: [wkeyoneShots.landing, wkeyoneShots.dashboard, wkeyoneShots.assistant],
  },

  // No screenshots exist for these three. Nothing is substituted: the index
  // renders a typographic preview and the case study is typography-led.
  headshot: { preview: null, gallery: [] },
  "keyone-data": { preview: null, gallery: [] },
  ykchat: { preview: null, gallery: [] },
};

export const getProjectMedia = (slug: string): ProjectMedia =>
  projectMedia[slug] ?? { preview: null, gallery: [] };

/* Cinematic --------------------------------------------------------------- */

export type Clip = {
  src: string;
  /** Still from the same shoot, shown until the clip has frames to paint. */
  poster: string;
  posterAlt: string;
  width: number;
  height: number;
  duration: number;
  /** What is actually on screen, confirmed by stepping through the footage. */
  content: string;
};

/**
 * Placement is driven by what each clip does on screen, not by its filename.
 * Frames were inspected at 20% and 85% of each clip's duration.
 */
export const cinematic = {
  /** Abstract travel through a red lattice. No subject: it reads as a cut. */
  chapterWork: {
    src: "/media/video/ai-transition.mp4",
    poster: "/media/portrait/abstract-system.jpg",
    posterAlt: "Abstract red wireframe architecture suspended in darkness",
    width: 1920,
    height: 1080,
    duration: 8,
    content: "Abstract red lattice and slabs, camera travelling forward. No subject.",
  },
} satisfies Record<string, Clip>;

/**
 * The "Human first. Technology second." cut, by request a still
 * (`CinematicStill`) rather than a `CinematicCut` — same set as
 * human-system.mp4 below, shot as its own vertical personal photo rather than
 * a video frame, so it isn't a `Clip` (no src/duration to play).
 */
export const humanSystemStill = {
  poster: "/media/portrait/human-system.jpg",
  posterAlt: "Figure standing on a red grid among dark monoliths",
} satisfies { poster: string; posterAlt: string };

/**
 * Held back on purpose, so the audit has no unexplained orphans.
 *
 * The hero and About both use stills by request, which freed hero.mp4 and
 * close-up.mp4. Both are still strong footage; they are parked here rather than
 * forced into a third and fourth full-bleed cut, which would turn the page into
 * section/video/section/video. Promoting any of these is a one-line change.
 */
export const unusedClips = [
  {
    src: "/media/video/hero.mp4",
    reason: "Freed when the hero moved to a still. Push-in on the subject; the strongest cut candidate.",
  },
  {
    src: "/media/video/close-up.mp4",
    reason: "Freed when About moved to a still. Push-in to the face; the natural identity cut.",
  },
  {
    src: "/media/video/front-wide.mp4",
    reason: "Same set and action as hero.mp4, and the weaker of the two takes.",
  },
  {
    src: "/media/video/ai-network.mp4",
    reason: "Abstract forward travel, same role as ai-transition.mp4 which reads stronger.",
  },
  {
    src: "/media/video/human-system.mp4",
    reason: "Freed when this cut moved to a still by request, matching hero and About. Wide among monoliths, landing on the subject in profile.",
  },
  {
    src: "/media/video/cinematic-02.mp4",
    reason: "720p, and covers the same beat as human-system.mp4 at lower resolution.",
  },
] as const;
