"""
monetization_worklist — turns the system's ROI signal into a one-page human
action plan, so the irreducible "go sign up for the program" step actually gets
done instead of drowning in 100 scattered flags.

It reads the real revenue leaks (published tools with outbound clicks and no
tracked affiliate link), ranks them by expected revenue, joins each to the
affiliate_programs registry (concrete signup search/url + status), computes how
few signups cover most of the leak, and writes docs/monetization-worklist.md.

It leads with self-monetizable plays (no external approval) and a reality check
on traffic, because below a few hundred PV/day the highest-ROI move is the
operator's own offer, not chasing 25 affiliate applications.

Pure read + file write. Never touches the DB's tool rows (that's autofill's job).
"""
import os
from collections import Counter
from datetime import datetime, timedelta, timezone

from supabase import create_client

import affiliate_registry as ar
import monetization_kit as mk
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from monitor_agent import MIN_CLICKS, is_valid_affiliate_url
from ops_logger import log_operation

CN_TZ = timezone(timedelta(hours=8))
_HERE = os.path.dirname(os.path.abspath(__file__))
WORKLIST_PATH = os.path.normpath(os.path.join(_HERE, "..", "docs", "monetization-worklist.md"))


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _site_pv_daily(supabase):
    try:
        recent = supabase.table("analytics_site_daily").select(
            "total_pageviews"
        ).order("date", desc=True).limit(7).execute()
        pvs = [r.get("total_pageviews") or 0 for r in (recent.data or []) if r.get("total_pageviews")]
        if pvs:
            return round(sum(pvs) / len(pvs))
    except Exception:
        pass
    return None


def collect_leaks(supabase, registry):
    """Published tools that take outbound clicks but earn nothing, ranked by ROI,
    each tagged with its registry status."""
    rows = supabase.table("tools").select(
        "slug, name_en, click_count, affiliate_url, category, official_url"
    ).eq("status", "published").execute()

    no_program = ar.no_program_slugs(registry)
    actionable, suppressed = [], []
    for t in (rows.data or []):
        clicks = t.get("click_count") or 0
        if clicks < MIN_CLICKS:
            continue
        if is_valid_affiliate_url(t.get("affiliate_url")):
            continue  # already monetized
        slug = t["slug"]
        roi = mk.roi_score(t)
        prog = ar.program_for(slug, registry) or {}
        entry = {
            "slug": slug,
            "name": t.get("name_en") or slug,
            "clicks": clicks,
            "category": t.get("category"),
            "roi": roi,
            "status": prog.get("status") or "unlisted",
            "signup_url": prog.get("signup_url"),
            "signup_search": prog.get("signup_search"),
            "network": prog.get("network"),
            "commission": prog.get("commission"),
            "notes": prog.get("notes"),
        }
        if slug in no_program:
            suppressed.append(entry)
        else:
            actionable.append(entry)

    actionable.sort(key=lambda x: x["roi"], reverse=True)
    suppressed.sort(key=lambda x: x["roi"], reverse=True)
    return actionable, suppressed


def _next_step(e):
    if e["status"] == "unlisted":
        return f"加入 registry：搜索「{e['name']} affiliate program」确认是否有联盟"
    if e.get("signup_url"):
        net = f" · {e['network']}" if e.get("network") else ""
        comm = f" · {e['commission']}" if e.get("commission") else ""
        return f"[申请]({e['signup_url']}){net}{comm}"
    if e.get("signup_search"):
        return f"申请（搜一下直达）：「{e['signup_search']}」"
    return "确认联盟项目 / 注册"


def build_markdown(actionable, suppressed, opportunities, pv_daily):
    today = datetime.now(CN_TZ).strftime("%Y-%m-%d")
    total_leak = round(sum(e["roi"] for e in actionable), 2)

    lines = [
        f"# jilo.ai 变现工作清单（自动生成 · {today}）",
        "",
        "> 系统自动把「哪些工具在漏钱」翻译成「今天具体做什么」。人只做一步：去注册联盟。",
        "> 注册后把你的 affiliate_id / 完整带追踪链接填进 `data/affiliate_programs.json`，"
        "`affiliate_autofill.py` 会自动写入 `tools.affiliate_url`，对应 flag 自动销账。",
        "",
        "## 0. 现实校准",
    ]
    if pv_daily is not None:
        lines.append(
            f"- 当前站点 PV ≈ **{pv_daily}/天**。出站点击量随之很小，所有外部 affiliate 的"
            f"当前收益上限都不大。**§1 的自有变现是当前最高 ROI；外部 affiliate 申请在 PV 起量前是次要项。**"
        )
    lines += [
        f"- 当前可申请联盟的漏钱工具 **{len(actionable)}** 个，预估漏钱合计 **≈ ${total_leak}**"
        f"（口径：**累计出站点击 × 品类 EPC**，非月度；随真实佣金校准）。",
        f"- 已确认无联盟项目、系统已自动屏蔽不再打扰：**{len(suppressed)}** 个（见 §3）。",
        "",
        "## 1. 今天就能做（无需外部审核）—— 最高 ROI",
    ]
    if opportunities:
        for o in opportunities:
            lines.append(f"### 🎯 {o.get('title')}")
            if o.get("evidence"):
                lines.append(f"- 依据：{o['evidence']}")
            if o.get("play"):
                lines.append(f"- 动作：{o['play']}")
            lines.append("")
    else:
        lines.append("- （registry 暂无自有变现机会条目）")
        lines.append("")

    lines += [
        "## 2. 联盟申请清单（按预估漏钱排序）",
        "",
        "_漏钱口径：累计出站点击 × 品类 EPC（非月度），仅用于排序，随真实佣金校准。_",
        "",
        "| # | 工具 | 出站点击 | 预估漏钱 | 品类 | 状态 | 下一步 |",
        "|--:|------|--------:|--------:|------|------|--------|",
    ]
    # Render only the head — a 90-row table is not a worklist. The tail stays in
    # the system's queue. Surface the REAL shape of the leak: if it's flatly
    # distributed (no Pareto), say so — that's the signal to prefer §1 self-
    # monetization over grinding dozens of affiliate signups.
    TABLE_N = 25
    table_n = min(len(actionable), TABLE_N)
    head_leak = round(sum(e["roi"] for e in actionable[:table_n]), 2)
    head_pct = round(100 * head_leak / total_leak) if total_leak else 0
    for i, e in enumerate(actionable[:table_n], 1):
        lines.append(
            f"| {i} | {e['name']} (`{e['slug']}`) | {e['clicks']} | ${e['roi']} | "
            f"{e.get('category') or '?'} | {e['status']} | {_next_step(e)} |"
        )
    lines.append("")
    if table_n < len(actionable):
        lines.append(
            f"> 头部 {table_n} 个约占总预估漏钱的 **{head_pct}%**；其余 {len(actionable) - table_n} 个由系统持续监控、升上来再补入。"
        )
    if head_pct < 60:
        lines.append(
            "> **漏钱分布很平、没有 Pareto 头部** —— 靠逐个申请 affiliate 见效慢且总量有限。"
            "**当前真正的杠杆是 §1 的自有变现，不是铺开做几十个联盟申请。**"
        )
    lines.append("")

    lines += [
        "## 3. 无联盟项目（已自动屏蔽，不再进人工清单）",
        "",
    ]
    if suppressed:
        for e in suppressed:
            lines.append(f"- {e['name']} (`{e['slug']}`) — {e.get('notes') or '无联盟项目'}")
    else:
        lines.append("- （暂无）")
    lines += [
        "",
        "## 操作方式（一次注册，长期自动）",
        "1. 从 §1 开始，再按 §2 顺序处理高 ROI 工具。",
        "2. 注册通过后，编辑 `data/affiliate_programs.json` 里对应工具：",
        "   - 模板型联盟（Rewardful/FirstPromoter/Tolt/通用 ref）→ 填 `affiliate_id`（你的用户名/码）。",
        "   - 不透明联盟（Impact/PartnerStack/CJ/ShareASale）→ 把完整带追踪链接填进 `affiliate_url`。",
        "   - 确认没有联盟项目 → 把 `status` 改成 `no_program`，系统从此不再打扰。",
        "3. 系统每天自动：拼出带追踪链接 → 写入 `tools.affiliate_url` → 出站点击开始计佣 → flag 自动销账。",
        "4. 新发现的工具若属于已登记的联盟，加一条 registry 即自动变现。",
    ]
    return "\n".join(lines)


def run():
    supabase = get_supabase()
    registry = ar.load_registry()
    pv_daily = _site_pv_daily(supabase)
    actionable, suppressed = collect_leaks(supabase, registry)
    opportunities = ar.strategic_opportunities(registry)

    md = build_markdown(actionable, suppressed, opportunities, pv_daily)
    os.makedirs(os.path.dirname(WORKLIST_PATH), exist_ok=True)
    with open(WORKLIST_PATH, "w", encoding="utf-8") as f:
        f.write(md + "\n")

    total_leak = round(sum(e["roi"] for e in actionable), 2)
    return {
        "actionable": len(actionable),
        "suppressed": len(suppressed),
        "opportunities": len(opportunities),
        "est_monthly_leak_usd": total_leak,
        "pv_daily": pv_daily,
        "top": [
            {"slug": e["slug"], "roi": e["roi"], "clicks": e["clicks"], "status": e["status"]}
            for e in actionable[:5]
        ],
        "worklist_path": WORKLIST_PATH,
    }


def send_feishu_summary(result):
    # The daily human nudge is already carried by manual_blockers_report (now with
    # concrete registry signup links). To avoid Feishu 刷屏, this richer worklist
    # pushes a card only when explicitly asked (WORKLIST_SEND_FEISHU=1, e.g. a
    # manual run); the daily cron just refreshes the md + artifact silently.
    if os.getenv("WORKLIST_SEND_FEISHU", "").lower() not in ("1", "true", "yes"):
        return False
    if not FEISHU_WEBHOOK_URL:
        return False
    if not result["actionable"] and not result["opportunities"]:
        return False
    today = datetime.now(CN_TZ).strftime("%Y-%m-%d")
    top = result.get("top") or []
    lines = [
        f"**可申请联盟工具 {result['actionable']} 个 · 预估漏钱 ≈ ${result['est_monthly_leak_usd']}**（累计点击口径）",
        f"（站点 PV ≈ {result.get('pv_daily')}/天，自有变现优先）",
        "",
        "**最高 ROI（先做这几个）：**",
    ]
    for i, e in enumerate(top, 1):
        lines.append(f"{i}. `{e['slug']}` · {e['clicks']} 点击 · 漏钱 ${e['roi']} · {e['status']}")
    lines += [
        "",
        "完整清单见仓库 `docs/monetization-worklist.md`（含每个工具的注册入口 + 操作方式）。",
        "注册后填 `data/affiliate_programs.json`，系统自动写链接、自动销账。",
    ]
    return send_feishu_card(FEISHU_WEBHOOK_URL, f"jilo.ai 变现工作清单 - {today}",
                            "\n".join(lines), color="green")


if __name__ == "__main__":
    print("Building monetization worklist...")
    try:
        result = run()
        print(f"  actionable={result['actionable']} suppressed={result['suppressed']} "
              f"est_monthly_leak=${result['est_monthly_leak_usd']} -> {result['worklist_path']}")
        sent = send_feishu_summary(result)
        result["feishu_sent"] = sent
        log_operation("monetization_worklist", "success",
                      f"actionable={result['actionable']} leak=${result['est_monthly_leak_usd']} feishu={sent}",
                      result)
    except Exception as e:
        log_operation("monetization_worklist", "error", str(e))
        raise
