import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  supabase,
  type LiveSession,
  type LiveChatMessage,
} from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const MAX_MESSAGE_LENGTH = 300;
const MESSAGE_COOLDOWN = 2000; // 2 seconds between messages

export default function LiveStreamChat({
  sessionId,
}: {
  sessionId: string | null;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from("live_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) setMessages(data);
  }, [sessionId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!sessionId) return;

    fetchMessages();

    const channel = supabase
      .channel("live_chat_stream")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        payload => {
          setMessages(prev => [...prev, payload.new as LiveChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a message
  const handleSend = async () => {
    if (!sessionId || !user || !input.trim() || cooldown) return;

    const messageText = input.trim().slice(0, MAX_MESSAGE_LENGTH);
    setInput("");
    setCooldown(true);

    await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: user.name || "Anonymous",
      avatar_name: "BeatMaster",
      message: messageText,
      message_type: "chat",
    });

    // Update user's message count in check-in
    await supabase.rpc("increment_checkin_messages", {
      p_session_id: sessionId,
      p_user_id: user.id,
    }).then(() => {}, () => {
      // RPC may not exist yet — silently ignore
    });

    // Increment session message count
    await supabase
      .from("live_sessions")
      .select("total_messages")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase
            .from("live_sessions")
            .update({ total_messages: (data.total_messages || 0) + 1 })
            .eq("id", sessionId);
        }
      });

    // Cooldown timer
    setTimeout(() => setCooldown(false), MESSAGE_COOLDOWN);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format timestamp to relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!sessionId) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
        <MessageCircle className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-sm">
          Chat will be available when a stream is live
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
        <MessageCircle className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-bold text-white">Live Chat</span>
        <span className="text-[10px] text-zinc-500 ml-auto">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-80">
        <div ref={scrollRef} className="p-3 space-y-2">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                {msg.message_type === "system" ? (
                  <div className="text-center py-1">
                    <span className="text-[10px] text-zinc-600 italic">
                      {msg.message}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-orange-400 shrink-0">
                          {msg.user_name || "Anon"}
                        </span>
                        <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <p className="text-center text-zinc-600 text-xs py-8">
              No messages yet — say something!
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {user ? (
        <div className="p-3 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || cooldown}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs">Sign in to chat</p>
        </div>
      )}
    </div>
  );
}
