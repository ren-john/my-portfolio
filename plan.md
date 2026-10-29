# Portfolio Website Implementation Plan

> **Latest layout revision — October 16, 2026:** the portfolio is now monochrome. A full-screen centered photograph and name replace the split landing page. Scrolling disperses the photo particles, forms the existing first heading in the original typefaces, then hands off to HTML. The same portfolio content follows below. All head rotation is removed. This supersedes the earlier side-by-side and turning choreography below; see `README.md` for the current implementation.

> **Animation revision — October 16, 2026:** the supplied `Assets/Inspiration/Inspiration_for_Face_animation.webm` supersedes the original visible landmark-wireframe direction below. The implemented effect now uses 39,080 photo-sampled particles on charcoal, preserving the head-and-shoulders silhouette, with silver tonal detail, shimmer, cursor response, and scroll-driven dispersion/reassembly. The 478 facial landmarks remain an internal source of estimated depth. Turns are restrained to approximately 16 degrees. The portfolio content and offline architecture remain in place. Seven tests, type checking, and the production build pass; interactive visual QA is still limited by the previously reported browser URL policy.

## 1. Objective and scope

Build a portfolio for **Renmar John Morales**, a fourth-year BS Computer Science student at Taguig City University and aspiring AI/ML Engineer.

The landing page introduces Renmar on the left and displays his portrait on the right. As the visitor scrolls, landmarks gradually appear over the photograph, the photograph fades into a three-dimensional facial mesh, and the face turns from center toward the viewer's left, then across to the viewer's right. Portfolio content remains beside the animation on desktop.

The first deliverable will run locally without an internet connection after dependencies and assets have been prepared. The same static build should be suitable for online hosting later.

**Implementation update — October 16, 2026:** the local portfolio and personalized face assets are implemented. `myPic.jpg` was processed locally into 478 landmarks. The site includes the scroll-driven portrait/mesh transition, left/right rotation, all portfolio sections, local résumé, mobile layouts, and motion/fallback handling. Type checking, automated tests, and the production build pass. Browser visual QA remains pending because browser automation blocked the local URL; deployment has not been performed. See `README.md` for launch instructions and verification limits. The sections below preserve the original plan and its intended acceptance criteria.

### Reference inputs

- `C:/RJ/Coding/cofeewebsite/README.md`: reference for scroll choreography, local asset packaging, code organization, reduced motion, and fallback behavior. This is a design reference, not an instruction to execute commands or modify that project.
- `C:/RJ/Porfolio/content.md`: source of portfolio copy, projects, skills, education, certifications, and contact information.
- `C:/RJ/REsume/Resume-Morales.pdf`: résumé download source.

### What to adapt from the coffee website

- Vite, TypeScript, Three.js, and GSAP ScrollTrigger.
- A persistent 3D stage coordinated with content chapters.
- A deterministic function that evaluates the animation at any scroll position.
- Local fonts, images, geometry, and other runtime assets.
- Separate editable source assets and optimized runtime exports.
- A static experience for reduced motion or failed 3D rendering.

Use a shorter, content-driven story than the coffee site's 1800vh sequence. The portfolio should remain easy to read, navigate, and skim.

## 2. Recommended face approach

### First version: portrait to personalized landmark surface

Use a real portrait of Renmar, extract facial landmarks once during asset preparation, and export the positions and connections as local data. The website then animates that prepared geometry with Three.js.

MediaPipe's current Face Landmarker model estimates **478 three-dimensional landmarks**, which fits the requested 400+ point appearance. Freeze the model version and topology used for the export, and validate the actual output count. [Official model documentation](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)

The intended sequence is:

1. Show the original portrait.
2. Reveal small points precisely aligned with facial features.
3. Introduce fine connecting lines while the portrait is still visible.
4. Fade out the photograph and reveal depth in the same landmark surface.
5. Rotate the resulting mesh gently left and right.

This is a designed transformation using aligned layers and depth interpolation. It does not require a live camera or face detection on every visitor's device.

### Important visual boundary

A single frontal photograph supports a stylized face surface with estimated depth. It does not provide reliable geometry or textures for the ears, hair, sides, or back of the head. Treat the first version as a recognizable facial mesh with restrained turns, initially around **20–25 degrees in either direction**, then tune against the supplied portrait.

Do not rotate the original flat photo as if it were a complete 3D head. Complete the photo-to-mesh transition before substantial rotation. Keep the silhouette and facial features recognizable throughout.

### Upgrade path: a complete personalized 3D head

For large profile turns or a realistic textured head, prepare a custom model using additional reference images, a suitable scan, or artist-assisted modeling. Export an optimized GLB with matching textures and validate its likeness and topology. A generic head does not automatically become an accurate model of Renmar by applying his portrait.

This upgrade is optional for the requested stylized mesh prototype. If the first asset experiment cannot preserve likeness at the target turn angles, reduce the angle or use this upgraded asset path before polishing the rest of the scene.

## 3. Assets and information needed

| Item | Priority | Requirements / purpose |
| --- | --- | --- |
| Front-facing portrait | Required for the personalized animation | Clear, high-resolution photo; ideally at least 1600px on the long edge, full face visible, neutral expression, even lighting, minimal perspective distortion, no beauty filter. |
| Background treatment | Can be decided during preparation | Prefer a simple background or an approved cutout; retain the untouched original. |
| Left and right three-quarter photos | Recommended | Consistent lighting and expression; useful for checking likeness and shaping depth. These alone do not guarantee a complete 3D reconstruction. |
| Profile photos, scan, or custom head model | Required only for realistic wide turns | Used to build and verify geometry missing from a frontal photo. |
| Portfolio content | Available | Use `content.md`; shorten chapter summaries while preserving detailed project information. |
| Résumé PDF | Available | Copy an approved web-download version into public assets. |
| Project screenshots | Needed for polished project presentation | Start with driver fatigue detection, BabyCue, and the inventory system. |
| Repository and demo links | Optional | Add only supplied or verified destinations; hide unavailable buttons. |
| Font files and licenses | Implementation dependency | Bundle local WOFF2 files or use a system-font stack. |
| Colors and visual preferences | Optional | Proposed default: near-black background, off-white text, restrained cyan/teal mesh accents. |
| Domain and hosting account | Needed later | Not required to build or run the offline prototype. |

**Input update:** `myPic.jpg` has now been supplied and processed successfully. Real project screenshots and repository/demo links remain optional missing assets; the prototype uses labeled concept illustrations. Interactive visual assessment of likeness, alignment, and the turning range is still pending.

## 4. Layout and content placement

### Desktop and wide tablet

Use a two-column story container with approximately **55% content / 45% visual**, a generous gutter, and a bounded overall width. The right column holds a sticky stage beneath the navigation; the left column contains normal document-flow sections. Avoid placing body copy over the face.

```text
┌─────────────────────────────────────────────────────────────┐
│ Renmar John Morales          About  Projects  Skills  Contact│
├──────────────────────────────────┬──────────────────────────┤
│ Introduction                     │                          │
│ Aspiring AI/ML Engineer          │   Portrait → landmarks   │
│ View Projects / Get in Touch     │        → 3D mesh         │
│                                  │                          │
│ About                            │   Sticky visual stage    │
│ Featured projects                │   turns with scrolling   │
│ Skills                           │                          │
│ Education and certifications     │                          │
│ Contact                          │                          │
└──────────────────────────────────┴──────────────────────────┘
```

- Keep the face anchored in the right column throughout the main story.
- Use one canvas and one face geometry rather than rebuilding the scene per section.
- Align the stage with the visible content, leaving room for the full face at both rotation extremes.
- Present project details as readable sections or accessible expandable panels; avoid trapping long text in fixed-height panels.
- Release the sticky stage at the end of the story so the footer behaves normally.
- Provide chapter links and a skip-to-projects link so visitors can navigate without completing every animation beat.

### Mobile and narrow screens

Below an initial breakpoint near 900px, stack the visual and content to preserve readable text. On suitable portrait screens, use a compact sticky visual above the content, around 30–35svh. On short landscape screens, use an in-flow visual or static portrait so navigation and text remain usable.

The side-by-side arrangement is the desktop target. Do not squeeze both columns into a phone viewport. Tune breakpoints based on actual content width and available height.

## 5. Scroll storyboard

Progress values below are initial choreography targets. Map them to actual section anchors during implementation; do not force all content into a fixed scroll distance.

| Story progress | Adjacent content | Face appearance and motion |
| --- | --- | --- |
| 0–12% | Name, role, introduction, calls to action | Original portrait, centered gaze, no rotation. |
| 12–28% | About and AI/ML interests | Landmark dots gradually appear over the photograph. |
| 28–42% | Driver fatigue detection project | Fine mesh lines appear; portrait fades away; landmark depth grows from flat alignment to the prepared 3D surface. |
| 42–57% | BabyCue project | Fully revealed mesh turns toward the viewer's left, visually facing toward the text. |
| 57–72% | Inventory system and more projects | Mesh turns from left through center toward the viewer's right. |
| 72–87% | Skills, education, certifications | Mesh eases back toward center and becomes visually quieter. |
| 87–100% | Résumé and contact | Settle into a centered mesh or portrait/mesh blend; keep attention on contact links. |

Left and right above refer to the **viewer**, not anatomical left and right. Verify rotation signs in the rendered scene.

Scrolling upward reverses the transformation naturally. Stopping the scroll lets the motion settle. Avoid continuous auto-rotation, compulsory scroll snapping, or a second mouse-controlled rotation system in the first version.

## 6. Technical architecture

| Component | Planned responsibility |
| --- | --- |
| Vite + TypeScript | Local development server, typed implementation, optimized static output. |
| Semantic HTML + CSS | Accessible portfolio text, navigation, responsive grid, sticky stage. |
| Three.js | Camera, face point cloud, mesh connections, depth, orientation, and rendering. |
| GSAP + ScrollTrigger | Scroll progress and modest scrub smoothing. |
| MediaPipe Face Landmarker | Asset-preparation tool for extracting the supplied face; excluded from the visitor runtime by default. |
| Optional Blender workflow | Manual depth correction or preparation of a full personalized head model. |

Pin compatible dependency versions and commit the lockfile. Check the chosen Vite version's Node requirements at setup; the reference project's tested Node version is useful context, not proof that every future version is compatible.

### Keep content and animation separate

- Render the content as real HTML so it remains readable without WebGL and, where practical, without JavaScript.
- Use `evaluateStory(progress)` to return absolute scene values such as portrait opacity, point opacity, line opacity, depth amount, yaw, and scale.
- Derive state from scroll position, rather than incrementally adding rotation in event callbacks.
- Use a single displayed progress value for all animated properties so smoothing does not desynchronize layers.
- Use section-based mappings so expanded projects, local font loading, and viewport changes do not misalign the story.
- Refresh measurements after layout changes and restore the correct state on direct anchor navigation or browser scroll restoration.

ScrollTrigger supports scroll-linked animation and scrub smoothing; start with roughly 0.4–0.7 seconds of smoothing and adjust after reading-speed checks. [ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

## 7. Face asset preparation and rendering

### Preparation pipeline

1. Save the original portrait under `Assets/Portraits/` and create a consistently cropped derivative.
2. Record the image dimensions, crop, orientation, and any mirroring explicitly.
3. Run a pinned Face Landmarker model locally in image mode against the derivative. Use one face and inspect detection quality.
4. Export indexed landmark coordinates and compatible connections to `face-landmarks.json`. Record model version, landmark count, coordinate conventions, crop metadata, and source-image identifier.
5. Center and normalize the geometry; convert image coordinates to scene coordinates with aspect ratio preserved. Treat estimated depth as a visual starting point, not a measured head scan.
6. Build flat and depth-enabled positions with identical landmark indexing. Align the flat positions exactly with the displayed portrait before interpolating depth.
7. Check alignment at the eyes, nose, mouth, chin, and face outline. Calibrate an orthographic camera first to simplify the image-to-geometry match.
8. Validate left/right turns and adjust depth or angles where likeness breaks down.
9. Export an optimized portrait, geometry data, and static mesh poster for runtime use.

The preparation tool must load its model and supporting WASM locally if landmark extraction itself must work offline. MediaPipe documents local model paths and the required JavaScript package. [Web setup documentation](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)

### Rendering strategy

- Render the portrait layer and face geometry within one calibrated stage. Keep a separate HTML portrait as the loading/error fallback.
- Use one point buffer and one indexed line representation. Do not create hundreds of individual sphere objects.
- Use a verified topology matching the exported indices. Keep iris connections separate where needed; do not assume every landmark belongs to a standard surface triangle list.
- Reveal facial points progressively, then lines; interpolate depth only after the initial overlay aligns.
- Fade the complete photo/background or use an authored cutout so shoulders and background do not linger behind the floating mesh.
- If back-facing lines clutter the result, use a validated surface depth prepass or orientation-based fading. Avoid visible helper surfaces that resemble a generic face.
- Keep edges fine, point sizes readable, and glow restrained. Defer expensive post-processing until the core visual works well.

### Early quality gate

Before building all scroll chapters, demonstrate a short portrait → aligned mesh → left turn → right turn sequence using Renmar's actual photo. Inspect the likeness at front, midpoint, and both extremes. This experiment determines whether the prepared landmark surface is sufficient or a custom head asset is needed.

## 8. Offline prototype

### Runtime requirements

- Serve all scripts, styles, geometry, images, fonts, résumé assets, and optional decoders from the local project.
- Do not use CDN imports, Google Fonts requests, hosted model URLs, remote image URLs, or embedded external demos.
- Keep MediaPipe's preparation dependencies out of the public build unless an explicit future feature needs runtime inference.
- Use a local HTTP server; do not open `index.html` through `file://`.
- Bind the prototype server to `127.0.0.1` by default.

### Planned commands

These commands become available after implementation creates `package.json` and its scripts:

```powershell
# One-time setup while connected, or with an adequately prepared local cache
npm.cmd ci

# Local development after setup
npm.cmd run dev

# Validation and local production preview
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run preview
```

The proposed build output is `dist/`. Vite documents static builds and local preview, and notes that its preview server is not intended as a production server. [Vite deployment guide](https://vite.dev/guide/static-deploy.html)

### Meaning of offline

After initial setup, viewing the local website must require no internet connection. A fresh dependency installation may still require internet unless its packages are already available locally. Email, LinkedIn, and remote project links are outbound actions and cannot provide their external services offline; the local résumé download should work.

Offline after visiting a hosted website is a separate requirement. A service worker is not needed for this localhost prototype; add installable/offline-cached hosting behavior only if requested later.

## 9. Accessibility, loading, and performance

- Honor `prefers-reduced-motion` by showing a static portrait or prepared mesh poster and ordinary document flow.
- Provide a visible motion toggle for visitors who want a static experience.
- Keep navigation, project links, and contact actions keyboard-accessible with visible focus states.
- Treat the canvas as decorative; provide an appropriate portrait description without announcing hundreds of points.
- Do not hide essential content while 3D assets load. Show the portrait immediately and enhance it when ready.
- On WebGL initialization failure or context loss, preserve the text and show the static visual with an optional retry.
- Recompute camera framing on resize using the full planned rotation range, with margins to prevent clipping.
- Cap rendering pixel ratio initially near 1.5–2, reduce effects on weaker devices, and pause rendering when hidden or settled.
- Avoid allocating new geometry or buffers per animation frame; dispose of resources when replacing or removing the scene.

**Initial engineering targets, to be measured:** around 60 FPS on a typical desktop, usable 30 FPS or better on a midrange phone, and no more than roughly 3 MB of initial visual/runtime assets before deferred project images and the résumé. These are targets, not verified performance claims.

## 10. Proposed project structure

```text
C:/RJ/Porfolio/
  content.md
  plan.md
  README.md
  package.json
  package-lock.json
  index.html
  src/
    main.ts
    styles.css
    story/
      evaluateStory.ts
      sectionProgress.ts
    scene/
      createScene.ts
      createFace.ts
      cameraFraming.ts
    ui/
      navigation.ts
      motionPreference.ts
  tools/
    prepare-face/           # Local landmark extraction/export utility
  Assets/
    Portraits/              # Untouched originals and editable derivatives
    FaceSources/            # Preparation-only model/WASM files or custom head sources
  public/
    images/
      portrait.webp
      face-poster.webp
    data/
      face-landmarks.json
    fonts/
    projects/
    resume/
      Resume-Morales.pdf
  tests/
    story.test.ts
    faceAssets.test.ts
  dist/                     # Generated static website
```

Only runtime exports go into `public/`. Keep high-resolution source portraits, preparation models, and editable project files outside the deployed artifact. Use site-relative URLs in the website; local Windows paths belong only in development documentation.

## 11. Implementation phases

### Phase 1 — Prove the face transformation

- Obtain and inspect the portrait.
- Prepare and validate personalized landmarks and topology.
- Build a minimal stage with controllable reveal, depth, and yaw.
- Resolve likeness, photo alignment, and side-view limitations.

**Completion criterion:** a recognizable transformation using Renmar's face at the intended viewing angles.

### Phase 2 — Build the portfolio layout

- Set up the local project and pinned dependencies.
- Implement semantic content from `content.md` and the desktop split layout.
- Add the mobile layout, navigation, project summaries/details, résumé, and contact links.
- Bundle visual assets and fonts locally.

**Completion criterion:** the complete portfolio is usable with a static portrait.

### Phase 3 — Connect the scroll story

- Implement deterministic story evaluation and section-based progress.
- Connect portrait reveal, landmark reveal, depth, and left/right turns.
- Tune smoothness, framing, reading space, and navigation jumps.

**Completion criterion:** the animation follows the storyboard in both scroll directions and stays beside desktop content.

### Phase 4 — Validate and optimize

- Test the production build offline, with reduced motion, and with failed WebGL.
- Check responsive layouts and real performance.
- Correct clipping, alignment, reading obstruction, and unnecessary asset weight.
- Document actual commands, asset regeneration, limitations, and completed checks.

**Completion criterion:** the acceptance checklist below passes, with any remaining limitations explicitly recorded.

### Phase 5 — Prepare for online hosting

- Choose a static host when deployment is requested.
- Configure the correct asset base path for a root domain or hosted subdirectory.
- Add the final domain, canonical URL, social preview image, favicon, and metadata.
- Deploy `dist/` over HTTPS; verify assets, hash navigation, résumé download, and outbound links on the deployed URL.
- Keep the same prepared face animation; no ML server is required.

**Completion criterion:** a verified hosted version when hosting is authorized. No deployment is part of this planning task.

## 12. Acceptance and verification checklist

### Visual and interaction checks

- [ ] The landing page shows Renmar's real portrait on the right and introduction on the left at desktop widths.
- [ ] Points align with facial features before the portrait fades.
- [ ] The transformation reveals more than 400 personalized landmarks, with the recorded model's exact count validated.
- [ ] The face visibly turns center → viewer-left → viewer-right, then settles.
- [ ] Forward scroll, reverse scroll, rapid scrolling, anchor jumps, and restored scroll positions produce coherent states.
- [ ] Full project descriptions remain readable beside the stage without overlap.
- [ ] The face remains framed at all rotation extremes and after resizing.
- [ ] Mobile layouts preserve readable content and usable navigation.

### Meaningful automated checks

- [ ] Story evaluation has correct boundary values, continuous transitions, and identical results for the same progress regardless of scroll direction.
- [ ] Face data contains the expected landmark count, finite coordinates, valid topology indices, and consistent flat/depth positions.
- [ ] Required runtime assets resolve successfully and type checking/build succeed.

### Browser and offline checks

- [ ] Review at approximately 1440, 1024, 768, 390, and 360px widths, plus a short landscape viewport.
- [ ] Inspect initial portrait, transition midpoint, complete mesh, both rotation extremes, and contact state.
- [ ] With localhost still reachable, disconnect external internet, clear site cache or use a fresh browser profile, and load the production preview successfully.
- [ ] Inspect the network log for unintended external runtime requests. Do not rely on a previously warm CDN cache.
- [ ] Reduced motion, manual motion disable, keyboard navigation, asset-load failure, and WebGL failure leave a usable portfolio.
- [ ] Measure FPS/frame time, draw calls, and memory on representative hardware; record results rather than assuming targets were met.
- [ ] Test at least one Chromium browser and Firefox locally; add Safari/mobile browser verification before public release where devices are available.

## 13. Decisions carried into implementation

- Use the real portrait and a personalized, precomputed landmark mesh for the first prototype.
- Start with modest turns; use additional face assets if the requested likeness needs deeper rotation.
- Drive movement by scrolling, with no continuous spinning.
- Keep content beside the animation on desktop and adapt the arrangement on phones.
- Keep the visitor runtime entirely local and static.
- Start with the three strongest projects, while retaining the other projects in an accessible secondary section.
- Use the supplied README as an architectural guide without copying its coffee assets, commerce features, or unusually long scroll duration.
- Obtain the portrait before attempting the final personalized animation. Hosting and domain selection can wait until the prototype is ready.
