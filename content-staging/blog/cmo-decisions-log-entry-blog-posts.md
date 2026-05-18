## CMO decisions-log entry for splice

**Splice target:** `leadership/cmo/decisions-log.md` — append after line 1607 (current last line)

---

### Decision: doggocrm-blog-founding-cohort-posts-2026-05-18
**Date:** 2026-05-18
**Status:** Closed — 3 blog posts authored, integration pending
**Priority:** P1 — founding-cohort outreach launches CCO DM sequence; thin blog hurts trust signal at click-through

#### Summary

Authored three Hebrew-first blog posts for the DoggoCRM `/blog` storefront. Posts target the trust-signal gap that trainers who receive CCO founding-cohort DMs will encounter when they click through to doggocrm.app. An empty or near-empty blog reads as a pre-launch product. Three posts with depth and product-level specificity establish real substance.

#### Content decisions made under CMO authority

**Post 1 — "איך לעבוד עם 12 לקוחות בלי להתבלבל"**
Slug: `12-clients-no-confusion`
Target publish date: 2026-05-19 (Day 1 of CCO outreach launch)
Angle: practitioner problem first, implicit product pitch. The post describes the structural breakdown (information scattered across WhatsApp/spreadsheet/memory) and the shape of a solution without leading with the product name. DoggoCRM appears at the CTA, not in the body. Rationale: founders-cohort outreach DMs already name the product; the blog post should add depth, not re-pitch.
Word count: ~700 words.
Anti-bot attestation: zero em dashes. No banned Hebrew phrases (checked against `studio/anti-bot-writing-rules-hebrew.md`). Sentence length varied throughout. No tricolons used as rhetorical flourish.

**Post 2 — "מה כדאי לתעד אחרי כל שיעור (וואטסאפ או לא)"**
Slug: `session-notes-what-to-document`
Target publish date: 2026-05-21 (Day 3 of CCO outreach)
Angle: opinionated take on session notes. The ruling: notes you don't go back to are wasted notes. Five specific things worth capturing named in prose (no bullet-default structure). WhatsApp section acknowledges the tool honestly: good for in-the-moment, not for archive. Post closes on the habit that changes everything (3 minutes in the car before driving away).
Word count: ~800 words.
Anti-bot attestation: zero em dashes. Banned phrases absent. Prose carries the five-point list rather than defaulting to bullets.

**Post 3 — "גיא השתמשה ב-Doggo CRM חצי שנה לפני שמישהו אחר ראה אותו"**
Slug: `gaya-design-partner-story`
Target publish date: 2026-05-23 (Day 5 of CCO outreach)
Angle: design-partner origin story. Cites specific product decisions Gaya's daily usage drove: intake form field count (12 reduced to 8), Hebrew register decisions (שיעור vs מפגש, per-surface distinction), billing integration architecture (two providers with no hierarchy, not a ranked choice), and three specific bugs found only through live use. This is the founding-cohort credibility post. Trainers who read it see a product built with a real trainer, not for a hypothetical one.
Word count: ~750 words.
Anti-bot attestation: zero em dashes. Builder-to-builder register, specific and concrete throughout. No hedging chains. No formal register bleed.

#### Architecture decision: blog content lives in BlogPostPage.tsx (hardcoded TSX)

Investigation confirmed: no `src/content/blog/` directory existed prior to this dispatch. Blog content is hardcoded as a `POSTS` Record in `projects/doggo-crm/source/src/pages/public/BlogPostPage.tsx`. The posts were authored as TSX snippet files at `projects/doggo-crm/source/src/content/blog/*.tsx` for CPO/CTO integration into BlogPostPage.tsx.

Integration step required (CPO/CTO scope): splice the three TSX objects from the snippet files into the `POSTS` Record in BlogPostPage.tsx. Each file contains clear splice instructions at the top. The objects are valid TSX matching the existing `Post` interface (`slug`, `title`, `description`, `publishedAt`, `readingMinutes`, `body: () => React.ReactElement`).

Flagging this as a cross-dependency for the CPO or CTO to execute. CMO authority ends at content authorship. Splice is a code change, not a content decision.

#### Internal link strategy

All three posts link to each other and to existing blog posts and `/pricing`. Internal link map:
- Post 1 links to: `/blog/session-notes-what-to-document`, `/blog/excel-to-crm`, `/pricing`
- Post 2 links to: `/blog/12-clients-no-confusion`, `/blog/whatsapp-vs-crm`, `/pricing`
- Post 3 links to: `/blog/intake-form-mistakes`, `/blog/12-clients-no-confusion`, `/blog/sumit-vs-greeninvoice`

One outbound link per post (outbound link in post 3 body not yet embedded; recommended: האיגוד הישראלי למאלפי כלבים — https://www.israeldog.co.il/). Posts 1 and 2 carry the outbound link suggestion in the snippet file metadata; body expansion can embed if desired. Current post length targets did not require a citation anchor.

#### Publication cadence

Day 1 (2026-05-19): Post 1 — practical, no product pitch. Sets substance baseline.
Day 3 (2026-05-21): Post 2 — practitioner-specific, builds depth.
Day 5 (2026-05-23): Post 3 — credibility origin story. Closes the founding-cohort trust arc.

Cadence is CMO-set. CCO aligns DM timing to match so blog is populated at click-through.

#### Authority

A19/N8 self-check: passed. Hebrew blog post content for DoggoCRM storefront is CMO-CPMO joint territory (CMO holds voice, CPMO holds positioning). These posts are builder-to-builder product marketing in the product voice, not Yakir's personal LinkedIn voice. CMO-CPMO boundary per profile: CMO holds voice, CPMO holds positioning; joint surfaces ratified jointly. This dispatch is CMO-authored content in product voice, not Yakir's personal voice, which means it falls closer to CPMO surface than personal brand surface. However, Hebrew voice register and anti-bot compliance are CMO authority. Filing under CMO decisions-log as the authoring chief. CPMO should ratify positioning before posts publish.

No Yakir-gate on these posts. StoreFront product blog is not Yakir's personal brand surface. CCO aligns on timing.

[chief authored, orchestrator shipped]

A19/N8 self-check: passed
