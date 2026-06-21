# Claude Design prompt — Sanad Tech (سند التقنية)

> Paste the block below into Claude Design (or any AI design tool). It briefs all three surfaces — website, admin portal, client portal — in one premium, Arabic-first design language. The **website is a single bespoke signature experience (no theme toggle)**; only the two **dashboards** offer dark + light. Edit the page list / palette before sending if you want.

---

**PROJECT:** Design the complete UI for **سند التقنية (Sanad Tech)** — a premium, **professional** Arabic-first software house that builds SaaS, mobile apps, LMS, and ERP systems for clients, delivered phase-by-phase with weekly meetings and post-delivery support. "Sanad" means *support / backing* → the brand feeling is **trust, mastery, and craft.**

**THE MANDATE — A SINGULAR IDENTITY, NOT A TEMPLATE.** This must look like **only سند التقنية and no one else.** Invent a distinctive, ownable visual language and a signature interaction that becomes the brand's "tell." **Do NOT reach for the overused moves that thousands of sites already use** (full list of clichés to avoid is below). The goal is an award-caliber, unmistakably-its-own identity — the kind of craft seen on Active Theory, Resn, Framer, and Raycast — reinterpreted uniquely for an Arabic tech company.

**LANGUAGE & DIRECTION (build RTL-first, not retrofitted):** **Arabic is the default language and the layout is RTL** (`dir="rtl"`, `lang="ar"`); English is secondary (LTR). Use logical properties so layout mirrors automatically. Mirror anything directional — horizontal reveals slide **from the right**, parallax `x` inverts, "next" advances **leftward**, progress bars fill RTL, the cursor trail and any horizontal motion respect RTL. **Do NOT mirror:** the logo, media controls, numerals, charts with a time axis. Bilingual strings (brand/product names, code) stay LTR via `unicode-bidi: isolate`. When Arabic animates, **split by WORD, not letter** (Arabic is cursive — letter-splitting breaks the glyphs).

**TYPOGRAPHY — make the type the signature tell.** Choose a **premium Arabic display + text pairing** as the brand's voice (a contemporary Kufi/Naskh direction; candidates: Cairo / Tajawal / IBM Plex Sans Arabic / Readex Pro — but aim for a distinctive, ownable choice, not the default). Pair with a refined Latin face for English. Arabic needs more line-height and different optical sizing than Latin — **never reuse Latin type tokens blindly**, and **never apply letter-spacing to Arabic.** Pick one numeral system (Eastern-Arabic vs Western) and apply it consistently.

---

## WEBSITE — one bespoke, signature, fully-animated experience (NO dark/light toggle)

The website has **a single, fixed, signature look** — that fixed art direction *is* the brand identity. Removing the theme switch is deliberate: it frees you to craft one perfect, opinionated, deeply-considered aesthetic instead of two safe ones. Make it unforgettable.

**ART DIRECTION (adopt this craft, reinterpreted uniquely):**
- **A persistent signature hero "moment," not a banner.** Open into one real-time WebGL scene/object that belongs only to Sanad — then resolve gracefully into clear, readable, filterable content so business buyers immediately get "what do you do." Serve both the *wow* and the *clarity*. (Active Theory's dual-mode intro: cinematic + clear.)
- **A velocity-reactive cursor that emits an on-brand trail** (e.g. a calligraphic ink thread, a geometric tessellation, or a single luminous accent line — **NOT** generic floating dots). The cursor is part of the identity.
- **Full-screen in-place transitions** — a card/preview expands into its detail view with a fluid transition; avoid hard page reloads; keep the user inside one continuous world.
- **Premium dark canvas with controlled glow:** a near-black base, a deep surface ladder separated by **1px hairlines** (depth from the ladder + hairlines, not heavy shadows), and **2–3 rationed emissive accent colors** with bloom/additive glow. Render gradients in **Oklab with blue-noise dithering** so dark gradients look rich, never banded or muddy.
- **One signature decorative element per page, used once** (Raycast uses a single diagonal gradient stripe). Invent Sanad's equivalent — restraint makes it iconic.
- **A few genuinely tactile hero objects** — grabbable / reactive to cursor velocity with real spring physics (Resn). Quality over quantity; if it looks draggable, it must feel real.
- **Motion craft (Framer/Raycast discipline):** spring physics, not fixed durations (reveal ≈ stiffness 200 / damping 22; hover snappier). Reveals = fade-up **~24px** (never >40px), **stagger 60–80ms**, trigger at **20% in view**, **one focal animation per viewport** (nothing competes). Hover scale 1.02–1.05, card lift y −4px, press 0.97. Crispness = instant, low-amplitude state changes + hairline precision.
- **Show the real product/work mid-operation** — live working states, real metrics rendered as UI chips, the actual phased-delivery method visualized — not stock illustration.

**SIGNATURE SCROLL CHOREOGRAPHY — the centerpiece (make this the "wow").** The landing page must NOT be independent stacked sections. It is **one continuous, choreographed journey around a persistent central element**, exactly in the spirit of activetheory.net:
- **A persistent central object stays in the center of the viewport and travels with the user through the entire scroll** — it never just scrolls away. As the user moves between sections, **the same central element morphs/transforms** to express each section (e.g. it forms the Sanad mark in the hero → becomes a flowing conduit through "services" → becomes the **phased-delivery path** → becomes a **spine/axis** at the works section).
- **At the works / case-studies section, the central element becomes a vertical SPINE, and the project cards ORBIT around it** — as the user scrolls, the cards travel around the central axis (their angle/position is driven by scroll progress) while the section is pinned. Scrolling rotates the ring of work cards around the spine, bringing each project to the front in turn.
- **Every section animates IN RELATION to this central anchor** as you scroll — content assembles, reveals, and reacts to the shared center, so the whole page reads as one living world, not a slideshow.
- **How it should feel/behave (brief the build this way):** everything is driven by a single normalized scroll-progress value (0→1); the central element is a fixed, full-viewport layer (WebGL/Three.js object, or a pinned SVG/DOM element for a lighter build) that the page content scrolls over; section transitions use **pin + scrub** so motion is tied to the scrollbar. Orbiting cards sit on a ring (`angle = index ÷ count × 360°`) whose rotation is scrubbed by scroll.
- **Critical guardrails:** this is **scroll-LINKED, not scroll-JACKED** — never hijack scroll speed/direction, never trap the user, keep the native scrollbar, keyboard, and find-on-page working; animate transform/opacity only for 60fps; on mobile simplify (lighter or static central element); provide a `prefers-reduced-motion` fallback where the central element settles into clean static states per section. **RTL:** the vertical journey is identical in Arabic, but **flip the sign of the card orbit direction and any left/right motion** (use a direction scalar `+1`/`−1`).
- Reference touchstones for this exact effect: **Active Theory** (scroll-driven WebGL "worlds"), **Lusion** (WebGL scroll-sync), Aristide Benoist, Locomotive.

**SOUND (signature, tasteful — Resn-inspired):** Add an optional **sound layer** that makes the site feel alive. Rules: **never autoplay**; unlock audio on the first user gesture (the intro/enter interaction doubles as the unlock); then optionally fade in a **quiet ambient bed**. Provide a **persistent, always-visible sound on/off toggle**, default **off**, choice remembered. Trigger **short, low-volume cues on meaningful events only** (hero-object grab/release, section arrival, primary CTA) — **not** on every hover. Optionally make a hero visual **audio-reactive** (FFT → accent color/motion). Pair sound with `prefers-reduced-motion` (offer "calm mode": motion + sound off). Nothing is audio-only.

**ACCESSIBILITY/PERF:** Honor `prefers-reduced-motion` with a graceful reduced fallback (swap horizontal/parallax motion for opacity, disable the heavy WebGL/ambient layer). Animate transform/opacity only; lazy-load the WebGL canvas; adaptively drop post-FX on slow devices; ≥4.5:1 contrast; keyboard-navigable.

**WEBSITE PAGES (all content served from a database):**
1. **Landing** — signature WebGL hero → trust/clients → **services as a distinctive layout** (reinvent the grid — avoid the stock bento) → **phased-delivery timeline** (اكتشاف → تصميم → تطوير → إطلاق) → **case studies** (التحدّي / الحل / النتيجة + real metrics, each bespoke) → animated stats → testimonials → blog teaser → strong CTA → contact/footer.
2. **About** — story, team, values (trust/mastery).
3. **Services** + detail pages (SaaS, mobile, LMS, ERP…), each with its own treatment.
4. **Portfolio / Case studies** + detail (unique visual per project).
5. **Process** — phased delivery + weekly meetings + post-delivery support, animated.
6. **Blog** + post.
7. **Contact** + a multi-step **"Request a project"** form.
8. **FAQ**.
9. **Careers** — open roles.
10. **Legal** — privacy / terms.

---

## DASHBOARDS — usability first, with BOTH dark + light themes

The two dashboards are the opposite discipline from the website: **clean, fast, easy to use, low-friction** — a professional product UI (shadcn-style on a token system), **with a dark/light theme toggle** (users work in these for hours; comfort and clarity win over spectacle). Keep them visually kin to the brand (same type voice, same accent family) but calm and efficient. One **Sidebar + Topbar + Content** shell. Every list/detail ships **skeleton + empty + error** states (content-shaped skeletons, not spinners). Full RTL, Arabic default + English.

### Admin / management portal (staff)
- **Login**; **Dashboard** (stats: leads, content, traffic, project KPIs).
- **Website content management** — pages, services, portfolio, blog, testimonials, FAQ, menus — **editable in Arabic + English via per-locale tabs**.
- **Settings / Branding** — visual-identity editor that drives the website.
- **Media library**; **Leads inbox**; **Users & roles** (admin, developer, designer, QA, blog-writer, business-manager…).
- *(Design the shell to later absorb: Projects/Phases/Tasks/Sprints/Timesheets, CRM + quotes, Invoicing + Payments + Expenses, HR, Helpdesk + SLA.)*

### Client portal (clients)
- **Login**; **Project dashboard** (current phase, % complete, next milestone, blockers).
- **Phases / timeline** roadmap.
- **Deliverable review per phase** — view/download, **approve or request changes, formal sign-off**.
- **Messages** + comments + announcements + **weekly-meeting notes** (signature feature).
- **Files & contracts**; **Invoices** + payment status + **pay online**.
- **Support** — tickets + a **support-contract status** widget (coverage + time remaining).
- **Requests** — new project / scope-change (pre-filled).
- **Notifications**; **Profile**.

---

## CLICHÉS TO AVOID (so the identity is singular, not templated)
Do **not** use these over-done moves:
- Generic floating **particle/dot constellations** behind the hero (the #1 templated WebGL look).
- Drifting **aurora/blurred-blob mesh gradients** (the "every AI startup" background) — unless Oklab-correct *and* uniquely shaped into something ownable.
- Spinning **3D blob / torus / icosahedron** with default lighting (reads as a free Three.js demo).
- **Magnetic buttons + a giant inverting cursor circle** — done to death; any custom cursor must be brand-specific and subtle.
- **Word-by-word scroll reveal of every paragraph** — fatiguing; reserve a reveal for one headline.
- **Scroll-jacked horizontal galleries** that fight native scroll / break on trackpads / break RTL.
- **Awwwards/badge walls, "scroll to explore" + bouncing chevron, fake terminal typewriter loaders, infinite logo marquees, fake loading-percentage theater.**
- **Autoplaying sound or video** on load.
Pursue restraint and one or two singular, well-crafted signatures instead of piling on effects.

---

**DELIVERABLES:**
1. A **single signature design system for the WEBSITE** (one fixed art direction, the signature hero/cursor/sound, motion specs, all pages above, full RTL, reduced-motion + sound-off "calm mode").
2. A **dual-theme (dark + light) design system for the DASHBOARDS** — admin + client — clean, usable, shadcn-on-tokens, RTL-first, skeleton/empty/error states.
Prioritize the **website** and the **admin portal** first (these ship first); the client portal can follow. Above all: make it **unmistakably سند التقنية.**
