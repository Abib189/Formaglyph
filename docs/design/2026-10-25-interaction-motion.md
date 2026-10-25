# Workbench interaction layer

## Locked target

Extend the approved Glyph Workbench, not its layout or branding. Preserve Inter/JetBrains Mono, white/black inverse themes, rare #A10232, 8px controls, the fixed Explore chrome, exact source artwork and existing permissions. No new hero, visual exploration, imagery or Figcraft direction is needed for this code-native interaction pass. Generation remains paused.

## Evidence and decisions

The owner requested [Interior](https://github.com/ddoemonn/interior) and [Motion](https://motion.dev/docs/react). Interior is copy-in MIT source, not a published component dependency. The reviewed upstream revision is `b6b272307464ba79db7183cee0515846d7eb1f9c`. Adapt its async-action ticket/reset lifecycle and press-cancellation hook; retain its full licence and provenance. Do not import its Next.js documentation site, analytics, stone palette, blue focus rings, blur effects or 3D button skins.

Refero searches covered monochrome developer systems, creative-tool feedback and Linear. Full style references: shadcn UI `c14c0a94-1037-449e-bf5b-4cb972656ac7` and Linear changelog `11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6`. These reinforce the existing neutral component system and compact inverse theme, not a new palette, radius or page structure. Concrete feedback reference: [Xbox copied-link confirmation](https://refero.design/pages/7053d504-cee5-4cb4-b29c-8241b8138162); borrow the local confirmation/checkmark, not its green styling. Refero's motion/craft guidance supplies restrained, interruptible timing and accessible focus rules.

| Decision | Source and purpose | Boundary |
| --- | --- | --- |
| Stable-width pending/success/error buttons | Interior loading-button and copied-link feedback | Reflect actual promises; false/rejected actions never show success. No fake progress or new semantic colours. |
| Small press response | Interior press-depth cancellation lifecycle | Cancel on pointer up/cancel, blur, hidden tab and disabled state. No tilt or faux depth. |
| Moving navigation underline | Workbench active navigation + Motion transitions | Keep native links, aria-current and modifier-click navigation; do not turn navigation into a tab widget. |
| Short dialog entry | Motion + existing native dialog | Keep native focus trapping, Escape, nested scroll locks and focus return. Close immediately rather than retaining interactive exiting dialogs. |
| Toast enter/exit and filter feedback | Motion + Refero state-continuity guidance | No looping decoration, per-icon stagger, route exit delays, scroll-jacking or animated SVG geometry. Keep grid keys/focus and sticky positioning intact. |
| Reduced motion | Interior and Motion accessibility guidance | Same state/information, with movement disabled. Test preference changes as well as initial preference. |

Use Motion's slim `m` components and a single `LazyMotion`/`MotionConfig` boundary. Avoid a full `motion` import, drag/layout-projection features and measuring every catalogue tile. Motion applies to interface wrappers, never downloaded SVGs or the retained React package.

Motion is pinned to 14.6.0 (React 18/19 peer support). The one preference subscription uses `useSyncExternalStore` and feeds both the shared context and MotionConfig's always/never policy; this honours live OS preference changes without remounting forms. Press feedback moves the content wrapper, not the button hit target. Native dialog close stays immediate; nested Escape stops at the inner dialog and scroll locking uses ownership tokens, so parent-first unmount cannot leave the document locked. Exiting toasts are inert, and non-error announcements use a persistent polite region.

Unit tests use Happy DOM for lifecycle/ARIA/keyboard contracts and reduced-motion rendering; its incomplete WAAPI cancellation behaviour is not used as motion-performance evidence. Real motion, interrupted animations, nested dialogs and exports are exercised in Chromium. No benchmark on a physical low-end device is claimed.

## Validation boundary

Test real success/failure/retry, rapid activation, interrupted presses, keyboard focus, nested dialogs, route navigation, theme changes, search/filter/pagination, copy/export integrity and reduced motion. Compare screenshots with the existing Workbench and verify desktop/tablet/mobile-sized Chromium. Physical iPad/Safari and low-end-device performance are separate checks. Commit/push the scoped change, then show the local preview for approval before production deployment.
