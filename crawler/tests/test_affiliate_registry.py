# crawler/tests/test_affiliate_registry.py
#
# The monetization last mile. affiliate_registry assembles a tracked URL from an
# operator-supplied id (or passes a pasted opaque link through) and never invents
# credentials; affiliate_autofill writes tools.affiliate_url ONLY when the result
# carries a real tracking marker (invariant I5) and is idempotent. These are the
# pieces that, once a human signs up once, monetize a tool for good — so their
# edge cases are worth pinning.
import types
import unittest

import affiliate_registry as ar
import affiliate_autofill as af


def _registry(programs, networks=None):
    return {
        "networks": networks or {
            "firstpromoter": {"template": "{base}?fpr={id}", "opaque": False},
            "rewardful": {"template": "{base}?via={id}", "opaque": False},
            "partnerstack": {"template": None, "opaque": True},
        },
        "programs": programs,
        "strategic_opportunities": [],
    }


class TestResolveTrackedUrl(unittest.TestCase):
    def test_template_network_builds_link(self):
        reg = _registry({"writesonic": {"status": "ready", "network": "firstpromoter", "affiliate_id": "jilo"}})
        url, src = ar.resolve_tracked_url("writesonic", "https://writesonic.com/", reg)
        self.assertEqual(url, "https://writesonic.com?fpr=jilo")
        self.assertEqual(src, "template:firstpromoter")

    def test_pasted_full_link_passes_through(self):
        reg = _registry({"canva": {"status": "ready", "network": "partnerstack",
                                    "affiliate_url": "https://canva.com/join?irclickid=x"}})
        url, src = ar.resolve_tracked_url("canva", "https://canva.com", reg)
        self.assertEqual(url, "https://canva.com/join?irclickid=x")
        self.assertEqual(src, "pasted_full_link")

    def test_opaque_network_with_id_only_refuses(self):
        # can't synthesize an opaque link from an id — operator must paste full URL
        reg = _registry({"notion": {"status": "ready", "network": "partnerstack", "affiliate_id": "x"}})
        url, src = ar.resolve_tracked_url("notion", "https://notion.so", reg)
        self.assertIsNone(url)
        self.assertTrue(src.startswith("network_opaque_needs_full_url"))

    def test_no_id_awaits(self):
        reg = _registry({"runway": {"status": "needs_check", "network": "firstpromoter"}})
        url, src = ar.resolve_tracked_url("runway", "https://runway.com", reg)
        self.assertIsNone(url)
        self.assertEqual(src, "awaiting_affiliate_id_or_url")

    def test_no_program_resolves_to_none(self):
        reg = _registry({"chatgpt": {"status": "no_program", "network": "none"}})
        url, src = ar.resolve_tracked_url("chatgpt", "https://openai.com", reg)
        self.assertIsNone(url)
        self.assertEqual(src, "no_program")

    def test_unlisted_tool(self):
        url, src = ar.resolve_tracked_url("never-heard-of-it", "https://x.com", _registry({}))
        self.assertEqual(src, "no_registry_entry")

    def test_no_program_slugs(self):
        reg = _registry({
            "chatgpt": {"status": "no_program"},
            "perplexity-ai": {"status": "no_program"},
            "canva": {"status": "ready", "network": "partnerstack", "affiliate_url": "https://c/?ref=1"},
        })
        self.assertEqual(ar.no_program_slugs(reg), {"chatgpt", "perplexity-ai"})


class _FakeQuery:
    def __init__(self, rows):
        self._rows = rows

    def select(self, *a, **k):
        return self

    def eq(self, *a, **k):
        return self

    def in_(self, col, vals):
        self._rows = [r for r in self._rows if r.get(col) in vals]
        return self

    def execute(self):
        return types.SimpleNamespace(data=self._rows)


class _FakeSB:
    def __init__(self, tools):
        self._tools = tools

    def table(self, name):
        return _FakeQuery(list(self._tools))


class TestAutofillPlan(unittest.TestCase):
    def test_templated_id_produces_valid_fill(self):
        reg = _registry({"writesonic": {"status": "ready", "network": "firstpromoter", "affiliate_id": "jilo"}})
        sb = _FakeSB([{"slug": "writesonic", "name_en": "Writesonic",
                       "official_url": "https://writesonic.com", "affiliate_url": None}])
        fills, skipped = af.plan_fills(sb, reg)
        self.assertEqual(len(fills), 1)
        self.assertEqual(fills[0]["url"], "https://writesonic.com?fpr=jilo")

    def test_idempotent_when_already_filled(self):
        reg = _registry({"writesonic": {"status": "ready", "network": "firstpromoter", "affiliate_id": "jilo"}})
        sb = _FakeSB([{"slug": "writesonic", "name_en": "Writesonic",
                       "official_url": "https://writesonic.com",
                       "affiliate_url": "https://writesonic.com?fpr=jilo"}])
        fills, skipped = af.plan_fills(sb, reg)
        self.assertEqual(fills, [])
        self.assertIn("already_filled", [s["reason"] for s in skipped])

    def test_refuses_to_write_untracked_pasted_link(self):
        # operator pasted a bare URL with no tracking marker -> must NOT be written
        reg = _registry({"canva": {"status": "ready", "network": "partnerstack",
                                    "affiliate_url": "https://www.canva.com"}})
        sb = _FakeSB([{"slug": "canva", "name_en": "Canva",
                       "official_url": "https://www.canva.com", "affiliate_url": None}])
        fills, skipped = af.plan_fills(sb, reg)
        self.assertEqual(fills, [])
        self.assertTrue(any(s["reason"].startswith("resolved_but_untracked") for s in skipped))

    def test_no_program_is_skipped(self):
        reg = _registry({"chatgpt": {"status": "no_program"}})
        sb = _FakeSB([{"slug": "chatgpt", "name_en": "ChatGPT",
                       "official_url": "https://openai.com", "affiliate_url": None}])
        fills, skipped = af.plan_fills(sb, reg)
        self.assertEqual(fills, [])
        self.assertIn("no_program", [s["reason"] for s in skipped])


if __name__ == "__main__":
    unittest.main()
