# Changelog

## 2025-07-15 — Full Audit & Optimization

### Phase 1: Code Audit & Fixes

1. **Homepage missing metadata** — Added `generateMetadata()` to `app/[locale]/page.tsx` with full SEO: title, description, OpenGraph, alternates for both locales.

2. **Homepage query optimization** — Consolidated 9 separate Supabase queries into 6 parallel queries using `Promise.all()`. Eliminated redundant fetches by reusing the main tools array for trending, featured, newest, community, and special tool sections.

3. **Removed unused TRANSLATIONS object** — Deleted ~60 lines of hardcoded translation mappings from `app/[locale]/tools/[slug]/page.tsx` that were never used (the page uses `getLocalizedText()` instead).

4. **Removed console.log in production** — Cleaned up `console.log("Filtered tools count:", ...)` and `console.log("Selected category:", ...)` from `app/[locale]/tools/page.tsx`.

5. **Fixed `<html>` tag** — Added `lang="en"` and `suppressHydrationWarning` to the root layout's `<html>` element.

6. **Fixed dead footer links** — Removed links to non-existent pages (`/about`, `/contact`, `/privacy`, `/terms`). Replaced with working links to Reviews and Compare pages.

### Phase 2: Navigation & Layout Fixes

7. **Added Reviews link to Navbar** — Added "深度评测" / "Reviews" link to the navigation bar (both desktop and mobile) for better discoverability of SEO-critical review content.

8. **Added Navbar/Footer to tool detail page** — `app/[locale]/tools/[slug]/page.tsx` was missing site-wide navigation. Added `<Navbar>` and `<Footer>` wrapper.

9. **Added Navbar/Footer to news detail page** — `app/[locale]/news/[slug]/page.tsx` was missing navigation. Added for both the 404 and content states.

10. **Added Navbar/Footer to Compare page** — `app/compare/page.tsx` now wraps content with site navigation.

11. **Added Navbar/Footer to Submit page** — `app/submit/page.tsx` now has consistent layout.

12. **Added Navbar/Footer to Weekly page** — `app/weekly/page.tsx` now has consistent layout.

### Phase 3: SEO Metadata

13. **Submit page metadata** — Created `app/submit/layout.tsx` with title, description, OpenGraph, and canonical URL.

14. **Weekly page metadata** — Added `export const metadata` to `app/weekly/page.tsx` with title, description, OpenGraph, and canonical.

15. **Compare page metadata** — Created `app/compare/layout.tsx` with title, description, OpenGraph, and canonical URL.

### Summary

- **9 Supabase queries → 6** (33% fewer network calls on homepage)
- **~60 lines dead code removed** (TRANSLATIONS object)
- **5 pages got Navbar/Footer** (tool detail, news detail, compare, submit, weekly)
- **4 pages got SEO metadata** (homepage locale, submit, weekly, compare)
- **All pages now have consistent navigation**
- **Build passes** ✅
- **Deployed to production** ✅
