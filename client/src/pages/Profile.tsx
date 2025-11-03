import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, getLoginUrl } from "@/const";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Trophy, Target, TrendingUp, Award, LogOut } from "lucide-react";

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  tokenBalance: number;
  rank: number;
  accuracy: number;
}

interface Prediction {
  id: number;
  track_title: string;
  artist_name: string;
  prediction_score: number;
  created_at: string;
  actual_score?: number;
  status: "pending" | "correct" | "incorrect";
}

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalPredictions: 0,
    correctPredictions: 0,
    tokenBalance: 50,
    rank: 0,
    accuracy: 0,
  });
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  async function fetchUserData() {
    setIsLoading(true);
    
    // Fetch predictions
    const { data: predictionsData, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user?.id || "demo-user")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && predictionsData) {
      setPredictions(predictionsData.map(p => ({
        id: p.id,
        track_title: "Track Title", // Would need to join with submissions table
        artist_name: "Artist Name",
        prediction_score: p.prediction_score,
        created_at: p.created_at,
        status: "pending" as const,
      })));

      // Calculate stats
      const totalPredictions = predictionsData.length;
      const correctPredictions = Math.floor(totalPredictions * 0.7); // Mock data
      const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

      setStats({
        totalPredictions,
        correctPredictions,
        tokenBalance: 50 + (correctPredictions * 5),
        rank: Math.max(1, 100 - totalPredictions),
        accuracy,
      });
    }

    setIsLoading(false);
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-200">FREQUENCY FACTORY</h1>
          <p className="text-gray-400">Sign in to view your profile</p>
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
              <span className="text-sm font-bold">{stats.tokenBalance} FT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.name || "Factory Worker"}</h2>
          <p className="text-gray-400">{user?.email || "demo@frequencyfactory.com"}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="px-4 py-1.5 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-full">
              <span className="text-sm font-bold text-orange-500">Rank #{stats.rank}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">{stats.totalPredictions}</div>
            <div className="text-xs text-gray-400">Total Predictions</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">{stats.correctPredictions}</div>
            <div className="text-xs text-gray-400">Correct</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">{stats.accuracy.toFixed(0)}%</div>
            <div className="text-xs text-gray-400">Accuracy</div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 rounded-lg p-4 text-center">
            <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">{stats.tokenBalance}</div>
            <div className="text-xs text-gray-400">FT Balance</div>
          </div>
        </div>

        {/* Recent Predictions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Recent Predictions</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No predictions yet</p>
              <Link href="/feed">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  Start Certifying Tracks
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h4 className="font-bold">{prediction.track_title}</h4>
                    <p className="text-sm text-gray-400">{prediction.artist_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prediction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-500">
                      {prediction.prediction_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prediction.status === "pending" ? "Pending" : prediction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
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
                <span className="text-xs">Rewards</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 mb-1" />
                <span className="text-xs text-gray-300">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
