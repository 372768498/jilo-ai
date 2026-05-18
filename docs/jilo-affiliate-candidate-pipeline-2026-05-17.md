# Jilo.ai Affiliate Candidate Pipeline - 2026-05-17

## Current State

- Published tools: 108
- Tools with `affiliate_url`: 0
- Outbound click tracking: live through `/api/out`
- Tool clicks and static target clicks are logged to `ops_logs.job_name = outbound_click`
- Daily and weekly reports now include outbound clicks, affiliate clicks, and live affiliate tool count

## Priority Affiliate Candidates

| Priority | Tool / Platform | Current Jilo slug | Why it matters | Program / source | Action |
| --- | --- | --- | --- | --- | --- |
| P0 | AppSumo | static target | AI deal intent, strong purchase mindset | https://help.appsumo.com/article/50-appsumo-affiliate-program and https://appsumo.com/become-appsumo-affiliate | Apply, then replace `appsumo-ai` target URL with approved tracking link |
| P0 | ElevenLabs | `elevenlabs` | Audio/voice AI has strong paid upgrade intent | https://elevenlabs.io/affiliates | Apply through account, then fill `affiliate_url` |
| P0 | Grammarly | `grammarly` | High-fit for student/work writing SEO | https://www.grammarly.com/affiliates | Apply, then fill `affiliate_url` |
| P0 | QuillBot | `quillbot` | Student/writing workflow fit, PartnerStack-backed | https://quillbot.com/affiliates | Apply, then fill `affiliate_url` |
| P0 | Semrush | `semrush` if present, otherwise create/merge | Highest commercial SEO intent | https://www.semrush.com/lp/affiliate-program/en/ and https://www.semrush.com/kb/97-affiliate-program | Apply via Impact, then add/merge tool and fill `affiliate_url` |
| P1 | Surfer SEO | `surfer-seo` | High-CPC AI SEO comparison pages | https://surferseo.com/affiliate-program/ | Apply, then fill `affiliate_url` |
| P1 | Writesonic | `writesonic` | Writing/marketing pages can convert | https://writesonic.com/affiliate | Apply, then fill `affiliate_url` |
| P1 | Descript | `descript` | Creator/video workflow monetization | https://help.descript.com/hc/en-us/articles/10612726938509 and https://www.descript.com/es/affiliate | Apply or use referral program if affiliate approval is delayed |
| P1 | Copy.ai | `copy-ai` | B2B writing and sales workflow fit | Official program needs manual verification before adding a tracking link | Verify program page, then apply |
| P1 | Jasper | `jasper` | B2B writing and marketing intent | Official program needs manual verification before adding a tracking link | Verify program page, then apply |

## Implementation Rule

Do not paste generic official URLs into `affiliate_url`. Only put a URL in `affiliate_url` after the account has an approved tracking link or referral link that belongs to Jilo.ai.

For unapproved candidates:

- Keep `official_url` as the normal official site.
- Route clicks through `/api/out` so demand is measured.
- Use source labels such as `tool_detail`, `deals_page`, `seo_fallback`, and `tools_sidebar`.

## First 7-Day Monetization Sprint

1. Apply to AppSumo, ElevenLabs, Grammarly, QuillBot, Semrush, Surfer SEO, Writesonic, and Descript.
2. As each program approves, update the matching Supabase tool row:
   - `affiliate_url`
   - `affiliate_platform`
3. Re-run the daily report and check:
   - `Affiliate tools live`
   - `Outbound clicks`
   - `Affiliate clicks`
4. Prioritize content around pages that produce clicks:
   - `/en/deals`
   - `/en/tools/elevenlabs`
   - `/en/tools/grammarly`
   - `/en/tools/quillbot`
   - `/en/best/*`
   - `/en/compare/*`

## Compliance Notes

- Add `rel="sponsored nofollow"` to outbound monetized links.
- Add affiliate disclosure on pages where `affiliate_url` is present.
- Avoid claims of official partnership unless the affiliate program explicitly permits it.
- Do not recommend gray-market account sellers or instructions for bypassing platform controls.
