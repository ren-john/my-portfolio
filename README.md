# Renmar John Morales — Portfolio

A local Vite and TypeScript portfolio inspired by the portrait opening, editorial typography, and continuous scroll of [Gravity Design](https://gravity-design.de/).

## Run

```powershell
npm.cmd run dev
```

Open the local URL Vite prints, normally `http://127.0.0.1:5173/`. Dependencies are already installed in this workspace. On another machine, run `npm.cmd ci` first with a compatible Node.js version.

## Design and content

- Full-height opening with the supplied `portrait-refined.png` integrated into a radial gray background. The gray is brightest around the face and falls off to charcoal toward the edges.
- CSS grayscale, multiply blending, gradient masks, and shading remove the appearance of a rectangular image. The source portrait is unchanged; an identical copy is bundled in `public/images/`.
- A monochromatic base with plum `#5F2A62` and lime `#A0DE59` accents.
- A continuous page: portrait → purple fill and orbital projects → mindset and introduction → toolkit → education and certifications → contact.
- The purple panel rises from below the portrait, fills the viewport, then shrinks into the central project hub. The scroll-driven transition reverses when scrolling upward.
- Seven floating project cards orbit the hub with depth, scale, and soft background focus. Drag the hub or a card to rotate, with brief momentum after release. The orbit also has wrapping previous/next controls, project indicators, keyboard navigation, and a list view.
- Large type, subtle scroll parallax, entrance animations, fixed anchor navigation, and a scroll progress line. Scrolling remains native, with no scroll trapping.
- All seven existing project detail dialogs and contribution notes, résumé downloads, email, and LinkedIn links retained. Illustrations are labeled concept views.
- Responsive portrait framing, native modal focus management, a motion toggle, and system reduced-motion support. Reduced motion skips the fill/contraction sequence and momentum; manual project selection remains available.
- Text, navigation, the portrait, and a regular grid of projects are available without JavaScript. Orbit controls and project dialogs require JavaScript.
- Vertical swipes outside the central hub keep scrolling the page. The hub supports dragging in both directions; cards support horizontal dragging on touch screens. No wheel events are intercepted. Animation work stops offscreen, when the tab is hidden, and after momentum settles.

The old network scene source remains in the repository but is no longer imported or shipped. Runtime assets are local. There is no backend or public deployment associated with this redesign.

## Main files

| File | Purpose |
| --- | --- |
| `index.html` | Page sections, existing projects and detail templates, contact links |
| `src/styles.css` | Layout, portrait compositing, responsive styling, motion |
| `src/tokens.css` | Colors, typography, spacing tokens |
| `src/main.ts` | Scroll state, section navigation, motion preferences, reveal timing |
| `src/orbit.css` | Pinned color transition, floating cards, list and mobile layouts |
| `src/ui/projectOrbit.ts` | Dragging, momentum, keyboard navigation, project dialogs |
| `src/ui/orbitMath.ts` | Scroll transition and orbit geometry |
| `public/images/portrait-refined.png` | Unmodified copy of the requested portrait |
| `content.md` | Detailed source copy |
| `tools/check_dist.mjs` | Build asset and anchor audit |

## Validation

```powershell
npm.cmd run build
npm.cmd test
```

The build includes TypeScript checking and an audit of local assets, section anchors, project templates, and the portrait. It also checks that the retired WebGL scene is absent from the production JavaScript.

Browser review covers desktop and mobile layouts, page overflow, anchor navigation, project selection and dialogs, contribution disclosures, motion preferences, and browser console errors. `dist/` contains the static production output and can be previewed using `npm.cmd run preview`.

Tests cover viewport coverage during the fill, contraction endpoints, orbit geometry, wraparound controls, and project templates. Tests for retained network/carousel utilities also remain; those utilities are no longer used by the visible page.
