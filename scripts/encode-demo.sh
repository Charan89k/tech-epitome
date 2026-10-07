#!/usr/bin/env bash
# Encodes the recorded demo (e2e/capture-media.spec.ts) for the README:
# an MP4 for the full-quality link and a GIF that plays inline on GitHub.
set -euo pipefail
src="test-results/demo-video/demo.webm"
[ -f "$src" ] || { echo "no recording at $src — run the capture first" >&2; exit 1; }
mkdir -p docs/videos docs/screenshots
ffmpeg -y -loglevel error -i "$src" -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart \
  docs/videos/tech-epitome-demo.mp4
# Two-pass palette keeps the GIF sharp and its size reasonable.
ffmpeg -y -loglevel error -i "$src" -vf "fps=12,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff" \
  /tmp/tech-epitome-palette.png
ffmpeg -y -loglevel error -i "$src" -i /tmp/tech-epitome-palette.png \
  -lavfi "fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  docs/screenshots/demo.gif
ls -la docs/videos/tech-epitome-demo.mp4 docs/screenshots/demo.gif
