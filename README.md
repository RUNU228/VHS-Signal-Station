# VHS Signal Station

A browser-local WAV/MP3 player and real-time audio analysis deck built with Next.js, React, TypeScript, the Web Audio API, and Canvas 2D.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), then load one or more WAV or MP3 files. Audio remains local to the browser.

## Controls

- `Space`: play or pause
- `Left` / `Right`: seek
- `Up` / `Down`: adjust output level
- `M`: mute
- `N` / `P`: next or previous track

## Quality checks

```bash
pnpm test
pnpm lint
pnpm build
```

The implementation and design stages are documented under `docs/superpowers/`.
