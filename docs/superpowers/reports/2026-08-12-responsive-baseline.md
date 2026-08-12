# Responsive Station Baseline

Date: 2026-08-12

Local application: `http://localhost:3210/` from the `vhs-major-update` worktree

Method: in-app browser viewport overrides, screenshots for visual judgment, and DOM measurements for geometry.

## Acceptance matrix

`Page overflow` compares `document.documentElement.scrollWidth` with `innerWidth`. `Min discrete target` is the smallest width or height among visible application buttons. The upload/drop target was measured separately because it is a composite file-input surface. `Player accessible` means the player grid's left and right bounds stayed inside the viewport.

| Viewport | Orientation | Page overflow | Rack mode | Min discrete target | Player accessible | Result |
|---|---|---:|---|---:|---|---|
| 320×568 | portrait | no (305≤320) | 1 column | 44px | yes | pass |
| 375×667 | portrait | no (360≤375) | 1 column | 44px | yes | pass |
| 390×844 | portrait | no (375≤390) | 1 column | 44px | yes | pass |
| 430×932 | portrait | no (415≤430) | 1 column | 44px | yes | pass |
| 760×430 | landscape | no (745≤760) | 1 column | 44px | yes | pass |
| 768×1024 | portrait | no (753≤768) | 2 columns | 44px | yes | pass |
| 820×1180 | portrait | no (805≤820) | 2 columns | 44px | yes | pass |
| 1024×1366 | portrait | no (1009≤1024) | 2 columns | 44px | yes | pass |
| 1024×768 | landscape | no (1009≤1024) | 2 columns | 44px | yes | pass |
| 1280×800 | landscape | no (1265≤1280) | 2 upper / 3 lower | 44px | yes | pass |
| 1440×900 | landscape | no (1425≤1440) | 2 upper / 3 lower | 44px | yes | pass |
| 1920×1080 | landscape | no (1905≤1920) | 2 upper / 3 lower | 44px | yes | pass |
| 2560×1440 | landscape | no (2545≤2560) | 2 upper / 3 lower | 44px | yes | pass |
| 3840×2160 | landscape | no (3825≤3840) | 2 upper / 3 lower | 44px | yes | pass |

## Supporting geometry

| Viewport | Player grid | Upload target | CRT heights (px) | Station shell | CRTs inside panels |
|---|---:|---:|---|---:|---|
| 320×568 | 1 column | 285×152 | 220 / 220 / 220 / 220 / 220 | 305px | yes |
| 375×667 | 1 column | 340×152 | 225 / 225 / 225 / 225 / 225 | 360px | yes |
| 390×844 | 1 column | 355×152 | 234 / 234 / 234 / 234 / 234 | 375px | yes |
| 430×932 | 1 column | 395×152 | 258 / 258 / 258 / 258 / 258 | 415px | yes |
| 760×430 | 1 column | 720.7×93.3 | 230 / 230 / 230 / 230 / 230 | 745px | yes |
| 768×1024 | 8 columns | 728.4×93.5 | 238.1 / 238.1 / 238.1 / 238.1 / 260 | 753px | yes |
| 820×1180 | 8 columns | 778.8×95.1 | 254.2 / 254.2 / 254.2 / 254.2 / 270.6 | 805px | yes |
| 1024×1366 | 8 columns | 976.3×101.2 | 317.4 / 317.4 / 317.4 / 317.4 / 337.9 | 1009px | yes |
| 1024×768 | 8 columns | 976.3×101.2 | 317.4 / 317.4 / 317.4 / 317.4 / 337.9 | 1009px | yes |
| 1280×800 | 12 columns | 1224.1×105 | 390.3 / 390.3 / 283.8 / 283.8 / 283.8 | 1265px | yes |
| 1440×900 | 12 columns | 1378.9×105 | 442.2 / 442.2 / 321.7 / 321.7 / 321.7 | 1425px | yes |
| 1920×1080 | 12 columns | 1800×105 | 422.4 / 422.4 / 422.4 / 422.4 / 422.4 | 1876.8px | yes |
| 2560×1440 | 12 columns | 1800×105 | 440 / 440 / 440 / 440 / 440 | 1896px | yes |
| 3840×2160 | 12 columns | 1800×105 | 440 / 440 / 440 / 440 / 440 | 1896px | yes |

## Visual observations

- Smartphone: the brand, panel headers, transport controls, uploader, and single-column rack remain legible without horizontal clipping. Portrait CRTs stay between 220px and 258px; the shallow 760×430 layout uses 230px CRTs and reduced section spacing without shrinking controls.
- Tablet: the rack provides two useful columns and the player uses eight tracks. The full-width Spectrum remains broad but is bounded to 260–337.9px high, avoiding an oversized intermediate canvas.
- Desktop: the upper Spectrogram/Waveform pair remains dominant and the three lower modules remain balanced. The 12-column player fits without squeezing controls.
- Large display: the station is centered and capped. It measures 1896px including 48px outer padding at 2560px and 3840px, the title caps at 52px, and CRTs cap at 440px. The surrounding negative space is symmetric and intentional.

No screenshot files were committed; screenshots were inspected live at every row and at each corrected failure.
