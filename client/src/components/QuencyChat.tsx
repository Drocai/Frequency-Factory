import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
// QUENCY uses local fallback responses for now

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUENCY_INTRO = `👋 **Welcome to the Factory!** I'm QUENCY, your AI Superfan guide. I can help you:

• Understand how predictions work
• Learn about token tiers & rewards
• Find trending tracks
• Answer any questions about the Factory

What would you like to know?`;

// Fallback responses when API fails
const FALLBACK_RESPONSES: Record<string, string> = {
  token: "💰 **Frequency Tokens (FT)** are earned by making accurate predictions!\n\n**Token Tiers:**\n• **Red FT** (Common) - Basic predictions\n• **Blue FT** (Uncommon) - Accurate predictions\n• **Purple FT** (Rare) - Exceptional accuracy\n• **Gold FT** (Legendary) - Top predictors\n\nThe more accurate you are, the more valuable tokens you earn!",
  predict: "🎯 **How Predictions Work:**\n\n1. Listen to a track in your feed\n2. Rate it using Factory Metrics (Hook, Originality, Production)\n3. Lock in your prediction\n4. Earn tokens when you're accurate!\n\nTip: Consider production quality, originality, and mass appeal when rating tracks.",
  reward: "🎁 **Rewards & Redemption:**\n\nUse your FT to unlock:\n• Exclusive merch\n• Spotify Premium\n• Profile badges\n• Early track access\n• Skip the queue\n\nCheck the Rewards page to see what you can redeem!",
  submit: "🎵 **Submitting Tracks:**\n\n1. Go to the Submit page\n2. Paste your Spotify/YouTube/SoundCloud link\n3. Fill in artist name, track title, genre\n4. Get your ticket and join the conveyor!\n\nYou'll earn +1 FT for each submission!",
  queue: "🏭 **The Factory Queue:**\n\nTracks are processed in order on our conveyor belt. You can:\n• View your position in the Factory Monitor\n• Pay 10 FT to skip ahead\n• Track your ETA in real-time\n\nSkips don't kick others out—they just reorder fairly!",
  default: "🤔 Great question! The Frequency Factory is where raw tracks get built into hits through community predictions.\n\nThe more you engage and make accurate predictions, the more you'll earn! Want to know more about predictions, tokens, or rewards?",
};

function getFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("token") || lowerQuery.includes("ft") || lowerQuery.includes("earn")) {
    return FALLBACK_RESPONSES.token;
  }
  if (lowerQuery.includes("predict") || lowerQuery.includes("certify") || lowerQuery.includes("rate")) {
    return FALLBACK_RESPONSES.predict;
  }
  if (lowerQuery.includes("reward") || lowerQuery.includes("redeem") || lowerQuery.includes("spend")) {
    return FALLBACK_RESPONSES.reward;
  }
  if (lowerQuery.includes("submit") || lowerQuery.includes("upload") || lowerQuery.includes("track")) {
    return FALLBACK_RESPONSES.submit;
  }
  if (lowerQuery.includes("queue") || lowerQuery.includes("skip") || lowerQuery.includes("monitor")) {
    return FALLBACK_RESPONSES.queue;
  }
  return FALLBACK_RESPONSES.default;
}

export default function QuencyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: QUENCY_INTRO },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const userInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use intelligent fallback responses
      await new Promise((resolve) => setTimeout(resolve, 500));
      const responseContent = getFallbackResponse(userInput);

      setMessages((prev) => [...prev, { role: "assistant", content: responseContent }]);
    } catch (error) {
      console.error("QUENCY error:", error);
      // Use fallback on error
      const fallback = getFallbackResponse(userInput);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50 z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-80 sm:w-96 h-[500px] bg-gray-900 border border-gray-800 rounded-2xl shadow-xl z-40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-pink-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">QUENCY</h3>
                <p className="text-xs text-gray-400">AI Superfan Guide</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm leading-relaxed">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm p-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {["How do tokens work?", "How to submit?", "Skip queue?"].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => handleSend(), 100);
                }}
                className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask QUENCY anything..."
                className="bg-gray-800 border-gray-700 text-white rounded-xl"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
