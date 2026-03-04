import { useState, useEffect } from "react";
import { supabase, type LiveSession } from "@/lib/supabase";
import LiveCheckin from "@/components/LiveCheckin";
import LiveStreamChat from "@/components/LiveStreamChat";
import { Radio } from "lucide-react";

export default function Live() {
  const [session, setSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("is_active", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSession(data ?? null);
    };

    fetchSession();

    // Subscribe to session changes
    const channel = supabase
      .channel("live_page_session")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => fetchSession()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Rajdhani, Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="/assets/frequency-crown-actual.png"
            alt="FF"
            className="w-6 h-6 object-contain"
          />
          <h1 className="text-lg font-bold tracking-wide">
            FREQUENCY FACTORY
          </h1>
          {session && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Radio className="h-4 w-4 text-red-500" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="text-sm text-red-400 font-semibold">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {session ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chat — takes 2/3 on desktop */}
            <div className="lg:col-span-2 flex flex-col">
              <h2 className="text-lg font-bold mb-3 text-orange-400">
                {session.title}
              </h2>
              <LiveStreamChat sessionId={session.id} />
            </div>

            {/* Sidebar — check-in + viewers */}
            <div className="space-y-4">
              <LiveCheckin />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Radio className="h-12 w-12 text-zinc-700 mb-4" />
            <h2 className="text-xl font-bold text-zinc-400 mb-2">
              No Stream Active
            </h2>
            <p className="text-zinc-600 text-sm max-w-md">
              Check back when the streamer goes live. You'll be able to check
              in, chat, and earn Frequency Tokens for your activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
