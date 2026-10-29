# Renmar John Morales — Portfolio

A local monochrome portfolio built with Vite, TypeScript, Three.js, and GSAP. The opening shows only a centered grayscale portrait and Renmar's name. Scrolling disperses **39,080 particles** sampled from `myPic.jpg` and gathers them into the existing **“Human curiosity. Machine intelligence.”** heading. The particle letters hand off to semantic HTML before the rest of the portfolio. Facial depth is interpolated from the 478 landmarks extracted locally from the same photo; all head rotation is disabled.

The revised effect takes its visual direction from `Assets/Inspiration/Inspiration_for_Face_animation.webm`. The earlier green landmark wireframe has been replaced. The reference video is used for design inspection only and is not shipped as the website animation.

The layout uses black, white, and grayscale throughout. The full-screen opening follows the user's two supplied layout references; the original Arial, Georgia, and Courier New font families and portfolio copy are preserved. Navigation and content follow the opening instead of sharing its first viewport.

## Run locally

Dependencies are installed in this workspace. In PowerShell:

```powershell
cd C:\RJ\Porfolio
npm.cmd run dev
```

Open the localhost URL Vite prints, normally **http://127.0.0.1:5173/**. Stop with Ctrl+C. Do not open `index.html` through the filesystem.

For a clean setup on another machine, install a compatible Node.js version (this workspace uses Node 24.13.0), then run `npm.cmd ci` once while connected before starting the site. The website itself uses only local runtime assets. Initial package installation requires internet or a prepared package cache.

If this host's npm command wrapper cannot locate npm, invoke its CLI directly:

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

## Validate and build

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`dist/` is the static output. The preview server normally uses **http://127.0.0.1:4173/**; it is for local inspection, not a public production server.

## What is implemented

- A centered photograph and name, followed by a scroll-driven particle plume that forms the first heading. No yaw, roll, or idle head turns.
- Dense photographic particles preserve the head, hair, neck, and clothing; there are no visible mesh connections or landmark markers.
- Subtle shimmer and a localized cursor response during the particle transition. Pointer interaction does not interfere with touch scrolling.
- A reversible opening timeline, with letter targets sampled from the actual heading's font, weight, italics, spacing, and responsive position. The completed title becomes ordinary HTML text.
- About, seven projects, skills, education, certifications, contact links, and a local résumé download.
- Three custom vector project illustrations, explicitly labeled **concept views**. These are not screenshots of the actual applications.
- Responsive layout, keyboard-accessible navigation and disclosures, motion toggle, and system reduced-motion support.
- A grayscale portrait and HTML heading fallback for disabled motion or scene-load/WebGL failures, with a retry action.
- Local runtime assets, relative production paths, and lazy loading of the Three.js scene.
- GPU particle animation with static position buffers and a capped pixel ratio. Rendering stops when the stage is offscreen, the document is hidden, or motion is disabled. A still opening photograph does not run a continuous animation loop.

## Face preparation

The included `public/data/face-landmarks.json` is already prepared. Visitors do not download MediaPipe, run ML inference, or grant camera permission. A one-time local canvas read samples the supplied photograph into particle buffers. The photo's border-connected white background is masked in memory, while the white shirt is retained. The original photo is not modified.

The source photo remains untouched. The public portrait is a copy. CSS controls its presentation; MediaPipe processed the original locally using the Face Landmarker float16 version 1 model and MediaPipe 1.1.1. The export contains source/model hashes, dimensions, coordinate conventions, 478 landmarks, 1,322 mesh edges, facial contours, and triangle topology.

To regenerate, use Python 3.12, the pinned preparation dependency, and the local model:

```powershell
python -m pip install --target .tools/python mediapipe==1.1.1
python tools/prepare_face.py
```

This workspace's preparation environment was installed with the bundled Python executable:

```powershell
& 'C:\Users\RJ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools/prepare_face.py
```

The preparation-only model is `Assets/FaceSources/face_landmarker.task`. It can be obtained from [Google's versioned model download](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task). Keep that model and `.tools/` out of the deployed build. Once dependencies and the model are present, regeneration runs locally.

A single photo provides a stylized photographic surface with estimated depth. Hair and shoulders retain the photograph's silhouette and use a shallow supporting volume; facial depth comes from the landmarks. This is not a full head scan. The portrait remains front-facing throughout the new animation.

## Main editing points

| File | Purpose |
| --- | --- |
| `index.html` | Visible content, navigation, project illustrations, links |
| `src/tokens.css` | Color palette and type tokens |
| `src/styles.css` | Desktop/mobile layouts and visual treatment |
| `src/opening.css` | Full-screen opening, monochrome overrides, and content layout |
| `src/story/evaluateStory.ts` | Photo/name fade, particle dispersion, letter formation, and HTML handoff |
| `src/scene/createScene.ts` | Photo/particle renderer, GPU motion, cursor response, and camera |
| `src/scene/portraitParticles.ts` | Background mask, photograph sampling, and interpolated landmark depth |
| `src/scene/textParticles.ts` | DOM-font sampling and deterministic particle destinations inside the first heading |
| `src/main.ts` | Scroll coordination, scene lifecycle, navigation state, motion settings |
| `tools/prepare_face.py` | Reproducible local extraction from the original photo |
| `tools/check_dist.mjs` | Built-asset and anchor audit |
| `content.md` | Longer source copy for future edits; not automatically rendered |
| `plan.md` | Original plan and implementation status |

## Verification status

Type checking, nine automated tests, the production build, and the static asset audit pass. Tests cover photo/name opening states, zero head rotation, dispersion, letter formation, HTML handoff, reverse-scroll determinism, landmark validity, silhouette masking, white-shirt preservation, and deterministic particle destinations. Source comparisons confirm the existing portfolio content and font-family declarations are unchanged, and all stylesheet/HTML/SVG hex colors are grayscale.

The sampler was also run against the actual 387×512 source photo: it produced 39,080 particles with finite coordinates, removed the background corner, and retained checked nose, hair, and shirt pixels. This verifies data preparation, not rendered appearance or browser frame rate.

**Browser visual QA is not completed.** The app's browser automation rejected the local preview URL under its browser security policy. No alternate browser or policy workaround was used. Actual shader rendering, photo/point alignment, desktop/mobile framing, measured FPS, browser network behavior, keyboard interactions, and fallback behavior still require an interactive browser review. Passing a build does not establish those results.

Suggested review:

1. Start the site and review at widths around 1440, 1024, 768, 390, and 360px.
2. Confirm the first viewport contains only the centered photo and name. Scroll through dispersion, particle-letter formation, the HTML heading handoff, and the portfolio content; then reverse. Check that the face never turns.
3. Resize during the transition and check that particles still gather into the correctly positioned heading. Expand project contributions and test navigation links below the opening.
4. Toggle motion, enable system reduced motion, and check keyboard navigation.
5. Test without external internet while keeping localhost reachable; load in a fresh profile to avoid relying on cached external assets.
6. Verify the résumé download and contact destinations. LinkedIn and email services naturally require their own connectivity.

## Future hosting

Deploy `dist/` to a static host when ready. Vite uses a relative base so assets can resolve under a root domain or subdirectory. Test the actual destination before sharing it. No backend, database, or ML server is required.

Before public release, add real project screenshots and verified repository/demo links, review the résumé for public sharing, add the final domain/social preview metadata, and complete browser QA. No domain, hosting account, or deployment has been created.

## Technical references

- [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
- [MediaPipe Python setup](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/python)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
