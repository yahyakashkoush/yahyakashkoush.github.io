#!/usr/bin/env bash
# Crops the in-footage CRT screen content out of the four uploaded scenes,
# trims each to its useful beat, and crossfades them into one continuous reel
# for the new HTML/CSS CRT monitor on the homepage. Not part of the app build —
# a one-off derivation, like scripts/derive-envelope.mjs.
#
# Crop rect (175,60,950,590) was measured off the two distinct camera framings
# across the four clips (scenes 1-2 share one framing, 3-4 another) by
# overlaying a coordinate grid on sample frames and reading the screen's inner
# edge in both, then intersecting to a rect safely inside both.
set -euo pipefail

# Source clips aren't in the repo (raw footage, not needed at runtime) — point
# this at wherever they were uploaded. ffmpeg falls back to PATH if a working
# copy isn't found at the hardcoded dev-machine location this was written on.
FFMPEG_FALLBACK="/c/Users/pc/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe"
FFMPEG="${FFMPEG:-$([ -x "$FFMPEG_FALLBACK" ] && echo "$FFMPEG_FALLBACK" || echo ffmpeg)}"
SRC="${1:-/c/Users/pc/Desktop/_root___context___}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/media/video/crt-reel.mp4"

CROP="crop=950:590:175:60"
XF=0.2 # crossfade duration between scenes, seconds

# Per-scene (start, duration) — trimmed to the usable beat of each clip:
# scene 1 keeps its power-on flicker as the sequence's own opening beat;
# scene 2 ends just before it breaks into unreadable white-out static;
# scene 3 is kept almost whole since it resolves into a second beat (an "AI"
# dashboard reveal) that is the clearest visual for "the system organizing
# the work"; scene 4 keeps its opening static as the transition in from 3.
D1=5.5
D2=5.7
D3=6.5
D4=6.0

# Cumulative xfade offsets: offset_n = (sum of preceding trimmed durations) -
# (n * crossfade duration). Hand-computed (no bc on this machine) from
# D1=5.5 D2=5.7 D3=6.5 D4=6.0, XF=0.2 above — update these if those change.
OFF1=5.3
OFF2=11.0
OFF3=17.3

"$FFMPEG" -y \
  -i "$SRC/scene-01-intro.mp4" \
  -i "$SRC/scene-02-manual-work.mp4" \
  -i "$SRC/scene-03-ai-automation.mp4" \
  -i "$SRC/scene-04-automated-future.mp4" \
  -filter_complex "
    [0:v]${CROP},trim=0:${D1},setpts=PTS-STARTPTS[v0];
    [1:v]${CROP},trim=0:${D2},setpts=PTS-STARTPTS[v1];
    [2:v]${CROP},trim=0:${D3},setpts=PTS-STARTPTS[v2];
    [3:v]${CROP},trim=0:${D4},setpts=PTS-STARTPTS[v3];
    [0:a]atrim=0:${D1},asetpts=PTS-STARTPTS[a0];
    [1:a]atrim=0:${D2},asetpts=PTS-STARTPTS[a1];
    [2:a]atrim=0:${D3},asetpts=PTS-STARTPTS[a2];
    [3:a]atrim=0:${D4},asetpts=PTS-STARTPTS[a3];
    [v0][v1]xfade=transition=fade:duration=${XF}:offset=${OFF1}[v01];
    [a0][a1]acrossfade=d=${XF}[a01];
    [v01][v2]xfade=transition=fade:duration=${XF}:offset=${OFF2}[v012];
    [a01][a2]acrossfade=d=${XF}[a012];
    [v012][v3]xfade=transition=fade:duration=${XF}:offset=${OFF3}[vout];
    [a012][a3]acrossfade=d=${XF}[aout]
  " \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  "$OUT"

echo "wrote $OUT"
"$FFMPEG" -i "$OUT" -hide_banner 2>&1 | grep Duration
