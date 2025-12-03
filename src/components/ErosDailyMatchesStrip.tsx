"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { erosAPI } from "@/lib/eros-api";
import { createClient } from "@/lib/supabase/client";

interface DailyMatch {
  id: string; // row id in eros_daily_matches
  user_id: string;
  match_user_id: string;
  rank?: number;
  compatibility_score?: number;
  eros_insight?: string;
}

interface ProfileLite {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  photos?: string[] | null;
}

export default function ErosDailyMatchesStrip() {
  const [matches, setMatches] = useState<DailyMatch[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      try {
        // Check if user is logged in first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return; // Don't try to load matches if not logged in
        }

        const res = await erosAPI.getDailyMatches(10);

        // Gracefully handle empty or failed responses
        if (!res || !res.success || !res.matches || res.matches.length === 0) {
          setLoading(false);
          return;
        }

        const list: DailyMatch[] = res.matches.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          match_user_id: m.match_user_id || m.matched_user_id,
          rank: m.rank,
          compatibility_score: m.compatibility_score,
          eros_insight: m.eros_insight,
        }));
        setMatches(list);

        // fetch profiles for match_user_id
        const ids = list.map((m) => m.match_user_id).filter(Boolean);
        if (ids.length) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, display_name, photo_url, photos")
            .in("id", ids);
          if (!error && Array.isArray(data)) {
            const dict: Record<string, ProfileLite> = {};
            for (const p of data) {
              dict[p.id] = p as ProfileLite;
            }
            setProfiles(dict);
          }
        }
      } catch (e) {
        // Silently fail - this is a non-essential feature
        console.warn('Failed to load daily matches:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAction = async (matchId: string, action: "like" | "skip") => {
    try {
      await erosAPI.actionOnMatch(matchId, action);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (e) {
      // ignore for now
    }
  };

  if (loading || matches.length === 0) return null;

  return (
    <div className="sticky top-[64px] z-40 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-white">
            💘 EROS Daily Matches
          </div>
          <div className="text-xs text-white/60">{matches.length} today</div>
        </div>
        <div className="flex gap-8 overflow-x-auto pb-2">
          {matches.map((m) => {
            const p = profiles[m.match_user_id];
            const photo = p?.photo_url || (Array.isArray(p?.photos) ? p?.photos?.[0] : null);
            return (
              <div key={m.id} className="min-w-[220px] bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div
                  className="relative h-36 w-56 cursor-pointer"
                  onClick={() => router.push(`/profile/${m.match_user_id}`)}
                >
                  {photo ? (
                    <Image src={photo} alt={p?.display_name || "match"} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />)
                  }
                </div>
                <div className="p-3 text-white text-sm space-y-1">
                  <div className="font-semibold truncate">{p?.display_name || "Someone new"}</div>
                  {typeof m.compatibility_score === "number" && (
                    <div className="text-xs text-white/60">Score {m.compatibility_score}</div>
                  )}
                  {m.eros_insight && (
                    <div className="text-xs text-white/70 line-clamp-2">{m.eros_insight}</div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleAction(m.id, "skip")}
                      className="flex-1 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleAction(m.id, "like")}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs"
                    >
                      Like
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
