# Yahya Kashkoush - portfolio

Cinematic dark portfolio for an applied AI and automation engineer.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Motion · a few shadcn/ui primitives.

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Structure

```
_source/                   original shoot assets and cv.txt, untouched
scripts/organize-assets.mjs copies _source into public/media under web-safe names
public/media/portrait/     9 stills, 3:4
public/media/video/        7 clips, 16:9
public/media/work/         project screenshots
src/content/               all copy and facts, typed. Single source of truth.
src/components/ui/         shadcn primitives, restyled to the tokens below
src/components/            custom components
src/app/                   / and /work/[slug]
```

Re-run the asset copy after changing anything in `_source`:

```bash
node scripts/organize-assets.mjs
```

## Content

Every fact on the site comes from `_source/cv.txt` or a project's own
`details.txt`. Nothing is invented. Case studies render only the sections their
source material supports, which is why some have no gallery, no challenge and
no outcome section. Keep it that way: add a section to `src/content/projects.ts`
only when there is real material for it.

Identity and contact details live in `src/content/site.ts`.

## Design system

Defined once in `src/app/globals.css`.

**Colour.** Near-blacks and the accent red are sampled from the photography,
not generated. `--bg #050505` · `--bg-2 #0a0a0b` · `--bg-3 #111113` ·
`--fg #f2f2f0` · `--fg-2 #a3a3a0` · `--fg-3 #6b6b69` · `--red #d91f26` ·
`--red-hi #ff3b30`. Hairlines are white at 8% and 14%.

Red marks state. It is never decoration, and it stays under roughly 5% of
pixels on any screen.

**Type.** Archivo for everything, JetBrains Mono for metadata, labels and
navigation. The scale is the `.t-*` classes: `t-display`, `t-hero`,
`t-section`, `t-sub`, `t-body`, `t-caption`, `t-meta`, `t-label`, `t-nav`.

**Shape.** Radius 0 everywhere. `globals.css` enforces this with a
`[class*="rounded"]` override so a primitive cannot reintroduce a corner.

**Motion.** 200ms standard, 300ms hover, 700ms reveal with a 60ms stagger, on
`cubic-bezier(0.16, 1, 0.3, 1)`. Everything collapses under
`prefers-reduced-motion`.

### Two traps worth knowing

1. **Tailwind v4 orders `utilities` after `components`,** so a `text-sm` inside
   a shadcn primitive silently beats a `.t-*` class passed from the call site.
   The primitives in `src/components/ui/` have had their font-size and weight
   utilities stripped for this reason. Do not put them back; let callers own
   typography.
2. **The theme is dark-locked.** `dark` is fixed on `<html>` and there is no
   toggle. Sections must not invert.

## Media architecture

`src/content/media.ts` is the single source of truth. No component picks an
asset. Two namespaces that must never mix:

| namespace | path | contents |
|---|---|---|
| `projectMedia` | `/media/work/**` | product evidence. Screenshots only. |
| `cinematic` | `/media/video/**`, `/media/portrait/**` | the prepared footage and its poster stills |

Rules this enforces:

- **A project only ever shows its own screenshots.** Personal photography is
  never project evidence, and no project borrows another's assets.
- **A project with no screenshots shows none.** `preview: null` and an empty
  gallery. The work index renders a typographic preview, and the case study is
  typography-led. Nothing is substituted.
- Every width/height is the real intrinsic size, read from the file header by
  `node scripts/audit-media.mjs`. They differ per file. Do not reuse one
  file's dimensions for another, which is what previously made the galleries
  soft and mis-framed.

`node scripts/asset-usage.mjs` prints where every asset is used, lists
orphans, and fails loudly if `projectMedia` ever references a photo or a video.

### Screenshots vs photography

They render differently on purpose.

- **Screenshots** are evidence: `object-contain`, own aspect ratio, whole frame,
  and `maxWidth` pinned to the intrinsic width so they are never upscaled (these
  captures top out at 1364px). No cover-cropping, no cinematic overlay, no red
  wash, nothing that would eat the small UI text.
- **Photography and footage** are art: `object-cover`, cinematic cropping and
  scrims are fine.

### Where the footage goes

Placement follows what each clip does on screen, confirmed by stepping through
frames, not by filename.

```
Hero            hero.mp4          push-in on the subject      autoplay
Selected Work
[ cut ]         ai-transition.mp4 abstract travel, no subject
About           close-up.mp4      push-in to the face
Experience
Capabilities
[ cut ]         human-system.mp4  wide, resolving to a profile
Contact
```

Two cuts, not one per section: more would turn the page back into
section/video/section/video. There is no "reel" gallery; the clips are
narrative beats, not a showreel.

Three clips are held back deliberately and listed in `unusedClips` with the
reason, so the audit has no unexplained orphans: `front-wide.mp4` (same set and
action as the hero take), `ai-network.mp4` (same job as `ai-transition.mp4`),
`cinematic-02.mp4` (720p, same beat as `human-system.mp4`). Swapping any of
them in is a one-line change.

### Loading

- The hero video mounts only above 768px. Phones get the 3:4 still and download
  no video at all: a cold mobile load transfers **zero** video bytes.
- Every other clip is `preload="none"` behind its poster. On first intersection
  it promotes to `preload="auto"`, calls `load()` explicitly, then plays, and
  pauses again on the way out. The explicit `load()` matters because if `play()`
  is rejected (backgrounded tab, blocked autoplay) a `preload="none"` element
  would otherwise never fetch its source at all.
- The poster sits **underneath** the video and stays visible; the video fades in
  over it only while actually playing. A `<video>` with no decoded frames paints
  an opaque black box in Chromium, so a one-way "has played once" flag would
  leave a black rectangle whenever the decoder is released.
- A cold desktop load transfers one video. The rest stay at zero bytes.

### Known debt: video weight

`public/media/video` is about 25MB because the clips are straight out of the
generator. Nothing here has been transcoded. To cut it to roughly 4MB:

```bash
for f in public/media/video/*.mp4; do
  ffmpeg -i "$f" -an -vf "scale='min(1600,iw)':-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart "${f%.mp4}-opt.mp4"
done
```

A WebM sibling is worth adding at the same time:

```bash
for f in public/media/video/*.mp4; do
  ffmpeg -i "$f" -an -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 "${f%.mp4}.webm"
done
```

Then swap the `<video src>` for `<source>` children, WebM first.

## Outstanding

- **LAI screenshots carry a `mostaql.com` watermark.** Flagged in the registry as
  `needsCleanExport: true` and surfaced as a caption on the case study. Shown
  unmodified: cropping the mark would cut into the device. Replace with clean
  exports when available.
- Four portrait stills are currently unused: `ai-network.jpg`,
  `front-medium.jpg`, `portrait-34.jpg`, `side.jpg`.
- No GitHub profile URL exists in the CV, so none is linked.
- The contact form composes a mail draft via `mailto`; there is no backend.
