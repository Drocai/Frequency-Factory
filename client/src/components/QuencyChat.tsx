import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function QuencyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 **Welcome to the Factory!** I'm QUENCY, your AI Superfan guide. I can help you:\n\n• Understand how predictions work\n• Learn about token tiers\n• Find trending tracks\n• Answer any questions about the Factory\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // In production, this would call your backend LLM endpoint
      // For now, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        role: "assistant",
        content: getQuencyResponse(input),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function getQuencyResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("token") || lowerQuery.includes("ft")) {
      return "💰 **Frequency Tokens (FT)** are earned by making accurate predictions!\n\n**Token Tiers:**\n• **Red FT** (Common) - Basic predictions\n• **Blue FT** (Uncommon) - Accurate predictions\n• **Purple FT** (Rare) - Exceptional accuracy\n• **Gold FT** (Legendary) - Top predictors\n\nThe more accurate you are, the more valuable tokens you earn!";
    }

    if (lowerQuery.includes("predict") || lowerQuery.includes("certify")) {
      return "🎯 **How Predictions Work:**\n\n1. Listen to a track in your feed\n2. Rate it 0-10 based on hit potential\n3. Lock in your prediction\n4. Earn tokens when you're accurate!\n\nTip: Consider production quality, originality, and mass appeal when rating tracks.";
    }

    if (lowerQuery.includes("reward") || lowerQuery.includes("redeem")) {
      return "🎁 **Rewards & Redemption:**\n\nUse your FT to unlock:\n• Exclusive merch\n• Spotify Premium\n• Profile badges\n• Early track access\n• Virtual meet & greets\n\nCheck the Rewards page to see what you can redeem!";
    }

    if (lowerQuery.includes("submit") || lowerQuery.includes("upload")) {
      return "🎵 **Submitting Tracks:**\n\n1. Go to the Submit page\n2. Fill in artist name, track title, genre\n3. Upload your audio file (max 16MB)\n4. Wait 24-48h for review\n\nMake sure your track is original and high-quality!";
    }

    if (lowerQuery.includes("help") || lowerQuery.includes("how")) {
      return "🏭 **Factory Basics:**\n\n• **Discover** - Browse and certify tracks\n• **Submit** - Upload your own music\n• **Rewards** - Redeem tokens & compete\n• **Profile** - Track your stats\n\nWhat specific area would you like to know more about?";
    }

    return "🤔 Interesting question! I'm still learning, but here's what I know:\n\nThe Frequency Factory is where raw tracks get built into hits through community predictions. The more you engage and make accurate predictions, the more you'll earn!\n\nWant to know more about predictions, tokens, or rewards?";
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
        <div className="fixed bottom-24 right-4 w-80 h-[500px] bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-40 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-pink-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                Q
              </div>
              <div>
                <h3 className="font-bold">QUENCY</h3>
                <p className="text-xs text-gray-400">AI Superfan Guide</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
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
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
