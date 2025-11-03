import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, getLoginUrl } from "@/const";
import { useState } from "react";
import { Link } from "wouter";
import { Trophy, Crown, Medal, Gift, Star } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  name: string;
  tokens: number;
  accuracy: number;
  predictions: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  tier: "red" | "blue" | "purple" | "gold";
  icon: string;
}

export default function Rewards() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "store">("leaderboard");
  const userTokens = 50;

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: "FrequencyKing", tokens: 1250, accuracy: 92, predictions: 156 },
    { rank: 2, name: "BeatMaster", tokens: 980, accuracy: 88, predictions: 142 },
    { rank: 3, name: "SoundOracle", tokens: 875, accuracy: 85, predictions: 128 },
    { rank: 4, name: "VibeChecker", tokens: 720, accuracy: 82, predictions: 115 },
    { rank: 5, name: "TrackHunter", tokens: 650, accuracy: 80, predictions: 98 },
    { rank: 6, name: "MusicSeer", tokens: 580, accuracy: 78, predictions: 89 },
    { rank: 7, name: "HitPredictor", tokens: 520, accuracy: 75, predictions: 82 },
    { rank: 8, name: "You", tokens: userTokens, accuracy: 70, predictions: 15 },
  ];

  const rewards: Reward[] = [
    {
      id: "merch-tshirt",
      title: "Factory T-Shirt",
      description: "Exclusive Frequency Factory merch",
      cost: 500,
      tier: "blue",
      icon: "👕",
    },
    {
      id: "discount-spotify",
      title: "Spotify Premium (3 months)",
      description: "3 months of Spotify Premium",
      cost: 750,
      tier: "purple",
      icon: "🎵",
    },
    {
      id: "badge-gold",
      title: "Gold Predictor Badge",
      description: "Exclusive profile badge",
      cost: 1000,
      tier: "gold",
      icon: "🏆",
    },
    {
      id: "early-access",
      title: "Early Track Access",
      description: "Get tracks 24h before others",
      cost: 250,
      tier: "red",
      icon: "⚡",
    },
    {
      id: "custom-avatar",
      title: "Custom Vibe-atar",
      description: "Personalized avatar design",
      cost: 300,
      tier: "blue",
      icon: "🎨",
    },
    {
      id: "meet-artist",
      title: "Virtual Meet & Greet",
      description: "Meet featured artists",
      cost: 1500,
      tier: "gold",
      icon: "🎤",
    },
  ];

  function handleRedeem(reward: Reward) {
    if (userTokens >= reward.cost) {
      toast.success(`Redeemed: ${reward.title}!`);
    } else {
      toast.error(`Not enough tokens. Need ${reward.cost - userTokens} more FT`);
    }
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-200">FREQUENCY FACTORY</h1>
          <p className="text-gray-400">Sign in to view rewards</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-orange-500/50"
          >
            ENTER THE FACTORY
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt="Logo" className="h-8" />
          </Link>
          <h1 className="text-xl font-bold">FREQUENCY FACTORY</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-full border border-orange-500/30">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">{userTokens} FT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Rewards</h2>
          <p className="text-gray-400">Compete, earn tokens, and redeem rewards</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "leaderboard" ? "default" : "outline"}
            onClick={() => setActiveTab("leaderboard")}
            className={activeTab === "leaderboard" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === "store" ? "default" : "outline"}
            onClick={() => setActiveTab("store")}
            className={activeTab === "store" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Gift className="w-4 h-4 mr-2" />
            Token Store
          </Button>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`bg-gray-900 border rounded-lg p-4 flex items-center gap-4 ${
                  entry.name === "You"
                    ? "border-orange-500/50 bg-orange-900/10"
                    : "border-gray-800"
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  {entry.rank === 1 && <Crown className="w-8 h-8 text-yellow-500" />}
                  {entry.rank === 2 && <Medal className="w-8 h-8 text-gray-400" />}
                  {entry.rank === 3 && <Medal className="w-8 h-8 text-orange-600" />}
                  {entry.rank > 3 && (
                    <div className="text-2xl font-bold text-gray-500">#{entry.rank}</div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{entry.name}</h4>
                  <p className="text-sm text-gray-400">{entry.predictions} predictions</p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-500">{entry.tokens} FT</div>
                  <div className="text-xs text-gray-500">{entry.accuracy}% accuracy</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Token Store Tab */}
        {activeTab === "store" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-gray-900 border rounded-lg p-6 ${
                  reward.tier === "gold"
                    ? "border-yellow-500/30"
                    : reward.tier === "purple"
                    ? "border-purple-500/30"
                    : reward.tier === "blue"
                    ? "border-blue-500/30"
                    : "border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{reward.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{reward.title}</h4>
                    <p className="text-sm text-gray-400">{reward.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span className="font-bold">{reward.cost} FT</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(reward)}
                    disabled={userTokens < reward.cost}
                    className={
                      userTokens >= reward.cost
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        : "opacity-50 cursor-not-allowed"
                    }
                  >
                    {userTokens >= reward.cost ? "REDEEM" : "LOCKED"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link href="/feed">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 mb-1" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 mb-1" />
                <span className="text-xs">Discover</span>
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-1" />
                <span className="text-xs">Submit</span>
              </Button>
            </Link>
            <Link href="/rewards">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 mb-1" />
                <span className="text-xs text-green-500">Rewards</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 mb-1" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
