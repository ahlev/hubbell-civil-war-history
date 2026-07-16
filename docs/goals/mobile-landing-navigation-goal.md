/goal Mobile navigation: bottom-right "readiness" advance button for the experience-v2 landing

FILE: experience-v2/landing.html  (single-file; CSS + scenes + JS engine IIFE)
BRANCH: outreach-engine  •  PREVIEW-FIRST — do NOT merge to main. Verify on a Vercel preview.
HARD CONSTRAINT: MOBILE-ONLY. Every change must be gated behind the existing JS flag
  `isMobile` (matchMedia('(max-width:760px)')) and/or `@media(max-width:760px)`.
  The desktop (≥761px) render and UX must remain BYTE-FOR-BYTE unchanged — verify this explicitly.

WHY: On a phone the center-bottom dual-chevron gives no sense of progress. Users can't tell
whether the current scroll position is mid-animation/mid-load or parked at a stable checkpoint,
and (because swipe never snaps) they can't infer how far a swipe must go to reach the next scene.

OUTCOME: A bottom-right thumb cluster. Its FORWARD button is the primary affordance AND a
readiness meter: it fills with color as the current scene settles + its media becomes playable,
and locks to a fully-saturated, softly-pulsing "go" state meaning "nothing is loading — the next
tap/swipe advances the experience." Swipe up/down must keep working as an advance option.

────────────────────────────────────────────────────────
CURRENT-CODE ANCHORS (read these before editing)
- Markup: #ind / .ringwrap / #advup / .ring (#ringfg) / #advdown  → lines ~450-460
- Indicator CSS: `.scrollind …` ~194-228; existing mobile overrides ~309-312
- Engine: isMobile flag ~468; ANCHORS/TRANS ~504-505; nextIdx/prevIdx/nearIdx/goTo/goNext/swell
  ~509-515; stepAdvance ~516-528; button+key+cancelAdv wiring ~529-536; lazy() + `scenes` map
  ~552-555; brothersSeq (bareArrival/seqIdx, 3500ms dwell) ~590-624; apply() ring+chevron+intro
  block ~681-697 (note: line 684 drives #ringfg from `within`; line 694 writes an inline
  `translateX(-50%)…` transform EVERY FRAME; line 689 toggles advdown visibility).

────────────────────────────────────────────────────────
REQUIREMENTS

1) READINESS SIGNAL (mobile only) — add a function returning 0..1; compute it in apply(now):
   const motion = advActive
       ? 1 - clamp(Math.abs(advTo - p)/0.14, 0, 1)      // tap-glide: fill across the whole span to
                                                        //   the target anchor (covers transition clips
                                                        //   that play mid-glide)
       : 1 - clamp(Math.abs(target - p)/0.012, 0, 1);   // free swipe: fill as p eases to rest
   let media = 1, v = activeSceneVideo();               // <video> of the scene whose [a,b]∈`scenes` contains p
   if (v) media = v.readyState>=3 ? 1 : v.readyState>=1 ? 0.5 : 0;
   let dwell = 1;                                        // brothers bare→headline intro counts as "loading"
   if (p>=SEG.brothers[0] && p<0.578 && seqIdx<0) dwell = clamp((now-bareArrival)/3500, 0, 1);
   readiness = clamp(Math.min(motion, media, dwell), 0, 1);
   - activeSceneVideo(): iterate `scenes` for the [a,b] range containing p, return its first <video> (or null).
   - Tune constants (0.14 ≈ widest inter-anchor span; 0.012 settle window) empirically on the preview.

2) DRIVE THE FORWARD BUTTON FILL (mobile only):
   - When isMobile: drive `#ringfg` stroke-dashoffset from `readiness` (sweep 0→full) INSTEAD of the
     desktop `within` value — gate line 684 so desktop keeps `within`.
   - Set a CSS custom prop on #advdown each frame: advdown.style.setProperty('--fill', readiness)
     and saturate the chevron/button background from muted (low --fill) to full gold (--fill→1).
   - At readiness ≥ ~0.97 add class `ready` to #advdown → soft pulsing glow + full saturation
     ("complete emphasis"); remove below the threshold. Reset naturally on each advance (readiness drops).

3) LAYOUT — bottom-right thumb cluster (mobile only, @media ≤760px):
   - Position #ind fixed at the bottom-right, respecting safe areas:
       right: max(14px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom));
       left:auto; AND gate/override the per-frame inline transform at line 694 so it does NOT apply
       translateX(-50%) on mobile (otherwise it re-centers every frame). On mobile set only the
       intro emphasis you want (or none) — do not re-center.
   - Forward button (#advdown): primary, circular, ≥56px tap target, gold chevron centered, ring
     sweep around it. Clearly looks pressable (subtle raised/glass background, shadow).
   - Back button (#advup): smaller, subordinate, tucked just above/left of the forward thumb; keep
     the existing `.show` toggle (hidden at first anchor). Fixes the current 1px left/right
     misalignment by re-anchoring both in the corner.
   - Keep #advdown hidden at the last anchor (line 689 logic) and #advup hidden at the first.
   - Ensure no collision/overlap with the right-edge progress rail (#prail/#pthumb); offset or
     shorten as needed on mobile.
   - Hide the desktop-only `.inputs` (mouse/key hints) and `.lab` on mobile (lab already hidden).

4) KEEP SWIPE WORKING: do not remove wheel/touch free-scroll. Swipe up/down must still advance.

5) [RECOMMENDED, mark clearly / make easy to toggle] SNAP-ON-SWIPE-END (mobile only):
   - This is the most direct fix for "I can't tell how far a swipe must go." On `touchend` (mobile),
     after a short settle, glide to a checkpoint: pick next/prev/nearest ANCHOR from swipe direction
     + distance (reuse nextIdx/prevIdx/nearIdx + goTo). Small threshold so tiny swipes snap back,
     larger swipes advance one checkpoint. Must NOT fight the existing cancelAdv on touchstart.
   - If it feels heavy-handed in testing, leave it behind a one-line flag rather than deleting.

────────────────────────────────────────────────────────
DESKTOP-SAFETY (must verify, not assume)
- All new JS runs only when isMobile; #ringfg still uses `within` on desktop; #ind still centers on
  desktop via line 694; no new always-on CSS outside the @media block.
- Confirm: load at ≥1024px, the indicator is unchanged (centered, ring = scroll position), and the
  brothers headline still auto-reveals at ~3.5s. Diff behavior against current main/preview.

VERIFICATION (Vercel preview + Playwright)
- Resize to a phone viewport (e.g. 390×844). Confirm: cluster sits bottom-right within safe area;
  forward button is the large primary; ring + --fill sweep 0→1 as a scene settles; `ready` class
  + pulse appears at full; tapping advances to the next ANCHOR; swiping up/down still advances;
  back button appears after the first checkpoint and is subordinate.
- TIMING CAVEAT: headless rAF is throttled to ~1fps, which stretches p-easing and any time-based
  readiness ramp. Verify fill by settling at a checkpoint then measuring (don't trust a fixed wall-
  clock window during the eased approach). Confirm readiness reaches ~1 and resets per advance.
- Confirm all 22 assets still 200 and no new console errors (favicon 404 is pre-existing/benign).

DELIVERABLE: changes committed on outreach-engine and pushed for a fresh preview; report the
preview URL and the desktop-unchanged confirmation. Do NOT merge to main.
