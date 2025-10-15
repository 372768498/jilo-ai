// components/SaveButton.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const UK = "jilo_user_key";
function getUserKey(): string {
  if (typeof window === "undefined") return "";
  let k = localStorage.getItem(UK);
  if (!k) {
    k = crypto.randomUUID();
    localStorage.setItem(UK, k);
  }
  return k;
}

export default function SaveButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userKey, setUserKey] = useState("");

  useEffect(() => {
    setUserKey(getUserKey());
  }, []);

  const save = async () => {
    if (busy || !userKey) return;
    setBusy(true);
    try {
      await supabase.from("user_actions").insert({
        user_key: userKey,
        tool_slug: slug,
        action: "bookmark",
      });
      setSaved(true);
    } catch {}
    setBusy(false);
  };

  return (
    <button
      onClick={save}
      disabled={busy || saved}
      className={`px-3 py-1 rounded-full border text-sm ${
        saved ? "bg-emerald-600 text-white" : "bg-white"
      }`}
      title="Save to your list (anonymous)"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
