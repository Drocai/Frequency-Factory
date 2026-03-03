import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  supabase,
  type LiveSession,
  type LiveCheckin as LiveCheckinType,
} from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Radio,
  Users,
  CheckCircle,
  Circle,
  Coins,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const INACTIVE_THRESHOLD = 120_000; // 2 minutes

export default function LiveCheckin() {
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [viewers, setViewers] = useState<LiveCheckinType[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const claimCheckin = trpc.live.claimCheckinReward.useMutation({
    onSuccess: data => {
      if (data.success) {
        setRewardClaimed(true);
        toast.success(`+${data.awarded} FT for checking in!`);
      }
    },
  });

  const claimActivity = trpc.live.claimActivityReward.useMutation({
    onSuccess: data => {
      if (data.success) {
        toast.success(`+${data.awarded} FT for staying active!`);
      }
    },
  });

  // Fetch active session
  const fetchSession = useCallback(async () => {
    const { data } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    setSession(data);
    return data;
  }, []);

  // Fetch active viewers for session
  const fetchViewers = useCallback(
    async (sessionId: string) => {
      const { data } = await supabase
        .from("live_checkins")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_active", true)
        .order("checked_in_at", { ascending: true });

      if (data) {
        setViewers(data);
        // Check if current user is already checked in
        if (user) {
          const myCheckin = data.find(v => v.user_id === user.id);
          if (myCheckin) {
            setIsCheckedIn(true);
            setCheckinId(myCheckin.id);
          }
        }
      }
    },
    [user]
  );

  // Check in to the session
  const handleCheckIn = async () => {
    if (!session || !user) return;

    const { data, error } = await supabase
      .from("live_checkins")
      .insert({
        session_id: session.id,
        user_id: user.id,
        user_name: user.name || "Anonymous",
        avatar_name: "BeatMaster",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to check in");
      return;
    }

    setIsCheckedIn(true);
    setCheckinId(data.id);
    toast.success("Checked in to the stream!");

    // Increment session check-in count
    await supabase
      .from("live_sessions")
      .update({ total_checkins: (session.total_checkins || 0) + 1 })
      .eq("id", session.id);

    // Claim check-in token reward
    if (!rewardClaimed) {
      claimCheckin.mutate({ sessionId: session.id });
    }
  };

  // Heartbeat: update last_active_at
  const sendHeartbeat = useCallback(async () => {
    if (!checkinId) return;

    await supabase
      .from("live_checkins")
      .update({
        last_active_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", checkinId);
  }, [checkinId]);

  // Set up heartbeat interval
  useEffect(() => {
    if (isCheckedIn && checkinId) {
      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      };
    }
  }, [isCheckedIn, checkinId, sendHeartbeat]);

  // Activity reward interval (every 5 minutes)
  useEffect(() => {
    if (isCheckedIn && session) {
      activityRef.current = setInterval(
        () => {
          claimActivity.mutate({ sessionId: session.id });
        },
        5 * 60 * 1000
      );
      return () => {
        if (activityRef.current) clearInterval(activityRef.current);
      };
    }
  }, [isCheckedIn, session]);

  // Initial load + real-time subscriptions
  useEffect(() => {
    let sessionChannel: ReturnType<typeof supabase.channel> | null = null;
    let checkinChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const activeSession = await fetchSession();
      if (!activeSession) return;

      await fetchViewers(activeSession.id);

      // Subscribe to session changes
      sessionChannel = supabase
        .channel("live_session_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "live_sessions",
          },
          () => fetchSession()
        )
        .subscribe();

      // Subscribe to check-in changes
      checkinChannel = supabase
        .channel("live_checkin_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "live_checkins",
            filter: `session_id=eq.${activeSession.id}`,
          },
          () => fetchViewers(activeSession.id)
        )
        .subscribe();
    };

    init();

    return () => {
      if (sessionChannel) supabase.removeChannel(sessionChannel);
      if (checkinChannel) supabase.removeChannel(checkinChannel);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (activityRef.current) clearInterval(activityRef.current);
    };
  }, [fetchSession, fetchViewers]);

  // Mark as inactive on unmount
  useEffect(() => {
    return () => {
      if (checkinId) {
        supabase
          .from("live_checkins")
          .update({ is_active: false })
          .eq("id", checkinId);
      }
    };
  }, [checkinId]);

  // Determine if a viewer is "cold" (inactive)
  const isViewerActive = (viewer: LiveCheckinType) => {
    const lastActive = new Date(viewer.last_active_at).getTime();
    return Date.now() - lastActive < INACTIVE_THRESHOLD;
  };

  const activeViewers = viewers.filter(isViewerActive);
  const inactiveViewers = viewers.filter(v => !isViewerActive(v));

  if (!session) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <Radio className="h-4 w-4" />
          <span className="text-sm">No live stream active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-bold text-white">
            {session.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Users className="h-3.5 w-3.5" />
          <span>{activeViewers.length} active</span>
        </div>
      </div>

      {/* Check-in CTA */}
      {user && !isCheckedIn && (
        <div className="p-4 border-b border-zinc-800 bg-orange-500/5">
          <Button
            onClick={handleCheckIn}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Check In to Stream (+2 FT)
          </Button>
        </div>
      )}

      {isCheckedIn && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Checked in — earning activity rewards</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Coins className="h-3 w-3" />
              <span>+1 FT / 5 min</span>
            </div>
          </div>
        </div>
      )}

      {/* Viewer List */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {/* Active viewers */}
        <AnimatePresence>
          {activeViewers.map(viewer => (
            <motion.div
              key={viewer.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50"
            >
              <Circle className="h-2 w-2 fill-green-500 text-green-500 shrink-0" />
              <span className="text-sm text-white truncate">
                {viewer.user_name || "Anonymous"}
              </span>
              {viewer.messages_sent > 0 && (
                <span className="text-[10px] text-zinc-500 ml-auto">
                  {viewer.messages_sent} msgs
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Inactive viewers (dimmed) */}
        {inactiveViewers.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-3 mb-1 px-2">
              <Clock className="h-3 w-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Idle ({inactiveViewers.length})
              </span>
            </div>
            {inactiveViewers.map(viewer => (
              <div
                key={viewer.id}
                className="flex items-center gap-2.5 py-1 px-2 opacity-40"
              >
                <Circle className="h-2 w-2 fill-zinc-600 text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-500 truncate">
                  {viewer.user_name || "Anonymous"}
                </span>
              </div>
            ))}
          </>
        )}

        {viewers.length === 0 && (
          <p className="text-center text-zinc-600 text-xs py-4">
            No one checked in yet — be the first!
          </p>
        )}
      </div>
    </div>
  );
}
