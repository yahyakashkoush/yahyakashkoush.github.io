/**
 * The single source of truth for media. No component picks an asset itself.
 *
 * projectMedia contains real product evidence: screenshots only.
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

